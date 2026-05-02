import type { Agent, Execution, ScoreHistory } from "@prisma/client";

export type AgentStatus = "active" | "flagged" | "suspended";
export type ExecutionStatus = "success" | "failed" | "pending";

export type AgentENSProfile = {
  ensName: string;
  capabilities: string[];
  chains: string[];
  registered: string | null;
  score: number;
  executions: number;
  successRate: string | null;
  lastExecution: string | null;
  keeperhubId: string | null;
  status: AgentStatus;
  description: string | null;
};

export type AgentWithStats = Agent & {
  executions: Execution[];
  scoreHistory: ScoreHistory[];
  capabilitiesList: string[];
  chainsList: string[];
};

export type KeeperHubExecution = {
  id: string;
  status: ExecutionStatus | string;
  txHash?: string;
  transactionHash?: string;
  gasUsed?: string | number;
  timestamp?: string;
  createdAt?: string;
  metadata?: Record<string, unknown>;
};

export type KeeperHubProject = {
  id: string;
  name?: string;
  webhookUrl?: string;
  [key: string]: unknown;
};

export type KeeperHubWebhookPayload = {
  type?: string;
  event?: string;
  projectId?: string;
  keeperhubId?: string;
  agentEnsName?: string;
  ensName?: string;
  execution?: KeeperHubExecution;
  data?: {
    projectId?: string;
    keeperhubId?: string;
    agentEnsName?: string;
    ensName?: string;
    execution?: KeeperHubExecution;
  };
};
