import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ExecutionHistoryPaged } from "@/components/ExecutionHistoryPaged";
import { ScoreBadge } from "@/components/ScoreBadge";
import { ScoreChart } from "@/components/ScoreChart";
import { getAgentBundleByEnsName } from "@/lib/agentQueries";
import { parseJsonArray } from "@/lib/utils";
import { SimulateButton } from "@/components/SimulateButton";

type PageProps = { params: { name: string } };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const ensName = decodeURIComponent(params.name);
  return {
    title: `${ensName} — AgentCred`,
  };
}

export default async function AgentProfilePage({ params }: PageProps) {
  const ensName = decodeURIComponent(params.name);
  const agent = await getAgentBundleByEnsName(ensName);

  if (!agent) {
    notFound();
  }

  const capabilities = parseJsonArray(agent.capabilities);
  const chains = parseJsonArray(agent.chains);

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const chartHistory = agent.scoreHistory.filter((h) => new Date(h.timestamp).getTime() >= thirtyDaysAgo);

  return (
    <div className="min-h-screen pb-16">
      <header className="border-b border-border bg-black/40 backdrop-blur">
        <div className="container-shell flex items-center justify-between py-6">
          <Link href="/" className="text-sm font-semibold tracking-tight">
            AgentCred
          </Link>
          <Link href="/" className="text-sm text-muted transition hover:text-foreground">
            ← Leaderboard
          </Link>
        </div>
      </header>

      <main className="container-shell py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
          <div className="space-y-8">
            <section className="surface flex flex-col gap-6 rounded-lg p-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-4">
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-lg border border-accent/30 bg-gradient-to-br from-accent/20 to-transparent text-2xl font-bold text-accent">
                  {agent.ensName.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-semibold tracking-tight">{agent.ensName}</h1>
                    <Badge
                      className={cn(
                        "uppercase",
                        agent.status === "active" && "bg-accent/15 text-accent",
                        agent.status === "flagged" && "bg-warning/15 text-warning",
                        agent.status === "suspended" && "bg-danger/15 text-danger",
                      )}
                    >
                      {agent.status}
                    </Badge>
                  </div>
                  <p className="mono mt-2 text-xs text-muted">{agent.operatorAddress}</p>
                  {agent.description ? <p className="mt-3 max-w-xl text-sm text-muted">{agent.description}</p> : null}
                </div>
              </div>
              <ScoreBadge score={agent.score} large />
            </section>

            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Total executions" value={String(agent.totalExecutions)} />
              <StatCard label="Success rate" value={`${agent.successRate.toFixed(1)}%`} />
              <StatCard label="Current streak" value={String(agent.streak)} />
              <StatCard label="Member since" value={new Date(agent.registeredAt).toLocaleDateString()} />
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted">Capabilities</h2>
              <div className="flex flex-wrap gap-2">
                {capabilities.map((c) => (
                  <span key={c} className="rounded-md border border-border bg-black/40 px-3 py-1.5 text-sm text-muted">
                    {c}
                  </span>
                ))}
                {capabilities.length === 0 ? <span className="text-sm text-muted">None listed</span> : null}
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted">Chains</h2>
              <div className="flex flex-wrap gap-2">
                {chains.map((c) => (
                  <span key={c} className="rounded-md border border-border px-3 py-1.5 text-sm">
                    {c}
                  </span>
                ))}
                {chains.length === 0 ? <span className="text-sm text-muted">None listed</span> : null}
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted">Score trend (30d)</h2>
              {chartHistory.length > 0 ? (
                <ScoreChart history={chartHistory} />
              ) : (
                <div className="surface rounded-lg p-8 text-center text-sm text-muted">Not enough history yet.</div>
              )}
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted">Execution history</h2>
              <div className="overflow-x-auto">
                <ExecutionHistoryPaged executions={agent.executions} />
              </div>
            </section>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-8 lg:self-start">
            <div className="surface rounded-lg p-5">
              <div className="text-xs uppercase tracking-[0.14em] text-muted">ENS name</div>
              <p className="mono mt-2 break-all text-sm">{agent.ensName}</p>
            </div>
            <div className="surface rounded-lg p-5">
              <div className="text-xs uppercase tracking-[0.14em] text-muted">KeeperHub</div>
              <p className="mt-2 text-sm text-muted">
                {agent.keeperhubId ? (
                  <>
                    Project{" "}
                    <span className="mono text-foreground">{agent.keeperhubId}</span>
                  </>
                ) : (
                  "No project ID on file."
                )}
              </p>
            </div>
            <SimulateButton ensName={agent.ensName} />
            <div className="surface rounded-lg p-5 text-sm text-muted">
              <p className="font-semibold text-foreground">Onchain profile</p>
              <p className="mt-2 leading-relaxed">
                Score and metadata are mirrored to ENS text records. Verify on the ENS app or resolver.
              </p>
              <a
                className="mt-3 inline-block text-accent hover:underline"
                href={`https://sepolia.app.ens.domains/${agent.ensName}`}
                target="_blank"
                rel="noreferrer"
              >
                Open in ENS ↗
              </a>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface rounded-lg p-4">
      <div className="text-xs uppercase tracking-[0.14em] text-muted">{label}</div>
      <div className="mono mt-2 text-xl font-semibold">{value}</div>
    </div>
  );
}
