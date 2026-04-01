CREATE TABLE "conversaciones_bot" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "usuarioId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL DEFAULT 'Nueva conversación',
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "conversaciones_bot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "mensajes_bot" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "conversacionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "archivos" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "mensajes_bot_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "mensajes_bot_conversacionId_fkey" FOREIGN KEY ("conversacionId") REFERENCES "conversaciones_bot"("id") ON DELETE CASCADE
);

ALTER TABLE "conversaciones_bot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "mensajes_bot" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON "conversaciones_bot" FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON "mensajes_bot" FOR ALL USING (auth.role() = 'service_role');
