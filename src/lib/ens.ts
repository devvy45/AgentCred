import {
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  http,
  namehash,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import type { AgentENSProfile } from "@/types";

export const ENS_KEYS = {
  CAPABILITIES: "agentcred.capabilities",
  CHAINS: "agentcred.chains",
  REGISTERED: "agentcred.registered",
  SCORE: "agentcred.score",
  EXECUTIONS: "agentcred.executions",
  SUCCESS_RATE: "agentcred.success_rate",
  LAST_EXECUTION: "agentcred.last_execution",
  KEEPERHUB_ID: "agentcred.keeperhub_id",
  STATUS: "agentcred.status",
  DESCRIPTION: "agentcred.description",
} as const;

const resolverAbi = [
  {
    name: "setText",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "node", type: "bytes32" },
      { name: "key", type: "string" },
      { name: "value", type: "string" },
    ],
    outputs: [],
  },
  {
    name: "multicall",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "data", type: "bytes[]" }],
    outputs: [{ name: "results", type: "bytes[]" }],
  },
] as const;

const rpcUrl = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY
  ? `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
  : undefined;

export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(rpcUrl),
});

function csv(value: string | null) {
  return value?.split(",").map((item) => item.trim()).filter(Boolean) ?? [];
}

export async function getTextRecord(ensName: string, key: string): Promise<string | null> {
  try {
    return await publicClient.getEnsText({ name: ensName, key });
  } catch {
    return null;
  }
}

export async function getAgentProfile(ensName: string): Promise<AgentENSProfile> {
  const entries = await Promise.all(
    Object.values(ENS_KEYS).map(async (key) => [key, await getTextRecord(ensName, key)] as const),
  );
  const records = Object.fromEntries(entries) as Record<string, string | null>;

  return {
    ensName,
    capabilities: csv(records[ENS_KEYS.CAPABILITIES]),
    chains: csv(records[ENS_KEYS.CHAINS]),
    registered: records[ENS_KEYS.REGISTERED],
    score: Number(records[ENS_KEYS.SCORE] ?? 0),
    executions: Number(records[ENS_KEYS.EXECUTIONS] ?? 0),
    successRate: records[ENS_KEYS.SUCCESS_RATE],
    lastExecution: records[ENS_KEYS.LAST_EXECUTION],
    keeperhubId: records[ENS_KEYS.KEEPERHUB_ID],
    status: (records[ENS_KEYS.STATUS] as AgentENSProfile["status"]) ?? "active",
    description: records[ENS_KEYS.DESCRIPTION],
  };
}

export async function setTextRecords(ensName: string, records: Record<string, string>): Promise<string> {
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY as Hex | undefined;
  if (!privateKey || privateKey === "your_wallet_private_key") {
    throw new Error("DEPLOYER_PRIVATE_KEY is required to write ENS text records");
  }

  const resolverAddress = await publicClient.getEnsResolver({ name: ensName });
  if (!resolverAddress) throw new Error(`No resolver configured for ${ensName}`);

  const account = privateKeyToAccount(privateKey);
  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(rpcUrl),
  });

  const node = namehash(ensName);
  const data = Object.entries(records).map(([key, value]) =>
    encodeFunctionData({
      abi: resolverAbi,
      functionName: "setText",
      args: [node, key, value],
    }),
  );

  const tx = await walletClient.writeContract({
    address: resolverAddress as Address,
    abi: resolverAbi,
    functionName: "multicall",
    args: [data],
  });

  await publicClient.waitForTransactionReceipt({ hash: tx });
  return tx;
}

export async function resolveENS(ensName: string): Promise<string | null> {
  try {
    return await publicClient.getEnsAddress({ name: ensName });
  } catch {
    return null;
  }
}

export async function reverseResolveENS(address: string): Promise<string | null> {
  try {
    return await publicClient.getEnsName({ address: address as Address });
  } catch {
    return null;
  }
}
