/*
  Warnings:

  - You are about to drop the column `quantity` on the `products` table. All the data in the column will be lost.
  - You are about to drop the `product_variant` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `product_variant_attribute` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `variant_attribute` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "product_variant" DROP CONSTRAINT "product_variant_product_id_fkey";

-- DropForeignKey
ALTER TABLE "product_variant_attribute" DROP CONSTRAINT "product_variant_attribute_variant_attribute_id_fkey";

-- DropForeignKey
ALTER TABLE "product_variant_attribute" DROP CONSTRAINT "product_variant_attribute_variant_id_fkey";

-- AlterTable
ALTER TABLE "products" DROP COLUMN "quantity",
ADD COLUMN     "size_quantity_id" INTEGER,
ADD COLUMN     "variant_id" INTEGER;

-- DropTable
DROP TABLE "product_variant";

-- DropTable
DROP TABLE "product_variant_attribute";

-- DropTable
DROP TABLE "variant_attribute";

-- CreateTable
CREATE TABLE "size_quantity" (
    "id" SERIAL NOT NULL,
    "quantity" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "variant_id" INTEGER,
    "size_id" INTEGER NOT NULL,
    "create_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "size_quantity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "size_data" (
    "id" SERIAL NOT NULL,
    "size" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "create_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "size_data_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_size_quantity_id_fkey" FOREIGN KEY ("size_quantity_id") REFERENCES "size_quantity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "size_quantity" ADD CONSTRAINT "size_quantity_size_id_fkey" FOREIGN KEY ("size_id") REFERENCES "size_data"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
