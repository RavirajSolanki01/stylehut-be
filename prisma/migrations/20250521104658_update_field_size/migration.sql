-- CreateTable
CREATE TABLE "admin_settings_category" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "cardColor" TEXT NOT NULL,
    "fontColor" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_settings_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shop_by_category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "minDiscount" INTEGER NOT NULL,
    "maxDiscount" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,
    "card_image" TEXT NOT NULL,
    "create_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shop_by_category_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shop_by_category_user_id_idx" ON "shop_by_category"("user_id");

-- AddForeignKey
ALTER TABLE "shop_by_category" ADD CONSTRAINT "shop_by_category_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_by_category" ADD CONSTRAINT "shop_by_category_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
