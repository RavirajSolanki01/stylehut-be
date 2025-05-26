/*
  Warnings:

  - You are about to drop the column `category_id` on the `shop_by_category` table. All the data in the column will be lost.
  - Added the required column `sub_category_id` to the `shop_by_category` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "shop_by_category" DROP CONSTRAINT "shop_by_category_category_id_fkey";

-- AlterTable
ALTER TABLE "shop_by_category" DROP COLUMN "category_id",
ADD COLUMN     "sub_category_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "shop_by_category" ADD CONSTRAINT "shop_by_category_sub_category_id_fkey" FOREIGN KEY ("sub_category_id") REFERENCES "sub_category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
