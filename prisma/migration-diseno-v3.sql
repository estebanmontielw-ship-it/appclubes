-- Diseño V3 — documentos estilo Canva (canvas serializado + thumbnail)
CREATE TABLE IF NOT EXISTS "diseno_v3_documents" (
  "id"           TEXT NOT NULL,
  "ownerId"      TEXT NOT NULL,
  "nombre"       TEXT NOT NULL,
  "liga"         TEXT NOT NULL DEFAULT 'lnb',
  "template"     TEXT NOT NULL DEFAULT 'blank',
  "format"       TEXT NOT NULL DEFAULT 'feed',
  "canvasJson"   JSONB NOT NULL,
  "thumbnailUrl" TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL,
  CONSTRAINT "diseno_v3_documents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "diseno_v3_documents_ownerId_updatedAt_idx"
  ON "diseno_v3_documents" ("ownerId", "updatedAt" DESC);

CREATE INDEX IF NOT EXISTS "diseno_v3_documents_liga_idx"
  ON "diseno_v3_documents" ("liga");
