-- AlterTable
ALTER TABLE "users" ADD COLUMN     "otp_limit_expires_at" TIMESTAMP(3),
ADD COLUMN     "resend_otp_attempts" INTEGER,
ADD COLUMN     "resend_otp_limit_expires_at" TIMESTAMP(3);
