import type { Agent } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ENS_KEYS, setTextRecords } from "@/lib/ens";
import { getExecutions } from "@/lib/keeperhub";
import { computeScore, type ReputationExecution } from "@/lib/reputation";
import type { KeeperHubExecution } from "@/types";

/** Message the operator must sign to call POST /api/sync (same string as client `signMessage`). */
export const syncSignMessage = (ensName: string) => `AgentCred:sync:${ensName}`;

function normalizeKhStatus(status: string): "success" | "failed" | "pending" {
  const s = String(status).toLowerCase();
  if (s === "success" || s === "completed" || s === "succeeded") return "success";
  if (s === "failed" || s === "error" || s === "reverted") return "failed";
  return "pending";
}

function parseKhTimestamp(ex: KeeperHubExecution): Date {
  const raw = ex.timestamp ?? ex.createdAt;
  if (!raw) return new Date();
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function toReputationExecutions(rows: KeeperHubExecution[]): ReputationExecution[] {
  return rows.map((ex) => ({
    status: normalizeKhStatus(String(ex.status ?? "pending")),
    timestamp: parseKhTimestamp(ex),
    gasUsed: ex.gasUsed != null ? String(ex.gasUsed) : undefined,
  }));
}

function formatSuccessRatePct(rate: number): string {
  return `${rate % 1 === 0 ? rate.toFixed(0) : rate.toFixed(1)}%`;
}

/**
 * Pull executions from KeeperHub, refresh SQLite, append score history, update ENS text records.
 */
export async function syncAgentFromKeeperHub(agent: Agent): Promise<{ synced: number; newScore: number }> {
  if (!agent.keeperhubId) {
    throw new Error("Agent has no KeeperHub project ID");
  }

  const rows = await getExecutions(agent.keeperhubId, 500);
  const reputationInput = toReputationExecutions(rows);
  const { score, successRate, streak } = computeScore(reputationInput);

  const sortedByTime = [...rows].sort(
    (a, b) => parseKhTimestamp(b).getTime() - parseKhTimestamp(a).getTime(),
  );
  const latest = sortedByTime[0];
  const lastExecutionDate = latest ? parseKhTimestamp(latest) : null;

  await prisma.$transaction(async (tx) => {
    await tx.execution.deleteMany({ where: { agentId: agent.id } });

    for (const ex of rows) {
      const ts = parseKhTimestamp(ex);

      await tx.execution.create({
        data: {
          agentId: agent.id,
          txHash: (ex.txHash ?? ex.transactionHash ?? null) as string | null,
          status: normalizeKhStatus(String(ex.status ?? "pending")),
          gasUsed: ex.gasUsed != null ? String(ex.gasUsed) : null,
          timestamp: ts,
          metadata: JSON.stringify(ex),
        },
      });
    }

    await tx.agent.update({
      where: { id: agent.id },
      data: {
        score,
        successRate,
        streak,
        totalExecutions: rows.length,
        lastExecution: lastExecutionDate,
      },
    });

    if (score !== agent.score) {
      await tx.scoreHistory.create({
        data: {
          agentId: agent.id,
          score,
        },
      });
    }
  });

  const lastIso = lastExecutionDate ? lastExecutionDate.toISOString() : "";

  await setTextRecords(agent.ensName, {
    [ENS_KEYS.SCORE]: String(score),
    [ENS_KEYS.EXECUTIONS]: String(rows.length),
    [ENS_KEYS.SUCCESS_RATE]: formatSuccessRatePct(successRate),
    [ENS_KEYS.LAST_EXECUTION]: lastIso,
    [ENS_KEYS.STATUS]: agent.status,
  });

  return { synced: rows.length, newScore: score };
}
