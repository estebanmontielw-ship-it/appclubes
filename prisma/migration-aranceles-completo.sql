-- ─── ARANCELES CPB 2026 — TORNEOS COMPLETOS ─────────────────
-- Ejecutar en Supabase SQL Editor
-- Nuevos torneos: U22_FEM, INF_FEM, INF_MASC_U1517, INF_MASC_U19
-- LNB_MASC ya está cargado (migration-aranceles-lnb.sql)
--
-- ORDEN DE CÁLCULO OBLIGATORIO (global):
--   1. Neto = Σ (tarifa × cant) por rol
--   2. IVA = neto × 0.10
--   3. Total c/IVA = neto + IVA
--   4. Si feriado: total c/IVA × 1.50
--   5. Plus transporte (solo Inferiores): Luque +60.000 / Capiatá +80.000
--   6. TOTAL FINAL = paso 4 + paso 5

INSERT INTO "aranceles_lnb" ("torneo","fase","faseNombre","rol","montoUnitario","cantPersonas","esManual")
VALUES

-- ════════════════════════════════════════════════════════
-- TORNEO: U22_FEM  —  Liga de Desarrollo U22 Femenino
-- Roles: ARBITRO, OFICIAL_MESA · Sin estadístico ni relator
-- Todos los partidos en Asunción · Sin plus transporte
-- ════════════════════════════════════════════════════════

-- ETAPA1 — 2 árbitros, 3 mesa  (neto 465.000)
('U22_FEM','U22_FEM_ETAPA1','Etapa 1',                 'ARBITRO',       120000, 2, false),
('U22_FEM','U22_FEM_ETAPA1','Etapa 1',                 'OFICIAL_MESA',   75000, 3, false),

-- ETAPA2 — 2 árbitros, 3 mesa  (neto 795.000)
('U22_FEM','U22_FEM_ETAPA2','Etapa 2',                 'ARBITRO',       210000, 2, false),
('U22_FEM','U22_FEM_ETAPA2','Etapa 2',                 'OFICIAL_MESA',  125000, 3, false),

-- FINAL — 3 árbitros, 3 mesa  (neto 1.350.000)
('U22_FEM','U22_FEM_FINAL','Final',                    'ARBITRO',       280000, 3, false),
('U22_FEM','U22_FEM_FINAL','Final',                    'OFICIAL_MESA',  170000, 3, false),


-- ════════════════════════════════════════════════════════
-- TORNEO: INF_FEM  —  U13 / U15 / U17 Femenino
-- Roles: ARBITRO, OFICIAL_MESA
-- Plus transporte: Luque +60.000 / Capiatá +80.000
-- ════════════════════════════════════════════════════════

-- ETAPA1 — 2 árbitros, 3 mesa — Asunción  (neto 355.000)
('INF_FEM','INF_FEM_ETAPA1','Etapa 1 — Asunción',      'ARBITRO',        95000, 2, false),
('INF_FEM','INF_FEM_ETAPA1','Etapa 1 — Asunción',      'OFICIAL_MESA',   55000, 3, false),

-- ETAPA1_UNICA — 2 árbitros, 3 mesa — 1 partido en sede  (neto 440.000)
('INF_FEM','INF_FEM_ETAPA1_UNICA','Etapa 1 (partido único)',  'ARBITRO',  115000, 2, false),
('INF_FEM','INF_FEM_ETAPA1_UNICA','Etapa 1 (partido único)',  'OFICIAL_MESA', 70000, 3, false),

-- ETAPA2_PLATA — 2 árbitros, 3 mesa  (neto 485.000)
('INF_FEM','INF_FEM_ETAPA2_PLATA','Etapa 2 — Plata',   'ARBITRO',       130000, 2, false),
('INF_FEM','INF_FEM_ETAPA2_PLATA','Etapa 2 — Plata',   'OFICIAL_MESA',   75000, 3, false),

-- ETAPA2_ORO — 2 árbitros, 3 mesa  (neto 650.000)
('INF_FEM','INF_FEM_ETAPA2_ORO','Etapa 2 — Oro',       'ARBITRO',       175000, 2, false),
('INF_FEM','INF_FEM_ETAPA2_ORO','Etapa 2 — Oro',       'OFICIAL_MESA',  100000, 3, false),

-- FINAL_PLATA — 3 árbitros, 3 mesa  (neto 750.000)
('INF_FEM','INF_FEM_FINAL_PLATA','Final — Plata',       'ARBITRO',       160000, 3, false),
('INF_FEM','INF_FEM_FINAL_PLATA','Final — Plata',       'OFICIAL_MESA',   90000, 3, false),

