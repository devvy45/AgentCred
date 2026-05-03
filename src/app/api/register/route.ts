import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getAddress, isAddress } from "viem";
import { prisma } from "@/lib/db";
import { ENS_KEYS, setTextRecords } from "@/lib/ens";

type RegisterBody = {
  ensName?: string;
  operatorAddress?: string;
  capabilities?: unknown;
  chains?: unknown;
  description?: string;
  keeperhubId?: string;
};

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((x) => typeof x === "string" && x.trim().length > 0);
}

/**
 * POST /api/register
 * Persists agent in SQLite, then writes AgentCred ENS text records (server wallet).
 */
export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const body = json as RegisterBody;
  const ensName = typeof body.ensName === "string" ? body.ensName.trim() : "";
  const operatorRaw = typeof body.operatorAddress === "string" ? body.operatorAddress.trim() : "";
  const description =
    typeof body.description === "string" ? body.description.slice(0, 280).trim() || undefined : undefined;
  const keeperhubId =
    typeof body.keeperhubId === "string" ? body.keeperhubId.trim() || undefined : undefined;

  if (!ensName || !ensName.includes(".")) {
    return NextResponse.json({ error: "Valid ensName is required" }, { status: 400 });
  }
  if (!operatorRaw || !isAddress(operatorRaw)) {
    return NextResponse.json({ error: "Valid operatorAddress is required" }, { status: 400 });
  }
  if (
    !isStringArray(body.capabilities) ||
    !isStringArray(body.chains) ||
    body.capabilities.length === 0 ||
    body.chains.length === 0
  ) {
    return NextResponse.json(
      { error: "capabilities and chains must be non-empty string arrays" },
      { status: 400 },
    );
  }

  const capabilities = body.capabilities.map((c) => c.trim());
  const chains = body.chains.map((c) => c.trim());
  const operatorAddress = getAddress(operatorRaw);

  let agent;
  try {
    agent = await prisma.agent.upsert({
      where: { operatorAddress },
      create: {
        ensName,
        operatorAddress,
        capabilities: JSON.stringify(capabilities),
        chains: JSON.stringify(chains),
        description: description ?? null,
        keeperhubId: keeperhubId ?? null,
      },
      update: {
        ensName,
        capabilities: JSON.stringify(capabilities),
        chains: JSON.stringify(chains),
        description: description ?? null,
        keeperhubId: keeperhubId ?? null,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "ENS name is already registered to another operator" }, { status: 409 });
    }
    throw e;
  }

  const registeredAt = agent.registeredAt.toISOString();

  const ensRecords: Record<string, string> = {
    [ENS_KEYS.CAPABILITIES]: capabilities.join(","),
    [ENS_KEYS.CHAINS]: chains.join(","),
    [ENS_KEYS.REGISTERED]: registeredAt,
    [ENS_KEYS.SCORE]: "0",
    [ENS_KEYS.EXECUTIONS]: "0",
    [ENS_KEYS.SUCCESS_RATE]: "0%",
    [ENS_KEYS.LAST_EXECUTION]: "",
    [ENS_KEYS.STATUS]: "active",
    [ENS_KEYS.DESCRIPTION]: description ?? "",
    [ENS_KEYS.KEEPERHUB_ID]: keeperhubId ?? "",
  };

  try {
    const ensWriteTxHash = await setTextRecords(ensName, ensRecords);
    return NextResponse.json({
      success: true,
      agent,
      ensWriteTxHash,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "ENS write failed";
    return NextResponse.json({ error: message, success: false }, { status: 502 });
  }
}
