-- CreateTable
CREATE TABLE "adminLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorName" TEXT,
    "action" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "targetId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "adminLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "adminLog_createdAt_idx" ON "adminLog"("createdAt");