-- FINAL_ORO — 3 árbitros, 3 mesa  (neto 1.080.000)
('INF_FEM','INF_FEM_FINAL_ORO','Final — Oro',           'ARBITRO',       230000, 3, false),
('INF_FEM','INF_FEM_FINAL_ORO','Final — Oro',           'OFICIAL_MESA',  130000, 3, false),

-- INTERIOR 1 partido — 2 árbitros, 3 mesa  (neto 850.000)
('INF_FEM','INF_FEM_INTERIOR_1','Interior — 1 partido', 'ARBITRO',       200000, 2, false),
('INF_FEM','INF_FEM_INTERIOR_1','Interior — 1 partido', 'OFICIAL_MESA',  150000, 3, false),

-- INTERIOR 2+ partidos — 2 árbitros, 3 mesa  (neto 590.000)
('INF_FEM','INF_FEM_INTERIOR_2','Interior — 2+ partidos','ARBITRO',      145000, 2, false),
('INF_FEM','INF_FEM_INTERIOR_2','Interior — 2+ partidos','OFICIAL_MESA', 100000, 3, false),


-- ════════════════════════════════════════════════════════
-- TORNEO: INF_MASC_U1517  —  U13 / U15 / U17 Masculino
-- Roles: ARBITRO, AUXILIAR (= Oficial de Mesa, nombre reglamentario)
-- Plus transporte: Luque +60.000 / Capiatá +80.000
-- ════════════════════════════════════════════════════════

-- ETAPA1 — 2 árbitros, 3 auxiliares — Asunción  (neto 355.000)
('INF_MASC_U1517','INF_U1517_ETAPA1','Etapa 1 — Asunción',        'ARBITRO',   95000, 2, false),
('INF_MASC_U1517','INF_U1517_ETAPA1','Etapa 1 — Asunción',        'AUXILIAR',  55000, 3, false),

-- ETAPA1_UNICA — 2 árbitros, 3 auxiliares — 1 partido en sede  (neto 440.000)
('INF_MASC_U1517','INF_U1517_ETAPA1_UNICA','Etapa 1 (partido único)',   'ARBITRO', 115000, 2, false),
('INF_MASC_U1517','INF_U1517_ETAPA1_UNICA','Etapa 1 (partido único)',   'AUXILIAR', 70000, 3, false),

-- CTOS_PLATA — 2 árbitros, 3 auxiliares  (neto 440.000)
('INF_MASC_U1517','INF_U1517_CTOS_PLATA','Cuartos — Plata',        'ARBITRO',  115000, 2, false),
('INF_MASC_U1517','INF_U1517_CTOS_PLATA','Cuartos — Plata',        'AUXILIAR',  70000, 3, false),

-- SEMI_PLATA — 2 árbitros, 3 auxiliares  (neto 545.000)
('INF_MASC_U1517','INF_U1517_SEMI_PLATA','Semis — Plata',          'ARBITRO',  145000, 2, false),
('INF_MASC_U1517','INF_U1517_SEMI_PLATA','Semis — Plata',          'AUXILIAR',  85000, 3, false),

-- CTOS_ORO — 2 árbitros, 3 auxiliares  (neto 475.000)
('INF_MASC_U1517','INF_U1517_CTOS_ORO','Cuartos — Oro',            'ARBITRO',  125000, 2, false),
('INF_MASC_U1517','INF_U1517_CTOS_ORO','Cuartos — Oro',            'AUXILIAR',  75000, 3, false),

-- SEMI_ORO — 2 árbitros, 3 auxiliares  (neto 665.000)
('INF_MASC_U1517','INF_U1517_SEMI_ORO','Semis — Oro',              'ARBITRO',  175000, 2, false),
('INF_MASC_U1517','INF_U1517_SEMI_ORO','Semis — Oro',              'AUXILIAR', 105000, 3, false),

-- FINAL_PLATA — 3 árbitros, 3 auxiliares  (neto 840.000)
('INF_MASC_U1517','INF_U1517_FINAL_PLATA','Final — Plata',         'ARBITRO',  180000, 3, false),
('INF_MASC_U1517','INF_U1517_FINAL_PLATA','Final — Plata',         'AUXILIAR', 100000, 3, false),

