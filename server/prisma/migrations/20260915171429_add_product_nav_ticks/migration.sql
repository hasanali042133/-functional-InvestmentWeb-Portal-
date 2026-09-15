-- CreateTable
CREATE TABLE "product_nav_ticks" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "recorded_at" TIMESTAMPTZ(3) NOT NULL,
    "nav" DECIMAL(18,4) NOT NULL,

    CONSTRAINT "product_nav_ticks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_nav_ticks_product_id_recorded_at_idx" ON "product_nav_ticks"("product_id", "recorded_at");

-- CreateIndex
CREATE UNIQUE INDEX "product_nav_ticks_product_id_recorded_at_key" ON "product_nav_ticks"("product_id", "recorded_at");

-- AddForeignKey
ALTER TABLE "product_nav_ticks" ADD CONSTRAINT "product_nav_ticks_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
