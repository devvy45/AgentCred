import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ENS_KEYS, setTextRecords } from "@/lib/ens";
import { computeScore } from "@/lib/reputation";

export async function POST(request: Request) {
  const { ensName, status = "success" } = await request.json();

  const agent = await prisma.agent.findFirst({ where: { ensName } });
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  await prisma.execution.create({
    data: {
      agentId: agent.id,
      status,
      timestamp: new Date(),
      txHash: `0xsimulated${Date.now()}`,
      gasUsed: "21000",
    },
  });

  const executions = await prisma.execution.findMany({ where: { agentId: agent.id } });
  const { score, successRate, streak } = computeScore(executions.map(e => ({
    status: e.status as "success" | "failed" | "pending",
    timestamp: e.timestamp,
  })));

  await prisma.agent.update({
    where: { id: agent.id },
    data: { score, successRate, streak, totalExecutions: executions.length, lastExecution: new Date() },
  });

  await prisma.scoreHistory.create({ data: { agentId: agent.id, score } });

  try {
    await setTextRecords(ensName, {
      [ENS_KEYS.SCORE]: String(score),
      [ENS_KEYS.SUCCESS_RATE]: `${successRate}%`,
      [ENS_KEYS.EXECUTIONS]: String(executions.length),
      [ENS_KEYS.LAST_EXECUTION]: new Date().toISOString(),
    });
  } catch { /* ENS write best-effort */ }

  return NextResponse.json({ score, successRate, streak, totalExecutions: executions.length });
}