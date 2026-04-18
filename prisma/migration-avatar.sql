-- Migration: add avatarUrl to Usuario for fan profile photo
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;
