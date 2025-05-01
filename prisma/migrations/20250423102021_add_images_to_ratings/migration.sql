-- AlterTable
ALTER TABLE "ratings" ADD COLUMN "images" TEXT[] DEFAULT ARRAY[]::TEXT[];
