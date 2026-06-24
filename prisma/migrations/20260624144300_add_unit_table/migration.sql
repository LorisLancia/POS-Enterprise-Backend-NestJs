-- CreateUnit table
CREATE TABLE "units" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'piece',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey (nullable, quindi non viola shadow DB)
ALTER TABLE "units" ADD CONSTRAINT "units_store_id_fkey" 
    FOREIGN KEY ("store_id") REFERENCES "stores"("id") 
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Add unit_id columns (nullable)
ALTER TABLE "materials" ADD COLUMN "unit_id" INTEGER;
ALTER TABLE "product_recipes" ADD COLUMN "unit_id" INTEGER;

-- CreateIndex
CREATE INDEX "units_store_id_idx" ON "units"("store_id");