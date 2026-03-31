-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "nacionalidad" TEXT NOT NULL DEFAULT 'Paraguaya';
