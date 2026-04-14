-- ─── ARANCELES LNB FEMENINO 2026 ─────────────────────────
-- Ejecutar en Supabase SQL Editor
-- Torneo: LNB_FEM
-- Roles: ARBITRO, OFICIAL_MESA, ESTADISTICO, RELATOR
-- Todos los partidos en Asunción. Sin plus transporte.
-- EXTRANJEROS: 2 árb. nacionales + 1 internacional (manual)

INSERT INTO "aranceles_lnb" ("torneo","fase","faseNombre","rol","montoUnitario","cantPersonas","esManual")
VALUES

-- ETAPA1 — 2 árbitros, 3 mesa (neto 710.000)
('LNB_FEM','LNB_FEM_ETAPA1','Etapa 1',         'ARBITRO',      150000, 2, false),
('LNB_FEM','LNB_FEM_ETAPA1','Etapa 1',         'OFICIAL_MESA',  80000, 3, false),
('LNB_FEM','LNB_FEM_ETAPA1','Etapa 1',         'ESTADISTICO',  100000, 1, false),
('LNB_FEM','LNB_FEM_ETAPA1','Etapa 1',         'RELATOR',       70000, 1, false),

-- ETAPA2 — 2 árbitros, 3 mesa (neto 1.310.000)
('LNB_FEM','LNB_FEM_ETAPA2','Etapa 2',         'ARBITRO',      280000, 2, false),
('LNB_FEM','LNB_FEM_ETAPA2','Etapa 2',         'OFICIAL_MESA', 160000, 3, false),
('LNB_FEM','LNB_FEM_ETAPA2','Etapa 2',         'ESTADISTICO',  160000, 1, false),
('LNB_FEM','LNB_FEM_ETAPA2','Etapa 2',         'RELATOR',      110000, 1, false),

-- FINAL — 3 árbitros, 3 mesa (neto 2.310.000)
('LNB_FEM','LNB_FEM_FINAL','Final',             'ARBITRO',      400000, 3, false),
('LNB_FEM','LNB_FEM_FINAL','Final',             'OFICIAL_MESA', 230000, 3, false),
('LNB_FEM','LNB_FEM_FINAL','Final',             'ESTADISTICO',  260000, 1, false),
('LNB_FEM','LNB_FEM_FINAL','Final',             'RELATOR',      160000, 1, false),

-- EXTRANJEROS — 2 árb. nacionales + 1 internacional (cotización manual), 3 mesa
-- Neto calculable (sin intl): 5.600.000
('LNB_FEM','LNB_FEM_EXT','Con árbitro extranjero', 'ARBITRO_NAC',  1250000, 2, false),
('LNB_FEM','LNB_FEM_EXT','Con árbitro extranjero', 'OFICIAL_MESA',  700000, 3, false),
('LNB_FEM','LNB_FEM_EXT','Con árbitro extranjero', 'ESTADISTICO',   660000, 1, false),
('LNB_FEM','LNB_FEM_EXT','Con árbitro extranjero', 'RELATOR',       340000, 1, false),
('LNB_FEM','LNB_FEM_EXT','Con árbitro extranjero', 'ARBITRO_INTL',       0, 1, true)

ON CONFLICT ("torneo","fase","rol") DO UPDATE SET
  "faseNombre"    = EXCLUDED."faseNombre",
  "montoUnitario" = EXCLUDED."montoUnitario",
  "cantPersonas"  = EXCLUDED."cantPersonas",
  "esManual"      = EXCLUDED."esManual",
  "updatedAt"     = CURRENT_TIMESTAMP;

-- ─── VERIFICACIÓN ────────────────────────────────────────
-- Ejecutar después para confirmar totales neto:
/*
SELECT fase, "faseNombre",
  SUM("montoUnitario" * "cantPersonas") FILTER (WHERE "esManual" = false) AS neto,
  SUM("montoUnitario" * "cantPersonas") FILTER (WHERE "esManual" = false) * 0.10 AS iva,
  SUM("montoUnitario" * "cantPersonas") FILTER (WHERE "esManual" = false) * 1.10 AS total_con_iva
FROM aranceles_lnb
WHERE torneo = 'LNB_FEM' AND activo = true
GROUP BY fase, "faseNombre"
ORDER BY total_con_iva;
-- Esperado: 781.000 / 1.441.000 / 2.541.000 / 6.160.000*
*/
