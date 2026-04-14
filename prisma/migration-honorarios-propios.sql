-- ─── HONORARIOS PROPIOS (autogestión oficiales) ────────────
-- Ejecutar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS "honorarios_propios" (
  "id"            UUID          NOT NULL DEFAULT gen_random_uuid(),
  "usuarioId"     TEXT          NOT NULL,
  "fecha"         TIMESTAMP(3)  NOT NULL,
  "rama"          TEXT          NOT NULL,
  "categoria"     TEXT          NOT NULL,
  "equipoA"       TEXT          NOT NULL,
  "equipoB"       TEXT          NOT NULL,
  "rol"           TEXT          NOT NULL,
  "fase"          TEXT,
  "faseNombre"    TEXT,
  "montoSugerido" DECIMAL(12,2),
  "monto"         DECIMAL(12,2) NOT NULL,
  "estado"        TEXT          NOT NULL DEFAULT 'PENDIENTE',
  "pagadoEn"      TIMESTAMP(3),
  "notas"         TEXT,
  "createdAt"     TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "honorarios_propios_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "honorarios_propios_usuarioId_fkey"
    FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "honorarios_propios_usuarioId_idx"
  ON "honorarios_propios"("usuarioId");

CREATE INDEX IF NOT EXISTS "honorarios_propios_estado_idx"
  ON "honorarios_propios"("estado");

-- Trigger updatedAt
CREATE OR REPLACE FUNCTION update_honorarios_propios_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS honorarios_propios_updated_at ON "honorarios_propios";
CREATE TRIGGER honorarios_propios_updated_at
  BEFORE UPDATE ON "honorarios_propios"
  FOR EACH ROW EXECUTE FUNCTION update_honorarios_propios_updated_at();
