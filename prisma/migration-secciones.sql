-- Add ModuloSeccion table for section-based module content
CREATE TYPE "TipoSeccion" AS ENUM ('CONTENIDO', 'TRUCO_MEMORIA', 'CASO_PRACTICO', 'TABLA_RESUMEN', 'MINI_QUIZ', 'TARJETAS_EXPANDIBLES');

CREATE TABLE "modulo_secciones" (
    "id" TEXT NOT NULL,
    "moduloId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "tipo" "TipoSeccion" NOT NULL DEFAULT 'CONTENIDO',
    "orden" INTEGER NOT NULL,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "modulo_secciones_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "modulo_secciones" ADD CONSTRAINT "modulo_secciones_moduloId_fkey" FOREIGN KEY ("moduloId") REFERENCES "modulos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
