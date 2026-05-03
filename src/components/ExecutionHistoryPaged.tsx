"use client";

import { useState } from "react";
import type { Execution } from "@prisma/client";
import { ExecutionHistory } from "@/components/ExecutionHistory";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 20;

export function ExecutionHistoryPaged({ executions }: { executions: Execution[] }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(executions.length / PAGE_SIZE));
  const slice = executions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-4">
      <ExecutionHistory executions={slice} />
      {totalPages > 1 ? (
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button type="button" variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="mono text-sm text-muted">
            Page {page} / {totalPages}
          </span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}
