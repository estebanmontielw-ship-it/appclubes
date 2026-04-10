-- Migration: add aceptoTerminosEn to usuarios and cuerpotecnico
-- Run once in production via Supabase SQL editor

ALTER TABLE "usuarios"
  ADD COLUMN IF NOT EXISTS "aceptoTerminosEn" TIMESTAMP(3);

ALTER TABLE "CuerpoTecnico"
  ADD COLUMN IF NOT EXISTS "aceptoTerminosEn" TIMESTAMP(3);
