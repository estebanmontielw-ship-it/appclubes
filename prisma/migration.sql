-- CreateEnum
CREATE TYPE "TipoRol" AS ENUM ('SUPER_ADMIN', 'INSTRUCTOR', 'DESIGNADOR', 'ARBITRO', 'MESA', 'ESTADISTICO');

-- CreateEnum
CREATE TYPE "EstadoVerificacion" AS ENUM ('PENDIENTE', 'VERIFICADO', 'RECHAZADO', 'SUSPENDIDO');

-- CreateEnum
CREATE TYPE "DisciplinaCurso" AS ENUM ('ARBITROS', 'MESA', 'ESTADISTICOS');

-- CreateEnum
CREATE TYPE "NivelCurso" AS ENUM ('A_INICIAL', 'B_ACTUALIZACION', 'C_AVANZADO');

-- CreateEnum
CREATE TYPE "EstadoCurso" AS ENUM ('BORRADOR', 'ACTIVO', 'INACTIVO');

-- CreateEnum
CREATE TYPE "TipoPregunta" AS ENUM ('OPCION_MULTIPLE', 'TEXTO_ABIERTO');

-- CreateEnum
CREATE TYPE "EstadoInscripcion" AS ENUM ('PENDIENTE_PAGO', 'ACTIVO', 'COMPLETADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('PENDIENTE_REVISION', 'CONFIRMADO', 'RECHAZADO');

-- CreateEnum
CREATE TYPE "TipoRecurso" AS ENUM ('PDF', 'VIDEO', 'LINK', 'IMAGEN');

-- CreateEnum
CREATE TYPE "CategoriaRecurso" AS ENUM ('REGLAMENTO', 'MANUAL', 'VIDEO_INSTRUCTIVO', 'FORMULARIO', 'OTRO');

-- CreateEnum
CREATE TYPE "TipoNotificacion" AS ENUM ('CARNET_VERIFICADO', 'CARNET_RECHAZADO', 'PAGO_CONFIRMADO', 'PAGO_RECHAZADO', 'CURSO_HABILITADO', 'EXAMEN_DISPONIBLE', 'MODULO_COMPLETADO', 'CERTIFICADO_EMITIDO', 'DESIGNACION_ASIGNADA', 'DESIGNACION_CANCELADA', 'PARTIDO_MODIFICADO', 'HONORARIO_PAGADO', 'MENSAJE_ADMIN', 'SISTEMA');

-- CreateEnum
CREATE TYPE "CategoriaPartido" AS ENUM ('PRIMERA_DIVISION', 'SEGUNDA_DIVISION', 'FEMENINO', 'U21', 'U18', 'U16', 'U14', 'ESPECIAL');

-- CreateEnum
CREATE TYPE "EstadoPartido" AS ENUM ('PROGRAMADO', 'EN_CURSO', 'FINALIZADO', 'SUSPENDIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "RolDesignacion" AS ENUM ('ARBITRO_PRINCIPAL', 'ARBITRO_ASISTENTE_1', 'ARBITRO_ASISTENTE_2', 'MESA_ANOTADOR', 'MESA_CRONOMETRADOR', 'MESA_OPERADOR_24S', 'MESA_ASISTENTE', 'ESTADISTICO');

-- CreateEnum
CREATE TYPE "EstadoDesignacion" AS ENUM ('PENDIENTE', 'CONFIRMADA', 'RECHAZADA', 'REEMPLAZADA');

-- CreateEnum
CREATE TYPE "EstadoHonorario" AS ENUM ('PENDIENTE', 'PAGADO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "cedula" TEXT NOT NULL,
    "fechaNacimiento" TIMESTAMP(3) NOT NULL,
    "telefono" TEXT NOT NULL,
    "ciudad" TEXT NOT NULL,
    "fotoCedulaUrl" TEXT,
    "fotoCarnetUrl" TEXT,
    "estadoVerificacion" "EstadoVerificacion" NOT NULL DEFAULT 'PENDIENTE',
    "verificadoPor" TEXT,
    "verificadoEn" TIMESTAMP(3),
    "motivoRechazo" TEXT,
    "qrToken" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario_roles" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "rol" "TipoRol" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cursos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "disciplina" "DisciplinaCurso" NOT NULL,
    "nivel" "NivelCurso" NOT NULL,
    "precio" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "esGratuito" BOOLEAN NOT NULL DEFAULT false,
    "estado" "EstadoCurso" NOT NULL DEFAULT 'BORRADOR',
    "imagen" TEXT,
    "duracionTotal" INTEGER,
    "instructorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cursos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modulos" (
    "id" TEXT NOT NULL,
    "cursoId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "contenido" TEXT,
    "videoUrl" TEXT,
    "archivoUrl" TEXT,
    "orden" INTEGER NOT NULL,
    "duracion" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "modulos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "examenes" (
    "id" TEXT NOT NULL,
    "moduloId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "instrucciones" TEXT,
    "notaMinima" INTEGER NOT NULL DEFAULT 70,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "examenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preguntas" (
    "id" TEXT NOT NULL,
    "examenId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "tipo" "TipoPregunta" NOT NULL,
    "orden" INTEGER NOT NULL,
    "puntaje" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "preguntas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opciones" (
    "id" TEXT NOT NULL,
    "preguntaId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "esCorrecta" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL,

    CONSTRAINT "opciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inscripciones" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "cursoId" TEXT NOT NULL,
    "estado" "EstadoInscripcion" NOT NULL DEFAULT 'PENDIENTE_PAGO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inscripciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos" (
    "id" TEXT NOT NULL,
    "inscripcionId" TEXT NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "comprobanteUrl" TEXT NOT NULL,
    "referencia" TEXT,
    "notas" TEXT,
    "estado" "EstadoPago" NOT NULL DEFAULT 'PENDIENTE_REVISION',
    "revisadoPor" TEXT,
    "revisadoEn" TIMESTAMP(3),
    "motivoRechazo" TEXT,
    "notasAdmin" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pagos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progreso_modulos" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "moduloId" TEXT NOT NULL,
    "completado" BOOLEAN NOT NULL DEFAULT false,
    "iniciadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completadoEn" TIMESTAMP(3),

    CONSTRAINT "progreso_modulos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "respuestas_examenes" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "examenId" TEXT NOT NULL,
    "preguntaId" TEXT NOT NULL,
    "opcionId" TEXT,
    "respuestaTexto" TEXT,
    "esCorrecta" BOOLEAN,
    "puntajeObtenido" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "respuestas_examenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificados" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "cursoId" TEXT NOT NULL,
    "pdfUrl" TEXT,
    "qrToken" TEXT NOT NULL,
    "notaFinal" INTEGER,
    "emitidoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "certificados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recursos" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" "TipoRecurso" NOT NULL,
    "categoria" "CategoriaRecurso" NOT NULL DEFAULT 'OTRO',
    "url" TEXT NOT NULL,
    "esPublico" BOOLEAN NOT NULL DEFAULT true,
    "disciplina" "DisciplinaCurso",
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creadoPor" TEXT,

    CONSTRAINT "recursos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificaciones" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tipo" "TipoNotificacion" NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "link" TEXT,
    "leido" BOOLEAN NOT NULL DEFAULT false,
    "leidoEn" TIMESTAMP(3),
    "enviadoPor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partidos" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "hora" TEXT NOT NULL,
    "cancha" TEXT NOT NULL,
    "ciudad" TEXT NOT NULL,
    "categoria" "CategoriaPartido" NOT NULL,
    "equipoLocal" TEXT NOT NULL,
    "equipoVisit" TEXT NOT NULL,
    "descripcion" TEXT,
    "estado" "EstadoPartido" NOT NULL DEFAULT 'PROGRAMADO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creadoPor" TEXT,

    CONSTRAINT "partidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "designaciones" (
    "id" TEXT NOT NULL,
    "partidoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "rol" "RolDesignacion" NOT NULL,
    "estado" "EstadoDesignacion" NOT NULL DEFAULT 'PENDIENTE',
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "asignadoPor" TEXT,

    CONSTRAINT "designaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aranceles" (
    "id" TEXT NOT NULL,
    "categoria" "CategoriaPartido" NOT NULL,
    "rol" "RolDesignacion" NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aranceles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "honorarios" (
    "id" TEXT NOT NULL,
    "designacionId" TEXT NOT NULL,
    "partidoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "estado" "EstadoHonorario" NOT NULL DEFAULT 'PENDIENTE',
    "pagadoEn" TIMESTAMP(3),
    "comprobante" TEXT,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "honorarios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_cedula_key" ON "usuarios"("cedula");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_qrToken_key" ON "usuarios"("qrToken");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_roles_usuarioId_rol_key" ON "usuario_roles"("usuarioId", "rol");

-- CreateIndex
CREATE UNIQUE INDEX "examenes_moduloId_key" ON "examenes"("moduloId");

-- CreateIndex
CREATE UNIQUE INDEX "inscripciones_usuarioId_cursoId_key" ON "inscripciones"("usuarioId", "cursoId");

-- CreateIndex
CREATE UNIQUE INDEX "progreso_modulos_usuarioId_moduloId_key" ON "progreso_modulos"("usuarioId", "moduloId");

-- CreateIndex
CREATE UNIQUE INDEX "certificados_qrToken_key" ON "certificados"("qrToken");

-- CreateIndex
CREATE UNIQUE INDEX "certificados_usuarioId_cursoId_key" ON "certificados"("usuarioId", "cursoId");

-- CreateIndex
CREATE UNIQUE INDEX "aranceles_categoria_rol_key" ON "aranceles"("categoria", "rol");

-- CreateIndex
CREATE UNIQUE INDEX "honorarios_designacionId_key" ON "honorarios"("designacionId");

-- AddForeignKey
ALTER TABLE "usuario_roles" ADD CONSTRAINT "usuario_roles_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cursos" ADD CONSTRAINT "cursos_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modulos" ADD CONSTRAINT "modulos_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "cursos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "examenes" ADD CONSTRAINT "examenes_moduloId_fkey" FOREIGN KEY ("moduloId") REFERENCES "modulos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preguntas" ADD CONSTRAINT "preguntas_examenId_fkey" FOREIGN KEY ("examenId") REFERENCES "examenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opciones" ADD CONSTRAINT "opciones_preguntaId_fkey" FOREIGN KEY ("preguntaId") REFERENCES "preguntas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscripciones" ADD CONSTRAINT "inscripciones_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscripciones" ADD CONSTRAINT "inscripciones_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "cursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_inscripcionId_fkey" FOREIGN KEY ("inscripcionId") REFERENCES "inscripciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progreso_modulos" ADD CONSTRAINT "progreso_modulos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progreso_modulos" ADD CONSTRAINT "progreso_modulos_moduloId_fkey" FOREIGN KEY ("moduloId") REFERENCES "modulos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "respuestas_examenes" ADD CONSTRAINT "respuestas_examenes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "respuestas_examenes" ADD CONSTRAINT "respuestas_examenes_examenId_fkey" FOREIGN KEY ("examenId") REFERENCES "examenes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "respuestas_examenes" ADD CONSTRAINT "respuestas_examenes_preguntaId_fkey" FOREIGN KEY ("preguntaId") REFERENCES "preguntas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificados" ADD CONSTRAINT "certificados_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificados" ADD CONSTRAINT "certificados_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "cursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_enviadoPor_fkey" FOREIGN KEY ("enviadoPor") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "designaciones" ADD CONSTRAINT "designaciones_partidoId_fkey" FOREIGN KEY ("partidoId") REFERENCES "partidos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "designaciones" ADD CONSTRAINT "designaciones_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "honorarios" ADD CONSTRAINT "honorarios_designacionId_fkey" FOREIGN KEY ("designacionId") REFERENCES "designaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "honorarios" ADD CONSTRAINT "honorarios_partidoId_fkey" FOREIGN KEY ("partidoId") REFERENCES "partidos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "honorarios" ADD CONSTRAINT "honorarios_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

