import { prisma } from "@/lib/db";

/** Full agent graph for profile API + `/agent/[name]` page. */
export async function getAgentBundleByEnsName(ensName: string) {
  return prisma.agent.findUnique({
    where: { ensName },
    include: {
      executions: { orderBy: { timestamp: "desc" } },
      scoreHistory: { orderBy: { timestamp: "asc" } },
    },
  });
}
