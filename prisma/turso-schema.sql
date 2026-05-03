-- AgentCred production schema for Turso/libSQL.
-- Apply once with:
-- turso db shell <database-name> < prisma/turso-schema.sql

CREATE TABLE "Agent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ensName" TEXT NOT NULL,
    "operatorAddress" TEXT NOT NULL,
    "keeperhubId" TEXT,
    "capabilities" TEXT NOT NULL,
    "chains" TEXT NOT NULL,
    "description" TEXT,
    "score" INTEGER NOT NULL DEFAULT 0,
    "totalExecutions" INTEGER NOT NULL DEFAULT 0,
    "successRate" REAL NOT NULL DEFAULT 0,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "registeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastExecution" DATETIME
);

CREATE TABLE "Execution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "txHash" TEXT,
    "status" TEXT NOT NULL,
    "gasUsed" TEXT,
    "timestamp" DATETIME NOT NULL,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Execution_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "ScoreHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScoreHistory_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Agent_ensName_key" ON "Agent"("ensName");
CREATE UNIQUE INDEX "Agent_operatorAddress_key" ON "Agent"("operatorAddress");
