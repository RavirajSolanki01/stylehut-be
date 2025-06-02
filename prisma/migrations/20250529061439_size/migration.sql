/*
  Warnings:

  - Added the required column `custom_size_id` to the `size_data` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "size_data" ADD COLUMN     "custom_size_id" TEXT NOT NULL,
ADD COLUMN     "has_size_chart" BOOLEAN DEFAULT false,
ADD COLUMN     "type" TEXT;

-- CreateTable
CREATE TABLE "size_chart_data" (
    "id" SERIAL NOT NULL,
    "custom_size_id" TEXT NOT NULL,
    "size_field_name" TEXT NOT NULL,
    "size_field_value" TEXT NOT NULL,
    "size_dataId" INTEGER,

    CONSTRAINT "size_chart_data_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "size_chart_data" ADD CONSTRAINT "size_chart_data_size_dataId_fkey" FOREIGN KEY ("size_dataId") REFERENCES "size_data"("id") ON DELETE SET NULL ON UPDATE CASCADE;
