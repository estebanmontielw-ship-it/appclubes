-- Planillas de Designación (Genius Sports integration)
-- Ejecutar en producción via Supabase SQL editor

CREATE TABLE IF NOT EXISTS planillas_designacion (
  id                    TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "matchId"             TEXT UNIQUE NOT NULL,

  -- Snapshot del partido
  "competicionId"       TEXT NOT NULL,
  categoria             TEXT NOT NULL,
  fecha                 TIMESTAMPTZ NOT NULL,
  "horaStr"             TEXT NOT NULL,
  "equipoLocal"         TEXT NOT NULL,
  "equipoVisit"         TEXT NOT NULL,
  cancha                TEXT,

  -- Estado: BORRADOR | CONFIRMADA
  estado                TEXT NOT NULL DEFAULT 'BORRADOR',

  -- Árbitros
  "ccId"                TEXT,
  "ccNombre"            TEXT,
  "a1Id"                TEXT,
  "a1Nombre"            TEXT,
  "a2Id"                TEXT,
  "a2Nombre"            TEXT,

  -- Mesa
  "apId"                TEXT,
  "apNombre"            TEXT,
  "cronId"              TEXT,
  "cronNombre"          TEXT,
  "lanzId"              TEXT,
  "lanzNombre"          TEXT,
  "estaId"              TEXT,
  "estaNombre"          TEXT,
  "relaId"              TEXT,
  "relaNombre"          TEXT,

  obs                   TEXT,

  -- Metadata
  "creadoPorId"         TEXT NOT NULL,
  "creadoPorNombre"     TEXT NOT NULL,
  "confirmadoPorId"     TEXT,
  "confirmadoPorNombre" TEXT,
  "confirmadaEn"        TIMESTAMPTZ,

  "createdAt"           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS planillas_designacion_logs (
  id                    TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "planillaId"          TEXT NOT NULL REFERENCES planillas_designacion(id) ON DELETE CASCADE,

  accion                TEXT NOT NULL, -- CREADA | MODIFICADA | CONFIRMADA | RECONFIRMADA
  campo                 TEXT,          -- cc | a1 | a2 | ap | cron | lanz | esta | rela | obs | estado
  "valorAnteriorId"     TEXT,
  "valorAnteriorNombre" TEXT,
  "valorNuevoId"        TEXT,
  "valorNuevoNombre"    TEXT,

  "cambiadoPorId"       TEXT NOT NULL,
  "cambiadoPorNombre"   TEXT NOT NULL,
  "cambiadoEn"          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_planillas_fecha ON planillas_designacion(fecha);
CREATE INDEX IF NOT EXISTS idx_planillas_estado ON planillas_designacion(estado);
CREATE INDEX IF NOT EXISTS idx_planillas_logs_planilla ON planillas_designacion_logs("planillaId");

-- Trigger para updatedAt
CREATE OR REPLACE FUNCTION update_planilla_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW."updatedAt" = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS planillas_designacion_updated_at ON planillas_designacion;
CREATE TRIGGER planillas_designacion_updated_at
  BEFORE UPDATE ON planillas_designacion
  FOR EACH ROW EXECUTE FUNCTION update_planilla_updated_at();
