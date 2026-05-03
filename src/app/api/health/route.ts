import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const agents = await prisma.agent.count();

    return NextResponse.json({
      ok: true,
      database: process.env.TURSO_DATABASE_URL ? "turso" : "sqlite",
      agents,
      env: {
        tursoUrl: Boolean(process.env.TURSO_DATABASE_URL),
        tursoToken: Boolean(process.env.TURSO_AUTH_TOKEN),
        alchemy: Boolean(process.env.NEXT_PUBLIC_ALCHEMY_API_KEY),
        registry: process.env.NEXT_PUBLIC_REGISTRY_ADDRESS ?? null,
        keeperhub: Boolean(process.env.KEEPERHUB_API_KEY),
        webhookSecret: Boolean(process.env.KEEPERHUB_WEBHOOK_SECRET),
        deployerKey: Boolean(process.env.DEPLOYER_PRIVATE_KEY),
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        database: process.env.TURSO_DATABASE_URL ? "turso" : "sqlite",
        error: err instanceof Error ? err.message : "unknown database error",
      },
      { status: 500 },
    );
  }
}
