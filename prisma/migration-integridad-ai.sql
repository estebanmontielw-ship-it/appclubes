-- ═══════════════════════════════════════════════════════════
-- INTEGRIDAD — Análisis experto generado por IA (Claude)
-- ═══════════════════════════════════════════════════════════

ALTER TABLE "integridad_analisis"
  ADD COLUMN IF NOT EXISTS "aiSummary" TEXT;

ALTER TABLE "integridad_analisis"
  ADD COLUMN IF NOT EXISTS "aiSummaryGeneradoEn" TIMESTAMP(3);

ALTER TABLE "integridad_analisis"
  ADD COLUMN IF NOT EXISTS "aiSummaryModel" TEXT;
