-- Paso 1: Verificar el perfil y asignar qrToken
UPDATE "Usuario" SET
  "estadoVerificacion" = 'VERIFICADO',
  "verificadoEn" = NOW(),
  "qrToken" = COALESCE("qrToken", gen_random_uuid()::text)
WHERE email = 'gerencia.deportiva@cpb.com.py';

-- Paso 2: Agregar rol SUPER_ADMIN
INSERT INTO usuario_roles (id, "usuarioId", rol, "createdAt")
SELECT gen_random_uuid(), id, 'SUPER_ADMIN', NOW()
FROM "Usuario"
WHERE email = 'gerencia.deportiva@cpb.com.py'
ON CONFLICT ("usuarioId", rol) DO NOTHING;
