-- ─── ARANCELES LNB MASCULINO 2026 — v2 ───────────────────
-- Ejecutar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS "aranceles_lnb" (
  "id"            UUID          NOT NULL DEFAULT gen_random_uuid(),
  "torneo"        TEXT          NOT NULL,
  "fase"          TEXT          NOT NULL,
  "faseNombre"    TEXT          NOT NULL,
  "rol"           TEXT          NOT NULL,
  "montoUnitario" DECIMAL(12,2) NOT NULL,
  "cantPersonas"  INTEGER       NOT NULL,
  "esManual"      BOOLEAN       NOT NULL DEFAULT false,
  "activo"        BOOLEAN       NOT NULL DEFAULT true,
  "createdAt"     TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "aranceles_lnb_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "aranceles_lnb_torneo_fase_rol_key" UNIQUE ("torneo", "fase", "rol")
);

-- Trigger para updatedAt automático
CREATE OR REPLACE FUNCTION update_aranceles_lnb_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS aranceles_lnb_updated_at ON "aranceles_lnb";
CREATE TRIGGER aranceles_lnb_updated_at
  BEFORE UPDATE ON "aranceles_lnb"
  FOR EACH ROW EXECUTE FUNCTION update_aranceles_lnb_updated_at();

-- ─── SEED: LNB MASCULINO 2026 ────────────────────────────
-- IVA: 10% sobre total neto. Feriados: +50% sobre total c/IVA.
-- Suspendidos/reprogramados: pagar 100% igual.

INSERT INTO "aranceles_lnb" ("torneo", "fase", "faseNombre", "rol", "montoUnitario", "cantPersonas", "esManual")
VALUES

-- LNB_ETAPA1_ASU — 2 árbitros, 3 mesa (neto 970.000)
('LNB_MASC', 'LNB_ETAPA1_ASU', 'Etapa 1 — Asunción',  'ARBITRO',       200000, 2, false),
('LNB_MASC', 'LNB_ETAPA1_ASU', 'Etapa 1 — Asunción',  'OFICIAL_MESA',  110000, 3, false),
('LNB_MASC', 'LNB_ETAPA1_ASU', 'Etapa 1 — Asunción',  'ESTADISTICO',   150000, 1, false),
('LNB_MASC', 'LNB_ETAPA1_ASU', 'Etapa 1 — Asunción',  'RELATOR',        90000, 1, false),

-- LNB_ETAPA1_INT — 2 árbitros, 3 mesa (neto 1.410.000)
('LNB_MASC', 'LNB_ETAPA1_INT', 'Etapa 1 — Interior',  'ARBITRO',       270000, 2, false),
('LNB_MASC', 'LNB_ETAPA1_INT', 'Etapa 1 — Interior',  'OFICIAL_MESA',  160000, 3, false),
('LNB_MASC', 'LNB_ETAPA1_INT', 'Etapa 1 — Interior',  'ESTADISTICO',   250000, 1, false),
('LNB_MASC', 'LNB_ETAPA1_INT', 'Etapa 1 — Interior',  'RELATOR',       140000, 1, false),

-- LNB_COMUNEROS_ASU — 3 árbitros, 3 mesa (neto 1.500.000)
('LNB_MASC', 'LNB_COMUNEROS_ASU', 'Comuneros — Asunción', 'ARBITRO',       230000, 3, false),
('LNB_MASC', 'LNB_COMUNEROS_ASU', 'Comuneros — Asunción', 'OFICIAL_MESA',  180000, 3, false),
('LNB_MASC', 'LNB_COMUNEROS_ASU', 'Comuneros — Asunción', 'ESTADISTICO',   170000, 1, false),
('LNB_MASC', 'LNB_COMUNEROS_ASU', 'Comuneros — Asunción', 'RELATOR',       100000, 1, false),

-- LNB_COMUNEROS_INT — 3 árbitros, 3 mesa (neto 1.910.000)
('LNB_MASC', 'LNB_COMUNEROS_INT', 'Comuneros — Interior', 'ARBITRO',       300000, 3, false),
('LNB_MASC', 'LNB_COMUNEROS_INT', 'Comuneros — Interior', 'OFICIAL_MESA',  200000, 3, false),
('LNB_MASC', 'LNB_COMUNEROS_INT', 'Comuneros — Interior', 'ESTADISTICO',   260000, 1, false),
('LNB_MASC', 'LNB_COMUNEROS_INT', 'Comuneros — Interior', 'RELATOR',       150000, 1, false),

-- LNB_FINAL_COM — 3 árbitros, 3 mesa, cualquier sede (neto 2.880.000)
('LNB_MASC', 'LNB_FINAL_COM', 'Final Comuneros',      'ARBITRO',       500000, 3, false),
('LNB_MASC', 'LNB_FINAL_COM', 'Final Comuneros',      'OFICIAL_MESA',  300000, 3, false),
('LNB_MASC', 'LNB_FINAL_COM', 'Final Comuneros',      'ESTADISTICO',   300000, 1, false),
('LNB_MASC', 'LNB_FINAL_COM', 'Final Comuneros',      'RELATOR',       180000, 1, false),

