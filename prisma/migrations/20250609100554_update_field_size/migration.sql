-- CreateTable
CREATE TABLE "product_specifications" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "specification_key_id" INTEGER NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "product_specifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_additional_details" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "additional_key_id" INTEGER NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "product_additional_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_specification_key" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "product_specification_key_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_additional_detail_key" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "product_additional_detail_key_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_specifications_product_id_specification_key_id_key" ON "product_specifications"("product_id", "specification_key_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_additional_details_product_id_additional_key_id_key" ON "product_additional_details"("product_id", "additional_key_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_specification_key_name_key" ON "product_specification_key"("name");

-- CreateIndex
CREATE UNIQUE INDEX "product_additional_detail_key_name_key" ON "product_additional_detail_key"("name");

-- AddForeignKey
ALTER TABLE "product_specifications" ADD CONSTRAINT "product_specifications_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_specifications" ADD CONSTRAINT "product_specifications_specification_key_id_fkey" FOREIGN KEY ("specification_key_id") REFERENCES "product_specification_key"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_additional_details" ADD CONSTRAINT "product_additional_details_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_additional_details" ADD CONSTRAINT "product_additional_details_additional_key_id_fkey" FOREIGN KEY ("additional_key_id") REFERENCES "product_additional_detail_key"("id") ON DELETE CASCADE ON UPDATE CASCADE;
