import { NextResponse } from "next/server";
import { getAddress, isAddress } from "viem";
import { prisma } from "@/lib/db";
import { getAgentProfile } from "@/lib/ens";
import { parseJsonArray } from "@/lib/utils";

/**
 * GET /api/dashboard?operatorAddress=0x...
 * Returns the connected operator's cached agent data plus live AgentCred ENS text records.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("operatorAddress")?.trim() ?? "";

  if (!raw || !isAddress(raw)) {
    return NextResponse.json({ error: "Valid operatorAddress is required" }, { status: 400 });
  }

  const operatorAddress = getAddress(raw);
  const agent = await prisma.agent.findUnique({
    where: { operatorAddress },
    include: {
      executions: {
        orderBy: { timestamp: "desc" },
        take: 10,
      },
      scoreHistory: {
        orderBy: { timestamp: "asc" },
      },
    },
  });

  if (!agent) {
    return NextResponse.json({ error: "No registered agent found for this wallet" }, { status: 404 });
  }

  const ensProfile = await getAgentProfile(agent.ensName).catch(() => null);

  return NextResponse.json({
    agent: {
      ...agent,
      capabilitiesList: parseJsonArray(agent.capabilities),
      chainsList: parseJsonArray(agent.chains),
    },
    ensProfile,
  });
}
