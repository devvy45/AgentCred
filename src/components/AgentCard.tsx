import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScoreBadge } from "@/components/ScoreBadge";
import { formatRelativeTime, parseJsonArray } from "@/lib/utils";
import type { Agent } from "@prisma/client";

export function AgentCard({ agent, rank }: { agent: Agent; rank: number }) {
  const capabilities = parseJsonArray(agent.capabilities);
  return (
    <tr className="border-t border-border transition hover:bg-white/[0.03]">
      <td className="mono px-4 py-4 text-sm text-muted">#{rank}</td>
      <td className="px-4 py-4">
        <Link href={`/agent/${encodeURIComponent(agent.ensName)}`} className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-md border border-accent/30 bg-accent/10 font-bold text-accent">
            {agent.ensName.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold">{agent.ensName}</div>
            <div className="mono text-xs text-muted">{agent.operatorAddress.slice(0, 10)}...</div>
          </div>
        </Link>
      </td>
      <td className="px-4 py-4">
        <div className="flex max-w-md flex-wrap gap-1.5">
          {capabilities.slice(0, 4).map((capability) => (
            <Badge key={capability} className="border border-border bg-black/40 text-muted">
              {capability}
            </Badge>
          ))}
        </div>
      </td>
      <td className="px-4 py-4">
        <ScoreBadge score={agent.score} />
      </td>
      <td className="mono px-4 py-4 text-sm">{agent.totalExecutions}</td>
      <td className="mono px-4 py-4 text-sm">{agent.successRate.toFixed(1)}%</td>
      <td className="px-4 py-4 text-sm text-muted">{formatRelativeTime(agent.lastExecution)}</td>
      <td className="px-4 py-4 text-right">
        <Button asChild variant="secondary" size="sm">
          <Link href={`/agent/${encodeURIComponent(agent.ensName)}`}>View</Link>
        </Button>
      </td>
    </tr>
  );
}
