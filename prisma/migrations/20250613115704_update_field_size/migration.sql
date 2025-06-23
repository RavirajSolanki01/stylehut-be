/*
  Warnings:

  - You are about to drop the column `category_id` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `sub_category_id` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `category_id` on the `sub_category_type` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_category_id_fkey";

-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_sub_category_id_fkey";

-- DropForeignKey
ALTER TABLE "sub_category_type" DROP CONSTRAINT "sub_category_type_category_id_fkey";

-- DropIndex
DROP INDEX "products_category_id_idx";

-- AlterTable
ALTER TABLE "products" DROP COLUMN "category_id",
DROP COLUMN "sub_category_id";

-- AlterTable
ALTER TABLE "sub_category_type" DROP COLUMN "category_id";

-- CreateTable
CREATE TABLE "_brandTosub_category" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_brandTosub_category_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_brandTosub_category_B_index" ON "_brandTosub_category"("B");

-- CreateIndex
CREATE INDEX "products_sub_category_type_id_idx" ON "products"("sub_category_type_id");

-- CreateIndex
CREATE INDEX "sub_category_category_id_idx" ON "sub_category"("category_id");

-- CreateIndex
CREATE INDEX "sub_category_type_sub_category_id_idx" ON "sub_category_type"("sub_category_id");

-- AddForeignKey
ALTER TABLE "_brandTosub_category" ADD CONSTRAINT "_brandTosub_category_A_fkey" FOREIGN KEY ("A") REFERENCES "brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_brandTosub_category" ADD CONSTRAINT "_brandTosub_category_B_fkey" FOREIGN KEY ("B") REFERENCES "sub_category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
