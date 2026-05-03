"use client";

import { useState } from "react";
import { Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SimulateButton({ ensName }: { ensName: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function simulate(status: "success" | "failed") {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ensName, status }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(`score updated to ${data.score} — ${data.totalExecutions} executions, ${data.successRate}% success`);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setResult(data.error ?? "simulation failed");
      }
    } catch {
      setResult("request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="surface rounded-lg p-5 space-y-3">
      <div className="text-xs uppercase tracking-[0.14em] text-muted">Simulate Execution</div>
      <p className="text-xs text-muted">Fire a mock KeeperHub execution to update score and ENS records live.</p>
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => simulate("success")}
          disabled={loading}
          className="flex-1"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
          Success
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => simulate("failed")}
          disabled={loading}
          className="flex-1"
        >
          Failed
        </Button>
      </div>
      {result && (
        <p className="text-xs text-accent">{result}</p>
      )}
    </div>
  );
}