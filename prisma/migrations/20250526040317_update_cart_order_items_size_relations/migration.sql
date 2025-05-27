/*
  Warnings:

  - You are about to drop the column `size` on the `cart_items` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `order_items` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[cart_id,product_id,size_id,color]` on the table `cart_items` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `size_id` to the `cart_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `size_id` to the `order_items` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "cart_items_cart_id_product_id_size_color_key";

-- AlterTable
ALTER TABLE "cart_items" DROP COLUMN "size",
ADD COLUMN     "size_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "order_items" DROP COLUMN "size",
ADD COLUMN     "size_id" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "cart_items_size_id_idx" ON "cart_items"("size_id");

-- CreateIndex
CREATE UNIQUE INDEX "cart_items_cart_id_product_id_size_id_color_key" ON "cart_items"("cart_id", "product_id", "size_id", "color");

-- CreateIndex
CREATE INDEX "order_items_size_id_idx" ON "order_items"("size_id");
