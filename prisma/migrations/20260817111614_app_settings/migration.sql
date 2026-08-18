-- CreateTable
CREATE TABLE "appSetting" (
    "id" TEXT NOT NULL DEFAULT 'app',
    "allowSignUps" BOOLEAN NOT NULL DEFAULT true,
    "enforceTwoFactor" BOOLEAN NOT NULL DEFAULT false,
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "chatRetentionMonths" INTEGER DEFAULT 12,
    "updatedByUserId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appSetting_pkey" PRIMARY KEY ("id")
);
