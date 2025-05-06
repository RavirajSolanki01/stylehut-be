-- CreateEnum
CREATE TYPE "AddressType" AS ENUM ('HOME', 'OFFICE');

-- AlterTable
ALTER TABLE "address" ADD COLUMN     "address_type" "AddressType" NOT NULL DEFAULT 'HOME',
ADD COLUMN     "is_open_saturday" BOOLEAN DEFAULT false,
ADD COLUMN     "is_open_sunday" BOOLEAN DEFAULT false;

-- CreateIndex
CREATE INDEX "address_address_type_idx" ON "address"("address_type");
