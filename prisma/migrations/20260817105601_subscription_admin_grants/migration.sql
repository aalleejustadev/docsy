-- AlterTable
ALTER TABLE "subscription" ADD COLUMN     "grantedByUserId" TEXT,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'stripe',
ALTER COLUMN "stripeCustomerId" DROP NOT NULL;
