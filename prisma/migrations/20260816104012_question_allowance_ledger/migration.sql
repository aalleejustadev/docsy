-- CreateTable
CREATE TABLE "questionEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chatId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "questionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "questionEvent_organizationId_createdAt_idx" ON "questionEvent"("organizationId", "createdAt");

-- Backfill from the questions still in chat history, so no workspace gets a
-- free reset the moment this ships. This is the last point at which `message`
-- is the record of what was asked; anything already deleted is gone for good.
-- The asker is taken from the chat, which is the only owner a message has.
INSERT INTO "questionEvent" ("id", "organizationId", "userId", "chatId", "createdAt")
SELECT gen_random_uuid()::text, c."organizationId", c."userId", m."chatId", m."createdAt"
FROM "message" m
JOIN "chat" c ON c."id" = m."chatId"
WHERE m."role" = 'USER' AND m."hidden" = false;
