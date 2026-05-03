import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseJsonArray } from "@/lib/utils";
import type { AgentWithStats } from "@/types";

type RouteContext = { params: { name: string } };

/**
 * GET /api/agent/[name]
 * Resolves by exact `ensName` in SQLite. Returns cached executions + score history.
 */
export async function GET(_request: Request, context: RouteContext) {
  const ensName = decodeURIComponent(context.params.name);

  const row = await prisma.agent.findUnique({
    where: { ensName },
    include: {
      executions: { orderBy: { timestamp: "desc" } },
      scoreHistory: { orderBy: { timestamp: "asc" } },
    },
  });

  if (!row) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const agent: AgentWithStats = {
    ...row,
    capabilitiesList: parseJsonArray(row.capabilities),
    chainsList: parseJsonArray(row.chains),
    executions: row.executions,
    scoreHistory: row.scoreHistory,
  };

  return NextResponse.json({
    agent,
    executions: row.executions,
    scoreHistory: row.scoreHistory,
  });
}
