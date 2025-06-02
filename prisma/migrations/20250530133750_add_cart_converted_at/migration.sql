/*
  Warnings:

  - A unique constraint covering the columns `[user_id,status,is_deleted,converted_at]` on the table `cart` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "cart_user_id_status_is_deleted_key";

-- AlterTable
ALTER TABLE "cart" ADD COLUMN     "converted_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "cart_user_id_status_is_deleted_converted_at_key" ON "cart"("user_id", "status", "is_deleted", "converted_at");
