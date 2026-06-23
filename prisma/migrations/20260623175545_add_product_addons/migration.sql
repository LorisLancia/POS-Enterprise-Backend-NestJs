/*
  Warnings:

  - You are about to drop the column `client_sale_id` on the `sales` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "sales_client_sale_id_key";

-- AlterTable
ALTER TABLE "sales" DROP COLUMN "client_sale_id";

-- CreateTable
CREATE TABLE "product_addons" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "max_quantity" INTEGER NOT NULL DEFAULT 0,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_addons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_addon_items" (
    "id" SERIAL NOT NULL,
    "addon_id" INTEGER NOT NULL,
    "addon_product_id" INTEGER NOT NULL,
    "quantity_value" DECIMAL(12,4) NOT NULL DEFAULT 1,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "product_addon_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_item_addons" (
    "id" SERIAL NOT NULL,
    "sale_item_id" INTEGER NOT NULL,
    "addon_product_id" INTEGER NOT NULL,
    "quantity" DECIMAL(12,4) NOT NULL DEFAULT 1,
    "quantity_value" DECIMAL(12,4) NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "total_price" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "sale_item_addons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_addon_items_addon_id_addon_product_id_key" ON "product_addon_items"("addon_id", "addon_product_id");

-- AddForeignKey
ALTER TABLE "product_addons" ADD CONSTRAINT "product_addons_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_addon_items" ADD CONSTRAINT "product_addon_items_addon_id_fkey" FOREIGN KEY ("addon_id") REFERENCES "product_addons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_addon_items" ADD CONSTRAINT "product_addon_items_addon_product_id_fkey" FOREIGN KEY ("addon_product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_item_addons" ADD CONSTRAINT "sale_item_addons_sale_item_id_fkey" FOREIGN KEY ("sale_item_id") REFERENCES "sale_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_item_addons" ADD CONSTRAINT "sale_item_addons_addon_product_id_fkey" FOREIGN KEY ("addon_product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
