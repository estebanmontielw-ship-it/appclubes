-- Tabla de configuración persistente del diseñador de flyers por liga.
-- Una fila por liga (lnb, lnbf, u22m, u22f). Guarda logo, sponsors,
-- colores y tipografía para que la config quede sincronizada entre
-- dispositivos (antes vivía solo en localStorage).

CREATE TABLE IF NOT EXISTS diseno_configs (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  liga            TEXT NOT NULL UNIQUE,
  "logoUrl"       TEXT,
  "logoScale"     INTEGER NOT NULL DEFAULT 100,
  theme           TEXT NOT NULL DEFAULT 'masc1',
  "bgImageUrl"    TEXT,
  "bgFit"         TEXT NOT NULL DEFAULT 'cover',
  "textureUrl"    TEXT,
  "textureOpacity" INTEGER NOT NULL DEFAULT 12,
  sponsors        JSONB NOT NULL DEFAULT '[]'::jsonb,
  "sponsorScales" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "sponsorBg"     TEXT NOT NULL DEFAULT 'dark',
  "titleSize"     INTEGER NOT NULL DEFAULT 100,
  "subtitleSize"  INTEGER NOT NULL DEFAULT 100,
  "titleWeight"   INTEGER NOT NULL DEFAULT 900,
  "cardStyle"     TEXT NOT NULL DEFAULT 'glass',
  "textColor"     TEXT NOT NULL DEFAULT 'light',
  layout          TEXT NOT NULL DEFAULT 'default',
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "diseno_configs_liga_key" ON diseno_configs(liga);
