-- ═══════════════════════════════════════════════════════════
-- CUERPO TÉCNICO — Schema completo
-- ═══════════════════════════════════════════════════════════

-- Roles de cuerpo técnico
CREATE TYPE "RolCuerpoTecnico" AS ENUM (
  'ENTRENADOR_NACIONAL',
  'ENTRENADOR_EXTRANJERO',
  'ASISTENTE',
  'PREPARADOR_FISICO',
  'FISIO',
  'UTILERO'
);

-- Estado de habilitación
CREATE TYPE "EstadoHabilitacion" AS ENUM (
  'PENDIENTE',
  'HABILITADO',
  'RECHAZADO',
  'SUSPENDIDO'
);

-- Tabla principal de miembros del cuerpo técnico
CREATE TABLE "cuerpo_tecnico" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "nombre" TEXT NOT NULL,
  "apellido" TEXT NOT NULL,
  "cedula" TEXT NOT NULL UNIQUE,
  "fechaNacimiento" TIMESTAMP(3) NOT NULL,
  "telefono" TEXT NOT NULL,
  "ciudad" TEXT NOT NULL,
  "genero" TEXT NOT NULL DEFAULT 'Masculino',
  "nacionalidad" TEXT NOT NULL DEFAULT 'Paraguaya',
  "rol" "RolCuerpoTecnico" NOT NULL,
  "fotoCarnetUrl" TEXT,
  "fotoCedulaUrl" TEXT,
  "tituloEntrenadorUrl" TEXT,
  "tieneTitulo" BOOLEAN DEFAULT false,
  "razonSocial" TEXT,
  "ruc" TEXT,
  "estadoHabilitacion" "EstadoHabilitacion" NOT NULL DEFAULT 'PENDIENTE',
  "pagoVerificado" BOOLEAN DEFAULT false,
  "pagoAutoVerificado" BOOLEAN DEFAULT false,
  "comprobanteUrl" TEXT,
  "montoHabilitacion" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "verificadoPor" TEXT,
  "verificadoEn" TIMESTAMP(3),
  "motivoRechazo" TEXT,
  "qrToken" TEXT UNIQUE,
  "activo" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "cuerpo_tecnico_pkey" PRIMARY KEY ("id")
);

-- Tabla de pre-verificados (los 108 del Excel)
CREATE TABLE "ct_preverificados" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "nombre" TEXT NOT NULL,
  "nombre_normalizado" TEXT NOT NULL,
  "rol" TEXT NOT NULL,
  "datos_factura" TEXT,
  "usado" BOOLEAN DEFAULT false,
  "usuarioCtId" TEXT,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ct_preverificados_pkey" PRIMARY KEY ("id")
);

-- Habilitar RLS
ALTER TABLE cuerpo_tecnico ENABLE ROW LEVEL SECURITY;
ALTER TABLE ct_preverificados ENABLE ROW LEVEL SECURITY;

-- Índices
CREATE INDEX "ct_nombre_idx" ON "cuerpo_tecnico" ("nombre", "apellido");
CREATE INDEX "ct_estado_idx" ON "cuerpo_tecnico" ("estadoHabilitacion");
CREATE INDEX "ct_pre_norm_idx" ON "ct_preverificados" ("nombre_normalizado");
