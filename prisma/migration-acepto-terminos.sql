-- Migration: add aceptoTerminosEn to usuarios and cuerpo_tecnico
-- Run once in production via Supabase SQL editor

ALTER TABLE "usuarios"
  ADD COLUMN IF NOT EXISTS "aceptoTerminosEn" TIMESTAMP(3);

ALTER TABLE "cuerpo_tecnico"
  ADD COLUMN IF NOT EXISTS "aceptoTerminosEn" TIMESTAMP(3);
