-- Migration: Aranceles v2 — U22, IVA, manual games
-- Run once in production via Supabase SQL editor

-- 1. Rename enum value U21 → U22
ALTER TYPE "CategoriaPartido" RENAME VALUE 'U21' TO 'U22';

-- 2. Honorario: campos IVA y confirmación de cobro por oficial
ALTER TABLE "honorarios"
  ADD COLUMN IF NOT EXISTS "aplicaIva"   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "montoIva"    DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS "montoTotal"  DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS "cobradoEn"   TIMESTAMP(3);

-- Backfill montoTotal = monto para registros existentes
UPDATE "honorarios" SET "montoTotal" = "monto" WHERE "montoTotal" IS NULL;
ALTER TABLE "honorarios" ALTER COLUMN "montoTotal" SET NOT NULL;

-- 3. Usuario: flag empresa para IVA
ALTER TABLE "usuarios"
  ADD COLUMN IF NOT EXISTS "esEmpresa" BOOLEAN NOT NULL DEFAULT false;

-- 4. Designacion: flag manual
ALTER TABLE "designaciones"
  ADD COLUMN IF NOT EXISTS "esManual" BOOLEAN NOT NULL DEFAULT false;
