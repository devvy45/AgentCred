import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;

  if (tursoUrl) {
    const runtimeRequire = eval("require") as NodeRequire;
    const { PrismaLibSQL } = runtimeRequire("@prisma/adapter-libsql") as typeof import("@prisma/adapter-libsql");
    const adapter = new PrismaLibSQL({
      url: tursoUrl,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    return new PrismaClient({ adapter });
  }

  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
