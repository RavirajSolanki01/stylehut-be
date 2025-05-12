/*
  Warnings:

  - Added the required column `discount_text` to the `coupon` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expiry_date` to the `coupon` table without a default value. This is not possible if the table is not empty.
  - Added the required column `max_savings_amount` to the `coupon` table without a default value. This is not possible if the table is not empty.
  - Added the required column `min_order_amount` to the `coupon` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "coupon" ADD COLUMN     "discount_text" VARCHAR(50) NOT NULL,
ADD COLUMN     "expiry_date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "max_savings_amount" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "min_order_amount" DECIMAL(65,30) NOT NULL,
ALTER COLUMN "code" SET DATA TYPE VARCHAR(30);
