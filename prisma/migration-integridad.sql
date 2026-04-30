-- ═══════════════════════════════════════════════════════════
-- ANÁLISIS DE INTEGRIDAD — Detección de patrones de manipulación
-- ═══════════════════════════════════════════════════════════
-- Tablas de soporte para el módulo "Análisis de Manipulación" del
-- panel admin (debajo del "Canal de Denuncias"). Reutiliza la API
-- de Genius Sports / FibaLiveStats que ya provee el sistema y
-- almacena permanentemente el resultado del análisis post-partido
-- para evitar reprocesar y minimizar consumo de quota.
-- ═══════════════════════════════════════════════════════════

-- Severidad de un patrón detectado
CREATE TYPE "IntegridadSeveridad" AS ENUM (
  'BAJO',
  'MEDIO',
  'ALTO',
  'CRITICO'
);

-- Tier de seguimiento de un jugador
CREATE TYPE "IntegridadTier" AS ENUM (
  'TIER_1',
  'TIER_2',
  'TIER_3'
);

-- ─── Lista de jugadores bajo seguimiento ─────────────────────
CREATE TABLE "integridad_jugadores_tier" (
  "id"               TEXT NOT NULL,
  "nombre"           TEXT NOT NULL,
  "nombreNorm"       TEXT NOT NULL,         -- nombre normalizado (lowercase, sin tildes) para matching
  "club"             TEXT NOT NULL,         -- nombre del club
  "clubSigla"        TEXT,                  -- sigla (ALF, CAM, CIU, ...)
  "numero"           INTEGER,
  "tier"             "IntegridadTier" NOT NULL DEFAULT 'TIER_2',
  "notas"            TEXT,                  -- contexto / razón del seguimiento
  "activo"           BOOLEAN NOT NULL DEFAULT true,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL,
  "creadoPor"        TEXT,                  -- usuarioId del super admin que lo creó

  CONSTRAINT "integridad_jugadores_tier_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "integridad_jugadores_tier_nombreNorm_idx" ON "integridad_jugadores_tier"("nombreNorm");
CREATE INDEX "integridad_jugadores_tier_club_idx" ON "integridad_jugadores_tier"("club");
CREATE INDEX "integridad_jugadores_tier_tier_idx" ON "integridad_jugadores_tier"("tier");

-- Evita duplicados del mismo jugador en el mismo club
CREATE UNIQUE INDEX "integridad_jugadores_tier_unique_jugador" ON "integridad_jugadores_tier"("nombreNorm", "club");

-- ─── Análisis de un partido (1 fila por matchId) ─────────────
CREATE TABLE "integridad_analisis" (
  "id"                TEXT NOT NULL,
  "matchId"           TEXT NOT NULL UNIQUE,
  "competicionId"     TEXT,
  "competicionName"   TEXT,

  -- Snapshot del partido al momento del análisis
  "fecha"             TIMESTAMP(3),
  "equipoLocal"       TEXT NOT NULL,
  "equipoLocalSigla"  TEXT,
  "equipoVisit"       TEXT NOT NULL,
  "equipoVisitSigla"  TEXT,
  "scoreLocal"        INTEGER,
  "scoreVisit"        INTEGER,
  "totalPuntos"       INTEGER,
  "periodScores"      JSONB,                -- [{ home: N, away: N }] por cuarto

  -- Resumen
  "esCritico"         BOOLEAN NOT NULL DEFAULT false,  -- 2 clubes monitoreados se enfrentan
  "totalPatrones"     INTEGER NOT NULL DEFAULT 0,
  "severidadMax"      "IntegridadSeveridad",
  "rawData"           JSONB,                -- payload boxscore completo (cache permanente)

  -- Estado del partido al analizarlo (FINALIZADO o EN_CURSO)
  "estadoPartido"     TEXT,

  "generadoEn"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "actualizadoEn"     TIMESTAMP(3) NOT NULL,
  "generadoPor"       TEXT,                 -- usuarioId

  CONSTRAINT "integridad_analisis_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "integridad_analisis_matchId_idx" ON "integridad_analisis"("matchId");
CREATE INDEX "integridad_analisis_fecha_idx" ON "integridad_analisis"("fecha");
CREATE INDEX "integridad_analisis_esCritico_idx" ON "integridad_analisis"("esCritico");
CREATE INDEX "integridad_analisis_severidadMax_idx" ON "integridad_analisis"("severidadMax");

-- ─── Patrones detectados en un análisis ──────────────────────
CREATE TABLE "integridad_patrones" (
  "id"                TEXT NOT NULL,
  "analisisId"        TEXT NOT NULL,
  "tipo"              TEXT NOT NULL,         -- 'q4_collapse' | 'total_anomalo_bajo' | ...
  "tipoLabel"         TEXT NOT NULL,         -- etiqueta legible
  "severidad"         "IntegridadSeveridad" NOT NULL,
  "descripcion"       TEXT NOT NULL,
  "datos"             JSONB,                 -- detalles estructurados del patrón
  "jugadoresInvolucrados" JSONB,             -- [{ nombre, club, tier }, ...]
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "integridad_patrones_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "integridad_patrones_analisisId_fkey"
    FOREIGN KEY ("analisisId") REFERENCES "integridad_analisis"("id") ON DELETE CASCADE
);

CREATE INDEX "integridad_patrones_analisisId_idx" ON "integridad_patrones"("analisisId");
CREATE INDEX "integridad_patrones_tipo_idx" ON "integridad_patrones"("tipo");
CREATE INDEX "integridad_patrones_severidad_idx" ON "integridad_patrones"("severidad");

-- ─── Auditoría de llamadas al API de Genius (opcional) ───────
-- Permite verificar consumo de quota y trazabilidad de cada análisis.
CREATE TABLE "integridad_audit_log" (
  "id"          TEXT NOT NULL,
  "matchId"     TEXT,
  "accion"      TEXT NOT NULL,              -- 'analizar' | 'ver' | 'editar_jugador' | 'borrar_jugador' | ...
  "detalles"    JSONB,
  "userId"      TEXT,
  "userEmail"   TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "integridad_audit_log_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "integridad_audit_log_matchId_idx" ON "integridad_audit_log"("matchId");
CREATE INDEX "integridad_audit_log_userId_idx" ON "integridad_audit_log"("userId");
CREATE INDEX "integridad_audit_log_createdAt_idx" ON "integridad_audit_log"("createdAt");
