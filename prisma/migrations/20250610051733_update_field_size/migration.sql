/*
  Warnings:

  - Added the required column `updated_at` to the `product_additional_detail_key` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `product_specification_key` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "product_additional_detail_key_name_key";

-- DropIndex
DROP INDEX "product_specification_key_name_key";

-- AlterTable
ALTER TABLE "product_additional_detail_key" ADD COLUMN     "create_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "product_specification_key" ADD COLUMN     "create_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;
