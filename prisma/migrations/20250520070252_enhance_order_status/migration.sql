-- DropIndex
DROP INDEX "order_timeline_status_idx";

-- DropIndex
DROP INDEX "return_request_status_idx";

-- AlterTable
ALTER TABLE "return_request" ADD COLUMN     "qc_notes" VARCHAR(1024),
ADD COLUMN     "qc_status" BOOLEAN,
ADD COLUMN     "refund_id" TEXT,
ADD COLUMN     "rejection_reason" VARCHAR(1024),
ADD COLUMN     "tracking_number" TEXT;
