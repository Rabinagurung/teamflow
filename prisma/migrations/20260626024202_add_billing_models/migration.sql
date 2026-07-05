/*
  Warnings:

  - You are about to drop the column `workspaceId` on the `Channel` table. All the data in the column will be lost.
  - You are about to drop the column `workspaceId` on the `OnboardingState` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[organizationId,name]` on the table `Channel` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `organizationId` to the `Channel` table without a default value. This is not possible if the table is not empty.
  - Made the column `channelId` on table `Message` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `updatedAt` to the `organization` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BillingPlan" AS ENUM ('free', 'pro');

-- CreateEnum
CREATE TYPE "BillingStatus" AS ENUM ('free', 'active', 'trailing', 'canceled');

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_channelId_fkey";

-- DropIndex
DROP INDEX "Channel_workspaceId_name_key";

-- AlterTable
ALTER TABLE "Channel" DROP COLUMN "workspaceId",
ADD COLUMN     "organizationId" TEXT NOT NULL,
ALTER COLUMN "createdById" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Message" ALTER COLUMN "channelId" SET NOT NULL;

-- AlterTable
ALTER TABLE "OnboardingState" DROP COLUMN "workspaceId",
ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "organization" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "organization_billing" (
    "organizationId" TEXT NOT NULL,
    "plan" "BillingPlan" NOT NULL DEFAULT 'free',
    "status" "BillingStatus" NOT NULL DEFAULT 'free',
    "polarCustomerId" TEXT,
    "polarCustomerExternalId" TEXT,
    "polarSubscriptionId" TEXT,
    "polarProductId" TEXT,
    "billingManagerUserId" TEXT,
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_billing_pkey" PRIMARY KEY ("organizationId")
);

-- CreateTable
CREATE TABLE "polar_webhook_event" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "polar_webhook_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "organization_billing_plan_idx" ON "organization_billing"("plan");

-- CreateIndex
CREATE INDEX "organization_billing_status_idx" ON "organization_billing"("status");

-- CreateIndex
CREATE INDEX "Channel_organizationId_idx" ON "Channel"("organizationId");

-- CreateIndex
CREATE INDEX "Channel_createdById_idx" ON "Channel"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "Channel_organizationId_name_key" ON "Channel"("organizationId", "name");

-- CreateIndex
CREATE INDEX "Message_channelId_idx" ON "Message"("channelId");

-- CreateIndex
CREATE INDEX "Message_threadId_idx" ON "Message"("threadId");

-- CreateIndex
CREATE INDEX "MessageReaction_messageId_idx" ON "MessageReaction"("messageId");

-- CreateIndex
CREATE INDEX "OnboardingState_organizationId_idx" ON "OnboardingState"("organizationId");

-- AddForeignKey
ALTER TABLE "organization_billing" ADD CONSTRAINT "organization_billing_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_billing" ADD CONSTRAINT "organization_billing_billingManagerUserId_fkey" FOREIGN KEY ("billingManagerUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Channel" ADD CONSTRAINT "Channel_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Channel" ADD CONSTRAINT "Channel_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingState" ADD CONSTRAINT "OnboardingState_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
