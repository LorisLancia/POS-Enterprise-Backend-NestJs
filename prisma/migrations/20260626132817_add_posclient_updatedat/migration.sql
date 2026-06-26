/*
  Warnings:

  - Added the required column `updated_at` to the `pos_clients` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "pos_clients" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
