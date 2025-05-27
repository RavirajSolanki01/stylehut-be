-- CreateTable
CREATE TABLE "brand_sub_category" (
    "id" SERIAL NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "sub_category_id" INTEGER NOT NULL,
    "create_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brand_sub_category_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "brand_sub_category_brand_id_sub_category_id_key" ON "brand_sub_category"("brand_id", "sub_category_id");

-- AddForeignKey
ALTER TABLE "brand_sub_category" ADD CONSTRAINT "brand_sub_category_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_sub_category" ADD CONSTRAINT "brand_sub_category_sub_category_id_fkey" FOREIGN KEY ("sub_category_id") REFERENCES "sub_category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
