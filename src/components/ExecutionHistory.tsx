import { Badge } from "@/components/ui/badge";
import { formatRelativeTime, truncateAddress } from "@/lib/utils";
import type { Execution } from "@prisma/client";

export function ExecutionHistory({ executions }: { executions: Execution[] }) {
  return (
    <div className="surface overflow-hidden rounded-lg">
      <table className="w-full min-w-[680px] text-left">
        <thead className="bg-white/[0.03] text-xs uppercase tracking-[0.14em] text-muted">
          <tr>
            <th className="px-4 py-3">Time</th>
            <th className="px-4 py-3">Tx Hash</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Gas</th>
          </tr>
        </thead>
        <tbody>
          {executions.map((execution) => (
            <tr key={execution.id} className="border-t border-border">
              <td className="px-4 py-4 text-sm text-muted">{formatRelativeTime(execution.timestamp)}</td>
              <td className="mono px-4 py-4 text-sm">
                {execution.txHash ? (
                  <a
                    href={`https://sepolia.etherscan.io/tx/${execution.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent"
                  >
                    {truncateAddress(execution.txHash, 6)}
                  </a>
                ) : (
                  <span className="text-muted">pending</span>
                )}
              </td>
              <td className="px-4 py-4">
                <Badge
                  className={
                    execution.status === "success"
                      ? "bg-accent/10 text-accent"
                      : execution.status === "failed"
                        ? "bg-danger/10 text-danger"
                        : "bg-warning/10 text-warning"
                  }
                >
                  {execution.status}
                </Badge>
              </td>
              <td className="mono px-4 py-4 text-sm text-muted">{execution.gasUsed ?? "-"}</td>
            </tr>
          ))}
          {executions.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-12 text-center text-muted">
                No KeeperHub executions have been indexed yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
