import type { Agent } from "@prisma/client";
import { AgentCard } from "@/components/AgentCard";

export function Leaderboard({ agents }: { agents: Agent[] }) {
  return (
    <div className="surface overflow-hidden rounded-lg">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left">
          <thead className="bg-white/[0.03] text-xs uppercase tracking-[0.14em] text-muted">
            <tr>
              <th className="px-4 py-3">Rank</th>
              <th className="px-4 py-3">Agent</th>
              <th className="px-4 py-3">Capabilities</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Executions</th>
              <th className="px-4 py-3">Success</th>
              <th className="px-4 py-3">Last Active</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent, index) => (
              <AgentCard key={agent.id} agent={agent} rank={index + 1} />
            ))}
            {agents.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-muted">
                  No registered agents match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
