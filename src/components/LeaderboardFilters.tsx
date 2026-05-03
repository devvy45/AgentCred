"use client";

import type { Agent } from "@prisma/client";
import { Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Leaderboard } from "@/components/Leaderboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CAPABILITY_OPTIONS, CHAIN_OPTIONS } from "@/lib/options";
import { cn } from "@/lib/utils";

type LeaderboardResponse = {
  agents: Agent[];
  total: number;
};

export function LeaderboardFilters({
  initialAgents,
  initialTotal,
}: {
  initialAgents: Agent[];
  initialTotal: number;
}) {
  const [agents, setAgents] = useState<Agent[]>(initialAgents);
  const [total, setTotal] = useState(initialTotal);
  const [search, setSearch] = useState("");
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [chains, setChains] = useState<string[]>([]);
  const [minScore, setMinScore] = useState(0);
  const [status, setStatus] = useState<"active" | "all">("active");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    for (const capability of capabilities) params.append("capability", capability);
    for (const chain of chains) params.append("chain", chain);
    if (minScore > 0) params.set("minScore", String(minScore));
    params.set("status", status);
    params.set("limit", "50");
    return params.toString();
  }, [capabilities, chains, minScore, search, status]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/leaderboard?${queryString}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error ?? "Failed to load leaderboard");
        }
        const data = (await response.json()) as LeaderboardResponse;
        setAgents(data.agents);
        setTotal(data.total);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Failed to load leaderboard");
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [queryString]);

  function toggle(value: string, list: string[], setter: (next: string[]) => void) {
    setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  }

  function clearFilters() {
    setSearch("");
    setCapabilities([]);
    setChains([]);
    setMinScore(0);
    setStatus("active");
  }

  const hasFilters =
    search.trim().length > 0 ||
    capabilities.length > 0 ||
    chains.length > 0 ||
    minScore > 0 ||
    status !== "active";

  return (
    <div className="space-y-5">
      <div className="surface rounded-lg p-4">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-muted">Search</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Agent name, capability, chain"
                className="pl-9"
              />
            </div>
          </label>

          <div>
            <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-muted">Status</span>
            <div className="grid grid-cols-2 rounded-md border border-border bg-black/30 p-1">
              {(["active", "all"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setStatus(item)}
                  className={cn(
                    "h-8 rounded text-sm font-semibold capitalize text-muted transition",
                    status === item && "bg-accent text-black",
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <FilterChips
            title="Capabilities"
            options={CAPABILITY_OPTIONS}
            selected={capabilities}
            onToggle={(value) => toggle(value, capabilities, setCapabilities)}
          />
          <FilterChips
            title="Chains"
            options={CHAIN_OPTIONS}
            selected={chains}
            onToggle={(value) => toggle(value, chains, setChains)}
          />
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <label className="block">
            <span className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.14em] text-muted">
              <span>Minimum score</span>
              <span className="mono text-foreground">{minScore}</span>
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={minScore}
              onChange={(event) => setMinScore(Number(event.target.value))}
              className="h-2 w-full accent-[var(--accent)]"
            />
          </label>

          <Button type="button" variant="secondary" onClick={clearFilters} disabled={!hasFilters}>
            <X className="h-4 w-4" />
            Clear
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          Showing <span className="mono text-foreground">{agents.length}</span> of{" "}
          <span className="mono text-foreground">{total}</span> matching agents
        </p>
        {loading ? <p className="text-sm text-muted">Refreshing leaderboard...</p> : null}
      </div>

      {error ? (
        <div className="rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{error}</div>
      ) : null}

      <Leaderboard agents={agents} />
    </div>
  );
}

function FilterChips({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div>
      <div className="mb-2 text-xs uppercase tracking-[0.14em] text-muted">{title}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onToggle(option)}
            className={cn(
              "rounded-md border border-border px-3 py-2 text-sm text-muted transition hover:border-accent/50",
              selected.includes(option) && "border-accent/50 bg-accent/10 text-accent",
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
