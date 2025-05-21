-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_size_quantity_id_fkey";

-- CreateTable
CREATE TABLE "_productsTosize_quantity" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_productsTosize_quantity_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_productsTosize_quantity_B_index" ON "_productsTosize_quantity"("B");

-- AddForeignKey
ALTER TABLE "_productsTosize_quantity" ADD CONSTRAINT "_productsTosize_quantity_A_fkey" FOREIGN KEY ("A") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_productsTosize_quantity" ADD CONSTRAINT "_productsTosize_quantity_B_fkey" FOREIGN KEY ("B") REFERENCES "size_quantity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
