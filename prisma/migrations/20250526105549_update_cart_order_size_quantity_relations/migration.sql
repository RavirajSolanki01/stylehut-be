/*
  Warnings:

  - You are about to drop the column `size_id` on the `cart_items` table. All the data in the column will be lost.
  - You are about to drop the column `size_id` on the `order_items` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[cart_id,product_id,size_quantity_id,color]` on the table `cart_items` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `size_quantity_id` to the `cart_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `size_quantity_id` to the `order_items` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "cart_items_cart_id_product_id_size_id_color_key";

-- DropIndex
DROP INDEX "cart_items_size_id_idx";

-- DropIndex
DROP INDEX "order_items_size_id_idx";

-- AlterTable
ALTER TABLE "cart_items" DROP COLUMN "size_id",
ADD COLUMN     "size_quantity_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "order_items" DROP COLUMN "size_id",
ADD COLUMN     "size_quantity_id" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "cart_items_size_quantity_id_idx" ON "cart_items"("size_quantity_id");

-- CreateIndex
CREATE UNIQUE INDEX "cart_items_cart_id_product_id_size_quantity_id_color_key" ON "cart_items"("cart_id", "product_id", "size_quantity_id", "color");

-- CreateIndex
CREATE INDEX "order_items_size_quantity_id_idx" ON "order_items"("size_quantity_id");

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_size_quantity_id_fkey" FOREIGN KEY ("size_quantity_id") REFERENCES "size_quantity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_size_quantity_id_fkey" FOREIGN KEY ("size_quantity_id") REFERENCES "size_quantity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
