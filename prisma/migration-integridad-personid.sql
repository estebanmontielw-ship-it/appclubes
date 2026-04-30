-- ═══════════════════════════════════════════════════════════
-- INTEGRIDAD — Vincular jugadores tier con personId de Genius
-- ═══════════════════════════════════════════════════════════
-- Permite cruzar el dossier de cada jugador con el endpoint
-- /api/website/jugador-partidos?personId=X (que devuelve game log
-- completo de TODA la temporada desde Genius Warehouse, no solo
-- los partidos analizados).

ALTER TABLE "integridad_jugadores_tier"
  ADD COLUMN IF NOT EXISTS "personId" INTEGER;

CREATE INDEX IF NOT EXISTS "integridad_jugadores_tier_personId_idx"
  ON "integridad_jugadores_tier" ("personId");
