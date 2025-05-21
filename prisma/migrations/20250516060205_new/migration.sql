-- AlterTable
ALTER TABLE "products" ADD COLUMN     "custom_product_id" TEXT;

-- AlterTable
ALTER TABLE "size_quantity" ADD COLUMN     "custom_product_id" TEXT,
ALTER COLUMN "product_id" DROP NOT NULL;
