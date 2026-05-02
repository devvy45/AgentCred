export interface ReputationExecution {
  status: "success" | "failed" | "pending" | string;
  timestamp: Date;
  gasUsed?: string;
}

export function computeScore(executions: ReputationExecution[]): {
  score: number;
  successRate: number;
  streak: number;
} {
  if (executions.length === 0) return { score: 0, successRate: 0, streak: 0 };

  const total = executions.length;
  const successful = executions.filter((execution) => execution.status === "success").length;
  const successRate = successful / total;
  const sorted = [...executions].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  let streak = 0;
  for (const execution of sorted) {
    if (execution.status === "success") streak += 1;
    else break;
  }

  const volumeWeight = Math.min(1, total / 10);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentExecs = executions.filter((execution) => execution.timestamp > thirtyDaysAgo).length;
  const recencyBonus = recentExecs > 10 ? 5 : recentExecs > 5 ? 3 : 0;
  const streakBonus = streak > 10 ? 5 : streak > 5 ? 3 : 0;
  const rawScore = successRate * 100 * volumeWeight + recencyBonus + streakBonus;

  return {
    score: Math.min(100, Math.round(rawScore)),
    successRate: Math.round(successRate * 1000) / 10,
    streak,
  };
}
