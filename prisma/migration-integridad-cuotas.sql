-- ═══════════════════════════════════════════════════════════
-- INTEGRIDAD — Cuotas de apuestas (snapshots históricos)
-- ═══════════════════════════════════════════════════════════
-- Almacena cuotas de over/under, spread y money line capturadas
-- de las casas reportantes a IBIA + agregadores. Cada fila es un
-- "snapshot" en el tiempo, así detectamos movimientos sospechosos
-- pre-partido.

CREATE TABLE IF NOT EXISTS "integridad_cuotas" (
  "id"            TEXT NOT NULL,
  "matchId"       TEXT NOT NULL,
  "fuente"        TEXT NOT NULL,           -- "leovegas" | "casa_apostas" | "orenes" | "draftkings" | "oddsportal" | etc
  "fuenteUrl"     TEXT,                    -- URL donde se obtuvo
  "mercado"       TEXT NOT NULL,           -- "total_over_under" | "spread" | "money_line"
  "linea"         DECIMAL(6,2),            -- la línea (ej. 150.5 para over/under)
  "lado"          TEXT,                    -- "over" | "under" | "home" | "away"
  "cuota"         DECIMAL(8,3) NOT NULL,   -- la cuota (ej. 1.92)
  "capturadoEn"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "raw"           JSONB,                   -- payload crudo para debug
  "errorMessage"  TEXT,                    -- si la captura falló, motivo
  "ok"            BOOLEAN NOT NULL DEFAULT true,

  CONSTRAINT "integridad_cuotas_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "integridad_cuotas_matchId_idx" ON "integridad_cuotas"("matchId");
CREATE INDEX IF NOT EXISTS "integridad_cuotas_fuente_idx" ON "integridad_cuotas"("fuente");
CREATE INDEX IF NOT EXISTS "integridad_cuotas_capturadoEn_idx" ON "integridad_cuotas"("capturadoEn");
CREATE INDEX IF NOT EXISTS "integridad_cuotas_match_market_idx" ON "integridad_cuotas"("matchId", "mercado", "fuente");
