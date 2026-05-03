import crypto from "crypto";
import type { KeeperHubExecution, KeeperHubProject } from "@/types";

const KEEPERHUB_BASE_URL = "https://api.keeperhub.com";

async function keeperhubFetch<T>(path: string): Promise<T> {
  const apiKey = process.env.KEEPERHUB_API_KEY;
  if (!apiKey || apiKey === "your_keeperhub_api_key") {
    throw new Error("KEEPERHUB_API_KEY is required");
  }

  const response = await fetch(`${KEEPERHUB_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`KeeperHub request failed ${response.status}: ${body}`);
  }

  return response.json() as Promise<T>;
}

export async function getExecutions(projectId: string, limit = 100): Promise<KeeperHubExecution[]> {
  const data = await keeperhubFetch<{ executions?: KeeperHubExecution[]; data?: KeeperHubExecution[] }>(
    `/projects/${projectId}/executions?limit=${limit}`,
  );
  return data.executions ?? data.data ?? [];
}

export async function getExecution(executionId: string): Promise<KeeperHubExecution> {
  const data = await keeperhubFetch<{ execution?: KeeperHubExecution; data?: KeeperHubExecution }>(
    `/executions/${executionId}`,
  );
  return data.execution ?? data.data ?? (data as unknown as KeeperHubExecution);
}

export function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  if (!payload || !signature || !secret) return false;
  const trimmed = signature.trim();
  const hex = trimmed.startsWith("sha256=") ? trimmed.slice(7) : trimmed;
  const digest = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  const left = Buffer.from(digest, "utf8");
  const right = Buffer.from(hex, "utf8");
  if (left.length !== right.length) return false;
  try {
    return crypto.timingSafeEqual(left, right);
  } catch {
    return false;
  }
}

export async function getProject(projectId: string): Promise<KeeperHubProject> {
  const data = await keeperhubFetch<{ project?: KeeperHubProject; data?: KeeperHubProject }>(
    `/projects/${projectId}`,
  );
  return data.project ?? data.data ?? (data as unknown as KeeperHubProject);
}
