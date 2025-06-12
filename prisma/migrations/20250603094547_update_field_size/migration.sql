-- CreateTable
CREATE TABLE "_brandTosub_category" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_brandTosub_category_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_brandTosub_category_B_index" ON "_brandTosub_category"("B");

-- AddForeignKey
ALTER TABLE "_brandTosub_category" ADD CONSTRAINT "_brandTosub_category_A_fkey" FOREIGN KEY ("A") REFERENCES "brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_brandTosub_category" ADD CONSTRAINT "_brandTosub_category_B_fkey" FOREIGN KEY ("B") REFERENCES "sub_category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
