/*
  Warnings:

  - You are about to drop the column `size_dataId` on the `size_chart_data` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "size_chart_data" DROP CONSTRAINT "size_chart_data_size_dataId_fkey";

-- AlterTable
ALTER TABLE "size_chart_data" DROP COLUMN "size_dataId",
ADD COLUMN     "size_data_id" INTEGER;

-- AddForeignKey
ALTER TABLE "size_chart_data" ADD CONSTRAINT "size_chart_data_size_data_id_fkey" FOREIGN KEY ("size_data_id") REFERENCES "size_data"("id") ON DELETE SET NULL ON UPDATE CASCADE;
