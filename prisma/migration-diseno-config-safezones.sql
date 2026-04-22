-- Agrega columna safeZones a diseno_configs para que cada liga pueda
-- guardar si el usuario activó el "Optimizar para Stories" (padding
-- de safe zones de Instagram).

ALTER TABLE diseno_configs
  ADD COLUMN IF NOT EXISTS "safeZones" BOOLEAN NOT NULL DEFAULT false;
