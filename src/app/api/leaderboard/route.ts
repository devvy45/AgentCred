import { type Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseJsonArray } from "@/lib/utils";
import type { AgentWithStats } from "@/types";

function parseListParam(value: string | null): string[] {
  if (!value?.trim()) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * GET /api/leaderboard
 * Query: search, capability (comma or repeat), chain (comma or repeat), minScore, status (active|all|flagged|suspended), limit, offset
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim().toLowerCase() ?? "";
    const capabilities = searchParams.getAll("capability").flatMap((c) => parseListParam(c));
    const chains = searchParams.getAll("chain").flatMap((c) => parseListParam(c));
    const uniqueCapabilities = Array.from(new Set(capabilities));
    const uniqueChains = Array.from(new Set(chains));

    const minScoreRaw = searchParams.get("minScore");
    const minScore = minScoreRaw != null && minScoreRaw !== "" ? Number(minScoreRaw) : undefined;
    const status = searchParams.get("status")?.trim() ?? "active";
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 50) || 50));
    const offset = Math.max(0, Number(searchParams.get("offset") ?? 0) || 0);

    const where: Prisma.AgentWhereInput = {};
    if (status && status !== "all") {
      where.status = status;
    }
    if (minScore != null && !Number.isNaN(minScore)) {
      where.score = { gte: minScore };
    }

    const candidates = await prisma.agent.findMany({
      where,
      orderBy: [{ score: "desc" }, { registeredAt: "asc" }],
    });

    const filtered = candidates.filter((agent) => {
      const caps = parseJsonArray(agent.capabilities);
      const chs = parseJsonArray(agent.chains);

      if (uniqueCapabilities.length > 0 && !uniqueCapabilities.every((c) => caps.includes(c))) {
        return false;
      }
      if (uniqueChains.length > 0 && !uniqueChains.every((c) => chs.includes(c))) {
        return false;
      }
      if (search) {
        const blob = [agent.ensName, agent.description ?? "", ...caps, ...chs].join(" ").toLowerCase();
        if (!blob.includes(search)) return false;
      }
      return true;
    });

    const total = filtered.length;
    const page = filtered.slice(offset, offset + limit);

    const agents: AgentWithStats[] = page.map((agent) => ({
      ...agent,
      executions: [],
      scoreHistory: [],
      capabilitiesList: parseJsonArray(agent.capabilities),
      chainsList: parseJsonArray(agent.chains),
    }));

    return NextResponse.json({ agents, total });
  } catch (err) {
    return NextResponse.json({
      agents: [],
      total: 0,
      error: err instanceof Error ? err.message : "leaderboard unavailable",
    });
  }
}