-- LNB_TOP4_ASU — 3 árbitros, 3 mesa (neto 3.170.000)
('LNB_MASC', 'LNB_TOP4_ASU', 'Top 4 — Asunción',     'ARBITRO',       550000, 3, false),
('LNB_MASC', 'LNB_TOP4_ASU', 'Top 4 — Asunción',     'OFICIAL_MESA',  350000, 3, false),
('LNB_MASC', 'LNB_TOP4_ASU', 'Top 4 — Asunción',     'ESTADISTICO',   300000, 1, false),
('LNB_MASC', 'LNB_TOP4_ASU', 'Top 4 — Asunción',     'RELATOR',       170000, 1, false),

-- LNB_TOP4_INT — 3 árbitros, 3 mesa (neto 3.610.000)
('LNB_MASC', 'LNB_TOP4_INT', 'Top 4 — Interior',     'ARBITRO',       620000, 3, false),
('LNB_MASC', 'LNB_TOP4_INT', 'Top 4 — Interior',     'OFICIAL_MESA',  400000, 3, false),
('LNB_MASC', 'LNB_TOP4_INT', 'Top 4 — Interior',     'ESTADISTICO',   350000, 1, false),
('LNB_MASC', 'LNB_TOP4_INT', 'Top 4 — Interior',     'RELATOR',       200000, 1, false),

-- LNB_TOP4_EXT — 2 árb. nacionales + 1 internacional (cotización manual), 3 mesa
-- Neto calculable (sin intl): 3.130.000
('LNB_MASC', 'LNB_TOP4_EXT', 'Top 4 — Internacional', 'ARBITRO_NAC',   650000, 2, false),
('LNB_MASC', 'LNB_TOP4_EXT', 'Top 4 — Internacional', 'OFICIAL_MESA',  400000, 3, false),
('LNB_MASC', 'LNB_TOP4_EXT', 'Top 4 — Internacional', 'ESTADISTICO',   380000, 1, false),
('LNB_MASC', 'LNB_TOP4_EXT', 'Top 4 — Internacional', 'RELATOR',       250000, 1, false),
('LNB_MASC', 'LNB_TOP4_EXT', 'Top 4 — Internacional', 'ARBITRO_INTL',       0, 1, true),

-- LNB_FINAL_TOP4 — 3 árbitros, 3 mesa, cualquier sede (neto 5.950.000)
('LNB_MASC', 'LNB_FINAL_TOP4', 'Final Top 4',        'ARBITRO',      1100000, 3, false),
('LNB_MASC', 'LNB_FINAL_TOP4', 'Final Top 4',        'OFICIAL_MESA',  600000, 3, false),
('LNB_MASC', 'LNB_FINAL_TOP4', 'Final Top 4',        'ESTADISTICO',   550000, 1, false),
('LNB_MASC', 'LNB_FINAL_TOP4', 'Final Top 4',        'RELATOR',       300000, 1, false),

-- LNB_FINAL_EXT — 2 árb. nacionales + 1 internacional (cotización manual), 3 mesa
-- Neto calculable (sin intl): 5.620.000
('LNB_MASC', 'LNB_FINAL_EXT', 'Final — Internacional', 'ARBITRO_NAC',  1250000, 2, false),
('LNB_MASC', 'LNB_FINAL_EXT', 'Final — Internacional', 'OFICIAL_MESA',  700000, 3, false),
('LNB_MASC', 'LNB_FINAL_EXT', 'Final — Internacional', 'ESTADISTICO',   670000, 1, false),
('LNB_MASC', 'LNB_FINAL_EXT', 'Final — Internacional', 'RELATOR',       350000, 1, false),
('LNB_MASC', 'LNB_FINAL_EXT', 'Final — Internacional', 'ARBITRO_INTL',       0, 1, true)

ON CONFLICT ("torneo", "fase", "rol") DO UPDATE SET
  "faseNombre"    = EXCLUDED."faseNombre",
  "montoUnitario" = EXCLUDED."montoUnitario",
  "cantPersonas"  = EXCLUDED."cantPersonas",
  "esManual"      = EXCLUDED."esManual",
  "updatedAt"     = CURRENT_TIMESTAMP;

-- Verificación rápida de totales neto por fase
-- Ejecutar después del INSERT para confirmar los datos:
/*
SELECT
  fase,
  "faseNombre",
  SUM("montoUnitario" * "cantPersonas") FILTER (WHERE "esManual" = false) AS neto,
  SUM("montoUnitario" * "cantPersonas") FILTER (WHERE "esManual" = false) * 0.10 AS iva,
  SUM("montoUnitario" * "cantPersonas") FILTER (WHERE "esManual" = false) * 1.10 AS total_con_iva
FROM aranceles_lnb
WHERE torneo = 'LNB_MASC' AND activo = true
GROUP BY fase, "faseNombre"
ORDER BY total_con_iva;
*/
