-- ═══════════════════════════════════════════════════════════
-- Security Fixes — Run in SQL Editor
-- Fixes 3 warnings from Supabase Security Linter
-- ═══════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────
-- FIX 1: Move unaccent extension out of public schema
-- ───────────────────────────────────────────────────────────
DROP EXTENSION IF EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS unaccent SCHEMA extensions;

-- Keep a public wrapper so existing queries still work without schema prefix
CREATE OR REPLACE FUNCTION public.unaccent(text)
RETURNS text
LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE
AS $$
  SELECT extensions.unaccent($1);
$$;

-- ───────────────────────────────────────────────────────────
-- FIX 2: RLS policy on mensajes_contacto — validate fields
-- Replace always-true WITH CHECK with a real validation
-- ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "insertar_publico" ON public.mensajes_contacto;

CREATE POLICY "insertar_publico"
  ON public.mensajes_contacto
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(trim(nombre))  > 0 AND
    length(trim(email))   > 0 AND
    email LIKE '%@%'      AND
    length(trim(asunto))  > 0 AND
    length(trim(mensaje)) > 0
  );

-- ───────────────────────────────────────────────────────────
-- FIX 3: Remove broad SELECT (listing) policies on public buckets
-- Public buckets serve objects via URL without needing a SELECT policy.
-- The SELECT policy only enables storage.list() which exposes all filenames.
-- ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow public read on recursos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read on imagenes-cursos" ON storage.objects;
