-- CreateTable
CREATE TABLE "installments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" INTEGER NOT NULL,
    "amount" REAL NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "paidDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "method" TEXT,
    "reference" TEXT,
    "pixCode" TEXT,
    "notes" TEXT,
    "feeId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "installments_feeId_fkey" FOREIGN KEY ("feeId") REFERENCES "fees" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "paidDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "supplier" TEXT,
    "documentNumber" TEXT,
    "notes" TEXT,
    "caseId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "expenses_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "repasses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partnerName" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "referenceDate" DATETIME NOT NULL,
    "period" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "settings" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_appointments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "location" TEXT,
    "participants" TEXT,
    "userId" TEXT NOT NULL,
    "caseId" TEXT,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrence" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "appointments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "appointments_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_appointments" ("createdAt", "description", "endTime", "id", "isRecurring", "location", "participants", "recurrence", "startTime", "title", "type", "updatedAt", "userId") SELECT "createdAt", "description", "endTime", "id", "isRecurring", "location", "participants", "recurrence", "startTime", "title", "type", "updatedAt", "userId" FROM "appointments";
DROP TABLE "appointments";
ALTER TABLE "new_appointments" RENAME TO "appointments";
CREATE TABLE "new_deadlines" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" DATETIME NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,
    "priority" TEXT NOT NULL DEFAULT 'MEDIA',
    "caseId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "deadlines_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_deadlines" ("caseId", "completedAt", "createdAt", "description", "dueDate", "id", "isCompleted", "priority", "title", "updatedAt") SELECT "caseId", "completedAt", "createdAt", "description", "dueDate", "id", "isCompleted", "priority", "title", "updatedAt" FROM "deadlines";
DROP TABLE "deadlines";
ALTER TABLE "new_deadlines" RENAME TO "deadlines";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "installments_feeId_idx" ON "installments"("feeId");

-- CreateIndex
CREATE INDEX "installments_status_dueDate_idx" ON "installments"("status", "dueDate");

-- CreateIndex
CREATE INDEX "expenses_status_dueDate_idx" ON "expenses"("status", "dueDate");

-- CreateIndex
CREATE INDEX "expenses_category_idx" ON "expenses"("category");

-- CreateIndex
CREATE INDEX "repasses_status_idx" ON "repasses"("status");

-- CreateIndex
CREATE INDEX "repasses_period_idx" ON "repasses"("period");

