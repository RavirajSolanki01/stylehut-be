-- AlterTable
ALTER TABLE "products" ADD COLUMN     "is_main_product" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "variant_id" SET DATA TYPE TEXT;
