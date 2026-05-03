import { NextResponse } from "next/server";
import { getAddress, type Hex, recoverMessageAddress } from "viem";
import { prisma } from "@/lib/db";
import { syncAgentFromKeeperHub, syncSignMessage } from "@/lib/syncFromKeeperHub";

type SyncBody = {
  ensName?: string;
  signature?: string;
};

/**
 * POST /api/sync
 * Body: { ensName, signature } — `signature` is over `syncSignMessage(ensName)` (EIP-191).
 */
export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const body = json as SyncBody;
  const ensName = typeof body.ensName === "string" ? body.ensName.trim() : "";
  const signature = typeof body.signature === "string" ? body.signature.trim() : "";

  if (!ensName || !signature) {
    return NextResponse.json({ error: "ensName and signature are required" }, { status: 400 });
  }

  const agent = await prisma.agent.findUnique({ where: { ensName } });
  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  let recovered: `0x${string}`;
  try {
    recovered = await recoverMessageAddress({
      message: syncSignMessage(ensName),
      signature: signature as Hex,
    });
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (getAddress(recovered) !== getAddress(agent.operatorAddress)) {
    return NextResponse.json({ error: "Signer is not the agent operator" }, { status: 403 });
  }

  try {
    const result = await syncAgentFromKeeperHub(agent);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
