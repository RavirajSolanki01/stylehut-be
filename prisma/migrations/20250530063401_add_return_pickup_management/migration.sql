/*
  Warnings:

  - You are about to drop the column `otp_limit_expires_at` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `resend_otp_attempts` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `resend_otp_limit_expires_at` on the `users` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PickupSlot" AS ENUM ('MORNING_9_12', 'AFTERNOON_12_3', 'EVENING_3_6');

-- CreateEnum
CREATE TYPE "PickupStatus" AS ENUM ('PENDING', 'SCHEDULED', 'RESCHEDULED', 'CANCELLED', 'ATTEMPTED', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "return_request" ADD COLUMN     "pickup_slot" TEXT,
ADD COLUMN     "received_condition" TEXT;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "otp_limit_expires_at",
DROP COLUMN "resend_otp_attempts",
DROP COLUMN "resend_otp_limit_expires_at";

-- CreateTable
CREATE TABLE "return_pickup" (
    "id" SERIAL NOT NULL,
    "return_request_id" INTEGER NOT NULL,
    "scheduled_date" TIMESTAMP(3) NOT NULL,
    "slot" "PickupSlot" NOT NULL,
    "status" "PickupStatus" NOT NULL DEFAULT 'PENDING',
    "pickup_agent" VARCHAR(100),
    "agent_phone" VARCHAR(15),
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "last_attempt" TIMESTAMP(3),
    "pickup_notes" VARCHAR(1024),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "return_pickup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "return_pickup_history" (
    "id" SERIAL NOT NULL,
    "return_request_id" INTEGER NOT NULL,
    "scheduled_date" TIMESTAMP(3) NOT NULL,
    "slot" "PickupSlot" NOT NULL,
    "status" "PickupStatus" NOT NULL,
    "attempt_notes" VARCHAR(1024),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "return_pickup_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "return_pickup_return_request_id_key" ON "return_pickup"("return_request_id");

-- CreateIndex
CREATE INDEX "return_pickup_return_request_id_idx" ON "return_pickup"("return_request_id");

-- CreateIndex
CREATE INDEX "return_pickup_status_idx" ON "return_pickup"("status");

-- CreateIndex
CREATE INDEX "return_pickup_scheduled_date_idx" ON "return_pickup"("scheduled_date");

-- CreateIndex
CREATE INDEX "return_pickup_history_return_request_id_idx" ON "return_pickup_history"("return_request_id");

-- AddForeignKey
ALTER TABLE "return_pickup" ADD CONSTRAINT "return_pickup_return_request_id_fkey" FOREIGN KEY ("return_request_id") REFERENCES "return_request"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_pickup_history" ADD CONSTRAINT "return_pickup_history_return_request_id_fkey" FOREIGN KEY ("return_request_id") REFERENCES "return_request"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
