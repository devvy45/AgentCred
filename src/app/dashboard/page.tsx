"use client";

import type { Agent, Execution, ScoreHistory } from "@prisma/client";
import { Check, Copy, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { isAddress } from "viem";
import { useAccount, useSignMessage } from "wagmi";
import { ExecutionHistory } from "@/components/ExecutionHistory";
import { ScoreBadge } from "@/components/ScoreBadge";
import { WalletConnect } from "@/components/WalletConnect";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ENS_KEYS } from "@/lib/ens";
import { cn, formatRelativeTime, truncateAddress } from "@/lib/utils";
import type { AgentENSProfile } from "@/types";

type DashboardAgent = Agent & {
  executions: Execution[];
  scoreHistory: ScoreHistory[];
  capabilitiesList: string[];
  chainsList: string[];
};

type DashboardPayload = {
  agent: DashboardAgent;
  ensProfile: AgentENSProfile | null;
};

const syncSignMessage = (ensName: string) => `AgentCred:sync:${ensName}`;

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("/api/webhook/keeperhub");

  const loadDashboard = useCallback(async () => {
    if (!address || !isAddress(address)) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/dashboard?operatorAddress=${address}`, { cache: "no-store" });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Failed to load dashboard");
      }
      setData((await response.json()) as DashboardPayload);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    setWebhookUrl(`${window.location.origin}/api/webhook/keeperhub`);
  }, []);

  async function copyWebhookUrl() {
    await navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  async function syncNow() {
    if (!data?.agent) return;
    setSyncing(true);
    setError(null);
    setSyncResult(null);
    try {
      const signature = await signMessageAsync({
        message: syncSignMessage(data.agent.ensName),
      });
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ensName: data.agent.ensName, signature }),
      });
      const body = (await response.json().catch(() => null)) as
        | { error?: string; synced?: number; newScore?: number }
        | null;
      if (!response.ok) {
        throw new Error(body?.error ?? "Sync failed");
      }
      setSyncResult(`Synced ${body?.synced ?? 0} executions. New score: ${body?.newScore ?? data.agent.score}.`);
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="min-h-screen pb-16">
      <header className="border-b border-border bg-black/40 backdrop-blur">
        <div className="container-shell flex flex-col gap-5 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/" className="text-sm font-semibold tracking-tight">
              AgentCred
            </Link>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">Operator dashboard</h1>
          </div>
          <WalletConnect />
        </div>
      </header>

      <main className="container-shell py-10">
        {!isConnected ? (
          <section className="surface mx-auto max-w-xl rounded-lg p-8 text-center">
            <h2 className="text-2xl font-semibold tracking-tight">Connect your operator wallet</h2>
            <p className="mt-3 text-sm text-muted">
              The dashboard is scoped to the wallet that registered an AgentCred profile.
            </p>
            <div className="mt-8">
              <WalletConnect />
            </div>
          </section>
        ) : loading ? (
          <div className="surface mx-auto flex max-w-xl items-center justify-center gap-3 rounded-lg p-8 text-muted">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading operator data
          </div>
        ) : data ? (
          <DashboardContent
            data={data}
            webhookUrl={webhookUrl}
            copied={copied}
            syncing={syncing}
            syncResult={syncResult}
            error={error}
            onCopyWebhook={copyWebhookUrl}
            onRefresh={loadDashboard}
            onSyncNow={syncNow}
          />
        ) : (
          <section className="surface mx-auto max-w-xl rounded-lg p-8 text-center">
            <h2 className="text-2xl font-semibold tracking-tight">No registered agent found</h2>
            <p className="mt-3 text-sm text-muted">
              {error ?? "Register an agent with this wallet to unlock the operator dashboard."}
            </p>
            <Button asChild className="mt-8">
              <Link href="/register">Register your agent</Link>
            </Button>
          </section>
        )}
      </main>
    </div>
  );
}

function DashboardContent({
  data,
  webhookUrl,
  copied,
  syncing,
  syncResult,
  error,
  onCopyWebhook,
  onRefresh,
  onSyncNow,
}: {
  data: DashboardPayload;
  webhookUrl: string;
  copied: boolean;
  syncing: boolean;
  syncResult: string | null;
  error: string | null;
  onCopyWebhook: () => void;
  onRefresh: () => void;
  onSyncNow: () => void;
}) {
  const { agent, ensProfile } = data;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div className="space-y-8">
        <section className="surface flex flex-col gap-6 rounded-lg p-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-semibold tracking-tight">{agent.ensName}</h2>
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
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <DashboardStat label="Executions" value={String(agent.totalExecutions)} />
              <DashboardStat label="Success" value={`${agent.successRate.toFixed(1)}%`} />
              <DashboardStat label="Streak" value={String(agent.streak)} />
            </div>
          </div>
          <ScoreBadge score={agent.score} large />
        </section>

        <section className="surface rounded-lg p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">KeeperHub webhook</h2>
              <p className="mt-2 text-sm text-muted">
                Configure this URL in KeeperHub so execution events update SQLite and ENS records.
              </p>
            </div>
            <Badge className={agent.keeperhubId ? "bg-accent/10 text-accent" : "bg-warning/10 text-warning"}>
              {agent.keeperhubId ? "project linked" : "project missing"}
            </Badge>
          </div>

          <div className="mt-5 flex flex-col gap-3 rounded-md border border-border bg-black/30 p-3 sm:flex-row sm:items-center">
            <code className="mono flex-1 break-all text-sm text-muted">{webhookUrl}</code>
            <Button type="button" variant="secondary" size="sm" onClick={onCopyWebhook}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>

          <details className="mt-5 rounded-md border border-border p-4 text-sm text-muted">
            <summary className="cursor-pointer font-semibold text-foreground">Setup instructions</summary>
            <ol className="mt-4 list-decimal space-y-2 pl-5">
              <li>Open your KeeperHub project.</li>
              <li>Add a webhook destination with the URL above.</li>
              <li>Set the webhook secret to match <code className="mono">KEEPERHUB_WEBHOOK_SECRET</code>.</li>
              <li>Trigger an execution, then use Sync now if you want to backfill immediately.</li>
            </ol>
          </details>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Recent executions</h2>
              <p className="text-sm text-muted">Latest 10 indexed KeeperHub executions.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={onRefresh}>
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button type="button" onClick={onSyncNow} disabled={syncing || !agent.keeperhubId}>
                {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Sync now
              </Button>
            </div>
          </div>
          {syncResult ? (
            <div className="rounded-md border border-accent/40 bg-accent/10 p-3 text-sm text-accent">{syncResult}</div>
          ) : null}
          {error ? (
            <div className="rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{error}</div>
          ) : null}
          <div className="overflow-x-auto">
            <ExecutionHistory executions={agent.executions} />
          </div>
        </section>
      </div>

      <aside className="space-y-6 lg:sticky lg:top-8 lg:self-start">
        <div className="surface rounded-lg p-5">
          <div className="text-xs uppercase tracking-[0.14em] text-muted">Public profile</div>
          <Link className="mt-3 inline-flex items-center gap-2 text-sm text-accent" href={`/agent/${encodeURIComponent(agent.ensName)}`}>
            View {agent.ensName}
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="surface rounded-lg p-5">
          <div className="text-xs uppercase tracking-[0.14em] text-muted">Agent</div>
          <dl className="mt-4 space-y-3 text-sm">
            <DashboardKV label="KeeperHub ID" value={agent.keeperhubId ?? "not set"} />
            <DashboardKV label="Last active" value={formatRelativeTime(agent.lastExecution)} />
            <DashboardKV label="Operator" value={truncateAddress(agent.operatorAddress)} mono />
          </dl>
        </div>

        <div className="surface rounded-lg p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs uppercase tracking-[0.14em] text-muted">ENS records</div>
            <Button type="button" variant="secondary" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          {ensProfile ? (
            <div className="mt-4 space-y-3">
              {ensRecordRows(ensProfile).map(([key, value]) => (
                <div key={key} className="border-b border-border pb-3 last:border-0 last:pb-0">
                  <div className="mono text-[11px] text-muted">{key}</div>
                  <div className="mt-1 break-words text-sm">{value || "-"}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted">ENS records could not be loaded from the resolver.</p>
          )}
        </div>
      </aside>
    </div>
  );
}

function DashboardStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.14em] text-muted">{label}</div>
      <div className="mono mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}

function DashboardKV({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd className={cn("mt-1 break-all text-foreground", mono && "mono")}>{value}</dd>
    </div>
  );
}

function ensRecordRows(profile: AgentENSProfile): Array<[string, string]> {
  return [
    [ENS_KEYS.CAPABILITIES, profile.capabilities.join(",")],
    [ENS_KEYS.CHAINS, profile.chains.join(",")],
    [ENS_KEYS.REGISTERED, profile.registered ?? ""],
    [ENS_KEYS.SCORE, String(profile.score)],
    [ENS_KEYS.EXECUTIONS, String(profile.executions)],
    [ENS_KEYS.SUCCESS_RATE, profile.successRate ?? ""],
    [ENS_KEYS.LAST_EXECUTION, profile.lastExecution ?? ""],
    [ENS_KEYS.KEEPERHUB_ID, profile.keeperhubId ?? ""],
    [ENS_KEYS.STATUS, profile.status],
    [ENS_KEYS.DESCRIPTION, profile.description ?? ""],
  ];
}
