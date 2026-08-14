-- CreateEnum
CREATE TYPE "MessageFeedback" AS ENUM ('UP', 'DOWN');

-- AlterTable
ALTER TABLE "message" ADD COLUMN     "feedback" "MessageFeedback";
