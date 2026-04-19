-- Agregar SUPER_ADMIN + verificar carnet para gerencia.deportiva@cpb.com.py
-- Ejecutar en Supabase: SQL Editor → pegar y correr

DO $$
DECLARE
  v_user_id TEXT;
BEGIN
  -- Buscar el usuario
  SELECT id INTO v_user_id
  FROM usuarios
  WHERE email = 'gerencia.deportiva@cpb.com.py';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado. Registrate primero en cpb.com.py/registro';
  END IF;

  -- Agregar rol SUPER_ADMIN (si no lo tiene ya)
  INSERT INTO usuario_roles (id, "usuarioId", rol, "createdAt")
  VALUES (gen_random_uuid(), v_user_id, 'SUPER_ADMIN', NOW())
  ON CONFLICT ("usuarioId", rol) DO NOTHING;

  -- Verificar el perfil para que pueda ver el carnet
  UPDATE usuarios SET
    "estadoVerificacion" = 'VERIFICADO',
    "verificadoEn" = NOW(),
    "qrToken" = COALESCE("qrToken", gen_random_uuid()::text)
  WHERE id = v_user_id;

  RAISE NOTICE 'Listo! Usuario % es ahora SUPER_ADMIN y está VERIFICADO', v_user_id;
END $$;
