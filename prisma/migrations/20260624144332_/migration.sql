/*
  Warnings:

  - You are about to drop the column `unit` on the `materials` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `product_recipes` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "units_store_id_idx";

-- AlterTable
ALTER TABLE "materials" DROP COLUMN "unit";

-- AlterTable
ALTER TABLE "product_recipes" DROP COLUMN "unit";

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_recipes" ADD CONSTRAINT "product_recipes_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;
