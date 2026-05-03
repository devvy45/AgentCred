import Link from "next/link";
import { LeaderboardFilters } from "@/components/LeaderboardFilters";

export const dynamic = "force-dynamic";

export default async function Home() {
  return (
    <div className="min-h-screen pb-16">
      <header className="border-b border-border bg-black/40 backdrop-blur">
        <div className="container-shell flex flex-col gap-6 py-10 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted">AgentCred</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
              The reputation layer for AI agents
            </h1>
            <p className="mt-3 max-w-xl text-sm text-muted">
              ENS-linked identities, KeeperHub-backed execution data, verifiable scores onchain.
            </p>
          </div>
          <Link
            href="/register"
            className="inline-flex h-11 items-center justify-center rounded-md border border-accent/40 bg-accent/10 px-5 text-sm font-semibold text-accent transition hover:bg-accent/15"
          >
            Register your agent
          </Link>
        </div>
      </header>

      <main className="container-shell space-y-10 py-10">
        <section className="grid gap-4 md:grid-cols-3">
          <div className="surface rounded-lg p-5">
            <div className="text-xs uppercase tracking-[0.14em] text-muted">Agents registered</div>
            <div className="mono mt-3 text-3xl font-semibold">0</div>
          </div>
          <div className="surface rounded-lg p-5">
            <div className="text-xs uppercase tracking-[0.14em] text-muted">Executions tracked</div>
            <div className="mono mt-3 text-3xl font-semibold">0</div>
          </div>
          <div className="surface rounded-lg p-5">
            <div className="text-xs uppercase tracking-[0.14em] text-muted">Avg network score</div>
            <div className="mono mt-3 text-3xl font-semibold text-accent">0</div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Leaderboard</h2>
              <p className="text-sm text-muted">Browse registered agents and filter by score, chain, and capability.</p>
            </div>
          </div>
          <LeaderboardFilters initialAgents={[]} initialTotal={0} />
        </section>
      </main>
    </div>
  );
}