-- FINAL_ORO — 3 árbitros, 3 auxiliares  (neto 1.140.000)
('INF_MASC_U1517','INF_U1517_FINAL_ORO','Final — Oro',             'ARBITRO',  240000, 3, false),
('INF_MASC_U1517','INF_U1517_FINAL_ORO','Final — Oro',             'AUXILIAR', 140000, 3, false),

-- INTERIOR 1 partido — 2 árbitros, 3 auxiliares  (neto 850.000)
('INF_MASC_U1517','INF_U1517_INTERIOR_1','Interior — 1 partido',   'ARBITRO',  200000, 2, false),
('INF_MASC_U1517','INF_U1517_INTERIOR_1','Interior — 1 partido',   'AUXILIAR', 150000, 3, false),

-- INTERIOR 2+ partidos — 2 árbitros, 3 auxiliares  (neto 590.000)
('INF_MASC_U1517','INF_U1517_INTERIOR_2','Interior — 2+ partidos', 'ARBITRO',  145000, 2, false),
('INF_MASC_U1517','INF_U1517_INTERIOR_2','Interior — 2+ partidos', 'AUXILIAR', 100000, 3, false),


-- ════════════════════════════════════════════════════════
-- TORNEO: INF_MASC_U19  —  U19 Masculino
-- Roles: ARBITRO, AUXILIAR (= Oficial de Mesa)
-- Plus transporte: Luque +60.000 / Capiatá +80.000
-- ════════════════════════════════════════════════════════

-- ETAPA1 — 2 árbitros, 3 auxiliares — Asunción  (neto 440.000)
('INF_MASC_U19','INF_U19_ETAPA1','Etapa 1 — Asunción',            'ARBITRO',  115000, 2, false),
('INF_MASC_U19','INF_U19_ETAPA1','Etapa 1 — Asunción',            'AUXILIAR',  70000, 3, false),

-- CUARTOS — 2 árbitros, 3 auxiliares  (neto 510.000)
('INF_MASC_U19','INF_U19_CUARTOS','Cuartos de Final',             'ARBITRO',  135000, 2, false),
('INF_MASC_U19','INF_U19_CUARTOS','Cuartos de Final',             'AUXILIAR',  80000, 3, false),

-- SEMIS — 2 árbitros, 3 auxiliares  (neto 770.000)
('INF_MASC_U19','INF_U19_SEMIS','Semifinales',                    'ARBITRO',  205000, 2, false),
('INF_MASC_U19','INF_U19_SEMIS','Semifinales',                    'AUXILIAR', 120000, 3, false),

-- FINAL — 3 árbitros, 3 auxiliares  (neto 1.230.000)
('INF_MASC_U19','INF_U19_FINAL','Final',                          'ARBITRO',  260000, 3, false),
('INF_MASC_U19','INF_U19_FINAL','Final',                          'AUXILIAR', 150000, 3, false),

-- INTERIOR 1 partido — 2 árbitros, 3 auxiliares  (neto 850.000)
('INF_MASC_U19','INF_U19_INTERIOR_1','Interior — 1 partido',      'ARBITRO',  200000, 2, false),
('INF_MASC_U19','INF_U19_INTERIOR_1','Interior — 1 partido',      'AUXILIAR', 150000, 3, false),

-- INTERIOR 2+ partidos — 2 árbitros, 3 auxiliares  (neto 590.000)
('INF_MASC_U19','INF_U19_INTERIOR_2','Interior — 2+ partidos',    'ARBITRO',  145000, 2, false),
('INF_MASC_U19','INF_U19_INTERIOR_2','Interior — 2+ partidos',    'AUXILIAR', 100000, 3, false)

ON CONFLICT ("torneo","fase","rol") DO UPDATE SET
  "faseNombre"    = EXCLUDED."faseNombre",
  "montoUnitario" = EXCLUDED."montoUnitario",
  "cantPersonas"  = EXCLUDED."cantPersonas",
  "esManual"      = EXCLUDED."esManual",
  "updatedAt"     = CURRENT_TIMESTAMP;

-- ─── VERIFICACIÓN ────────────────────────────────────────
-- Ejecutar después para confirmar totales neto por torneo/fase:
/*
SELECT torneo, fase, "faseNombre",
  SUM("montoUnitario" * "cantPersonas") AS neto_calculado
FROM aranceles_lnb
WHERE torneo IN ('U22_FEM','INF_FEM','INF_MASC_U1517','INF_MASC_U19')
  AND activo = true
GROUP BY torneo, fase, "faseNombre"
ORDER BY torneo, neto_calculado;
*/
