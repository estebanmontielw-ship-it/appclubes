-- ═══════════════════════════════════════════════════════════
-- DENUNCIAS — Captura forense ampliada
-- ═══════════════════════════════════════════════════════════
-- Agrega columnas para captura forense completa en denuncias.
-- El form muestra "Confidencial" (no "Anónimo") y avisa al usuario
-- que se conservan datos técnicos para auditoría — esto cumple con
-- Ley 6534/2020 de Paraguay sobre protección de datos.

ALTER TABLE "denuncias" ADD COLUMN IF NOT EXISTS "ipReal" TEXT;
ALTER TABLE "denuncias" ADD COLUMN IF NOT EXISTS "pais" TEXT;
ALTER TABLE "denuncias" ADD COLUMN IF NOT EXISTS "region" TEXT;
ALTER TABLE "denuncias" ADD COLUMN IF NOT EXISTS "ciudad" TEXT;
ALTER TABLE "denuncias" ADD COLUMN IF NOT EXISTS "asn" TEXT;
ALTER TABLE "denuncias" ADD COLUMN IF NOT EXISTS "referer" TEXT;
ALTER TABLE "denuncias" ADD COLUMN IF NOT EXISTS "acceptLanguage" TEXT;
ALTER TABLE "denuncias" ADD COLUMN IF NOT EXISTS "browserFingerprint" TEXT;
ALTER TABLE "denuncias" ADD COLUMN IF NOT EXISTS "screenInfo" TEXT;
ALTER TABLE "denuncias" ADD COLUMN IF NOT EXISTS "timezone" TEXT;
ALTER TABLE "denuncias" ADD COLUMN IF NOT EXISTS "platform" TEXT;
ALTER TABLE "denuncias" ADD COLUMN IF NOT EXISTS "languages" TEXT;
ALTER TABLE "denuncias" ADD COLUMN IF NOT EXISTS "hardwareConcurrency" INTEGER;
ALTER TABLE "denuncias" ADD COLUMN IF NOT EXISTS "deviceMemory" INTEGER;

CREATE INDEX IF NOT EXISTS "denuncias_ipReal_idx" ON "denuncias"("ipReal");
CREATE INDEX IF NOT EXISTS "denuncias_browserFingerprint_idx" ON "denuncias"("browserFingerprint");
CREATE INDEX IF NOT EXISTS "denuncias_pais_idx" ON "denuncias"("pais");

-- Audit log de quién accedió a denuncias (para detectar leaks)
CREATE TABLE IF NOT EXISTS "denuncias_acceso_log" (
  "id"          TEXT NOT NULL,
  "denunciaId"  TEXT NOT NULL,
  "userId"      TEXT,
  "userEmail"   TEXT,
  "accion"      TEXT NOT NULL, -- 'view' | 'edit' | 'export'
  "ipAdmin"     TEXT,
  "userAgentAdmin" TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "denuncias_acceso_log_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "denuncias_acceso_log_denunciaId_idx" ON "denuncias_acceso_log"("denunciaId");
CREATE INDEX IF NOT EXISTS "denuncias_acceso_log_userId_idx" ON "denuncias_acceso_log"("userId");
CREATE INDEX IF NOT EXISTS "denuncias_acceso_log_createdAt_idx" ON "denuncias_acceso_log"("createdAt");
