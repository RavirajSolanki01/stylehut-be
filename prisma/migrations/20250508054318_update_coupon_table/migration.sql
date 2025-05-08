/*
  Warnings:

  - You are about to alter the column `name` on the `brand` table. The data in that column could be lost. The data in that column will be cast from `VarChar(40)` to `VarChar(30)`.
  - You are about to alter the column `description` on the `brand` table. The data in that column could be lost. The data in that column will be cast from `VarChar(1024)` to `VarChar(100)`.
  - You are about to alter the column `name` on the `category` table. The data in that column could be lost. The data in that column will be cast from `VarChar(40)` to `VarChar(30)`.
  - You are about to alter the column `description` on the `category` table. The data in that column could be lost. The data in that column will be cast from `VarChar(1024)` to `VarChar(100)`.
  - You are about to alter the column `name` on the `gender` table. The data in that column could be lost. The data in that column will be cast from `VarChar(40)` to `VarChar(30)`.
  - You are about to alter the column `name` on the `products` table. The data in that column could be lost. The data in that column will be cast from `VarChar(40)` to `VarChar(30)`.
  - You are about to alter the column `description` on the `products` table. The data in that column could be lost. The data in that column will be cast from `VarChar(1024)` to `VarChar(100)`.
  - You are about to alter the column `name` on the `sub_category` table. The data in that column could be lost. The data in that column will be cast from `VarChar(40)` to `VarChar(30)`.
  - You are about to alter the column `description` on the `sub_category` table. The data in that column could be lost. The data in that column will be cast from `VarChar(1024)` to `VarChar(100)`.
  - You are about to alter the column `name` on the `sub_category_type` table. The data in that column could be lost. The data in that column will be cast from `VarChar(40)` to `VarChar(30)`.
  - You are about to alter the column `description` on the `sub_category_type` table. The data in that column could be lost. The data in that column will be cast from `VarChar(1024)` to `VarChar(100)`.

*/
-- AlterTable
ALTER TABLE "brand" ALTER COLUMN "name" SET DATA TYPE VARCHAR(30),
ALTER COLUMN "description" SET DATA TYPE VARCHAR(100);

-- AlterTable
ALTER TABLE "category" ALTER COLUMN "name" SET DATA TYPE VARCHAR(30),
ALTER COLUMN "description" SET DATA TYPE VARCHAR(100);

-- AlterTable
ALTER TABLE "coupon" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "gender" ALTER COLUMN "name" SET DATA TYPE VARCHAR(30);

-- AlterTable
ALTER TABLE "products" ALTER COLUMN "name" SET DATA TYPE VARCHAR(30),
ALTER COLUMN "description" SET DATA TYPE VARCHAR(100);

-- AlterTable
ALTER TABLE "sub_category" ALTER COLUMN "name" SET DATA TYPE VARCHAR(30),
ALTER COLUMN "description" SET DATA TYPE VARCHAR(100);

-- AlterTable
ALTER TABLE "sub_category_type" ALTER COLUMN "name" SET DATA TYPE VARCHAR(30),
ALTER COLUMN "description" SET DATA TYPE VARCHAR(100);
