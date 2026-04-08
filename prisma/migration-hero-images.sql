-- Add HeroImage table for home hero rotating backgrounds
CREATE TABLE IF NOT EXISTS "hero_images" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "focalDesktopX" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "focalDesktopY" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "focalMobileX" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "focalMobileY" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "hero_images_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "hero_images_orden_idx" ON "hero_images"("orden");
