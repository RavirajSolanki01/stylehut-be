/*
  Warnings:

  - A unique constraint covering the columns `[user_id,status,is_deleted]` on the table `cart` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "cart_user_id_status_key";

-- CreateIndex
CREATE UNIQUE INDEX "cart_user_id_status_is_deleted_key" ON "cart"("user_id", "status", "is_deleted");
