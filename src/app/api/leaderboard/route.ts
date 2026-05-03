import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const capability = searchParams.get("capability") ?? "";
  const chain = searchParams.get("chain") ?? "";
  const minScore = parseInt(searchParams.get("minScore") ?? "0", 10);
  const status = searchParams.get("status") ?? "active";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  const agents = await prisma.agent.findMany({
    where: {
      ...(status !== "all" ? { status } : {}),
      ...(minScore > 0 ? { score: { gte: minScore } } : {}),
      ...(search ? {
        OR: [
          { ensName: { contains: search, mode: "insensitive" } },
          { capabilities: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ]
      } : {}),
      ...(capability ? { capabilities: { contains: capability, mode: "insensitive" } } : {}),
      ...(chain ? { chains: { contains: chain, mode: "insensitive" } } : {}),
    },
    orderBy: [{ score: "desc" }, { totalExecutions: "desc" }],
    take: limit,
    skip: offset,
  });

  const total = await prisma.agent.count({
    where: {
      ...(status !== "all" ? { status } : {}),
      ...(minScore > 0 ? { score: { gte: minScore } } : {}),
    },
  });

  return NextResponse.json({ agents, total });
}