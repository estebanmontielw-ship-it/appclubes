-- AlterTable: add periodo_habilitacion to track annual habilitacion year
ALTER TABLE "cuerpo_tecnico" ADD COLUMN IF NOT EXISTS "periodoHabilitacion" INTEGER NOT NULL DEFAULT 2026;
