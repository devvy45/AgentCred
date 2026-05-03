import { NextResponse } from "next/server";

/**
 * GET /api/leaderboard
 * Query: search, capability (comma or repeat), chain (comma or repeat), minScore, status (active|all|flagged|suspended), limit, offset
 */
export async function GET() {
  return NextResponse.json({ agents: [], total: 0 });
}
