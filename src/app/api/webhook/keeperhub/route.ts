import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/keeperhub";
import { syncAgentFromKeeperHub } from "@/lib/syncFromKeeperHub";

function extractProjectId(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;
  if (typeof p.projectId === "string" && p.projectId) return p.projectId;
  if (typeof p.keeperhubId === "string" && p.keeperhubId) return p.keeperhubId;
  if (p.data && typeof p.data === "object") {
    const d = p.data as Record<string, unknown>;
    if (typeof d.projectId === "string" && d.projectId) return d.projectId;
    if (typeof d.keeperhubId === "string" && d.keeperhubId) return d.keeperhubId;
  }
  return null;
}

/**
 * POST /api/webhook/keeperhub
 * Raw body + `x-keeperhub-signature` HMAC (see src/lib/keeperhub.ts).
 */
export async function POST(request: Request) {
  const secret = process.env.KEEPERHUB_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "KEEPERHUB_WEBHOOK_SECRET is not configured" }, { status: 500 });
  }

  const raw = await request.text();
  const signature = request.headers.get("x-keeperhub-signature") ?? "";

  if (!verifyWebhookSignature(raw, signature.trim(), secret)) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const projectId = extractProjectId(payload);
  if (!projectId) {
    return NextResponse.json({ received: true, skipped: true, reason: "no_project_id" });
  }

  const agent = await prisma.agent.findFirst({
    where: { keeperhubId: projectId },
  });

  if (!agent) {
    return NextResponse.json({ received: true, skipped: true, reason: "unknown_project" });
  }

  try {
    await syncAgentFromKeeperHub(agent);
    return NextResponse.json({ received: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
