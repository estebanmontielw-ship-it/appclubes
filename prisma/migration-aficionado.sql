-- Migration: add AFICIONADO role + fan profile fields
-- Run once in Supabase SQL editor or via psql

-- 1. Add AFICIONADO value to TipoRol enum
ALTER TYPE "TipoRol" ADD VALUE IF NOT EXISTS 'AFICIONADO';

-- 2. Make cedula, fechaNacimiento, telefono, ciudad nullable
--    (safe change — existing rows keep their values, new fan rows can omit them)
ALTER TABLE "usuarios" ALTER COLUMN "cedula" DROP NOT NULL;
ALTER TABLE "usuarios" ALTER COLUMN "fechaNacimiento" DROP NOT NULL;
ALTER TABLE "usuarios" ALTER COLUMN "telefono" DROP NOT NULL;
ALTER TABLE "usuarios" ALTER COLUMN "ciudad" DROP NOT NULL;

-- 3. Add new fan profile columns
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "clubFavorito" TEXT;
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "alertasCategorias" TEXT;
