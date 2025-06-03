/*
  Warnings:

  - A unique constraint covering the columns `[custom_size_id]` on the table `size_data` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "size_chart_data" DROP CONSTRAINT "size_chart_data_size_data_id_fkey";

-- CreateIndex
CREATE UNIQUE INDEX "size_data_custom_size_id_key" ON "size_data"("custom_size_id");

-- AddForeignKey
ALTER TABLE "size_chart_data" ADD CONSTRAINT "size_chart_data_custom_size_id_fkey" FOREIGN KEY ("custom_size_id") REFERENCES "size_data"("custom_size_id") ON DELETE RESTRICT ON UPDATE CASCADE;
