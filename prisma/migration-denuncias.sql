-- ═══════════════════════════════════════════════════════════
-- CANAL DE DENUNCIAS — Integridad del Básquetbol Paraguayo
-- ═══════════════════════════════════════════════════════════

-- Tipo de situación denunciada
CREATE TYPE "TipoSituacionDenuncia" AS ENUM (
  'MANIPULACION_RESULTADO',
  'ACTIVIDAD_APUESTAS',
  'SOBORNO_INCENTIVO',
  'CONDUCTA_SOSPECHOSA',
  'OTRA'
);

-- Estado de la denuncia
CREATE TYPE "EstadoDenuncia" AS ENUM (
  'NUEVA',
  'EN_REVISION',
  'ESCALADA',
  'ARCHIVADA'
);

-- Tabla principal de denuncias
CREATE TABLE "denuncias" (
  "id" TEXT NOT NULL,
  "tipoSituacion" "TipoSituacionDenuncia" NOT NULL,
  "competencia" TEXT,
  "partidoEvento" TEXT,
  "descripcion" TEXT NOT NULL,
  "fechaOcurrencia" TEXT,
  "personasInvolucradas" TEXT,
  "tieneEvidencia" BOOLEAN NOT NULL DEFAULT false,
  "descripcionEvidencia" TEXT,
  "archivosUrls" TEXT, -- JSON array de URLs en Supabase Storage
  "modo" TEXT NOT NULL DEFAULT 'anonimo', -- 'anonimo' | 'identificado'
  "contactoNombre" TEXT,
  "contactoEmail" TEXT,
  "contactoTelefono" TEXT,
  "ipHash" TEXT, -- hash SHA-256 (con salt) — anti-spam, no revierte a IP real
  "userAgent" TEXT,
  "estado" "EstadoDenuncia" NOT NULL DEFAULT 'NUEVA',
  "notasAdmin" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "denuncias_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "denuncias_estado_idx" ON "denuncias"("estado");
CREATE INDEX "denuncias_createdAt_idx" ON "denuncias"("createdAt");
CREATE INDEX "denuncias_ipHash_idx" ON "denuncias"("ipHash");

-- ═══════════════════════════════════════════════════════════
-- Storage Bucket — denuncias-evidencia (privado)
-- ═══════════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public)
VALUES ('denuncias-evidencia', 'denuncias-evidencia', false)
ON CONFLICT (id) DO NOTHING;

-- Permitir que cualquiera (anon + authenticated) suba evidencia desde el form público.
-- La lectura queda restringida al service_role (sólo admins via API server).
CREATE POLICY "Allow public uploads to denuncias-evidencia"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'denuncias-evidencia');

CREATE POLICY "Allow service role to read denuncias-evidencia"
  ON storage.objects FOR SELECT
  TO service_role
  USING (bucket_id = 'denuncias-evidencia');
