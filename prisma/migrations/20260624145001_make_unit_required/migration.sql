/*
  Warnings:

  - Made the column `unit_id` on table `materials` required. This step will fail if there are existing NULL values in that column.
  - Made the column `unit_id` on table `product_recipes` required. This step will fail if there are existing NULL values in that column.
  - Made the column `store_id` on table `units` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "materials" DROP CONSTRAINT "materials_unit_id_fkey";

-- DropForeignKey
ALTER TABLE "product_recipes" DROP CONSTRAINT "product_recipes_unit_id_fkey";

-- DropForeignKey
ALTER TABLE "units" DROP CONSTRAINT "units_store_id_fkey";

-- AlterTable
ALTER TABLE "materials" ALTER COLUMN "unit_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "product_recipes" ALTER COLUMN "unit_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "units" ALTER COLUMN "store_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_recipes" ADD CONSTRAINT "product_recipes_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
