/*
  Warnings:

  - A unique constraint covering the columns `[client_sale_id]` on the table `sales` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "sales" ADD COLUMN     "client_sale_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "sales_client_sale_id_key" ON "sales"("client_sale_id");
