-- ═══════════════════════════════════════════════════════════
-- Supabase Storage Buckets — Run in SQL Editor
-- ═══════════════════════════════════════════════════════════

-- 1. fotos-cedula (privado — solo admin puede leer)
INSERT INTO storage.buckets (id, name, public) VALUES ('fotos-cedula', 'fotos-cedula', false);

-- 2. fotos-carnet (privado — solo el usuario y admin)
INSERT INTO storage.buckets (id, name, public) VALUES ('fotos-carnet', 'fotos-carnet', false);

-- 3. comprobantes-pago (privado — solo admin)
INSERT INTO storage.buckets (id, name, public) VALUES ('comprobantes-pago', 'comprobantes-pago', false);

-- 4. recursos (público — recursos gratuitos)
INSERT INTO storage.buckets (id, name, public) VALUES ('recursos', 'recursos', true);

-- 5. certificados (privado — solo el usuario y admin)
INSERT INTO storage.buckets (id, name, public) VALUES ('certificados', 'certificados', false);

-- 6. imagenes-cursos (público — portadas de cursos)
INSERT INTO storage.buckets (id, name, public) VALUES ('imagenes-cursos', 'imagenes-cursos', true);

-- ═══════════════════════════════════════════════════════════
-- Storage Policies
-- ═══════════════════════════════════════════════════════════

-- fotos-cedula: authenticated users can upload, only service_role can read
CREATE POLICY "Allow authenticated uploads to fotos-cedula"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'fotos-cedula');

CREATE POLICY "Allow service role to read fotos-cedula"
  ON storage.objects FOR SELECT
  TO service_role
  USING (bucket_id = 'fotos-cedula');

-- fotos-carnet: authenticated users can upload, service_role can read
CREATE POLICY "Allow authenticated uploads to fotos-carnet"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'fotos-carnet');

CREATE POLICY "Allow service role to read fotos-carnet"
  ON storage.objects FOR SELECT
  TO service_role
  USING (bucket_id = 'fotos-carnet');

-- comprobantes-pago: authenticated users can upload, service_role can read
CREATE POLICY "Allow authenticated uploads to comprobantes-pago"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'comprobantes-pago');

CREATE POLICY "Allow service role to read comprobantes-pago"
  ON storage.objects FOR SELECT
  TO service_role
  USING (bucket_id = 'comprobantes-pago');

-- recursos: public read
CREATE POLICY "Allow public read on recursos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'recursos');

CREATE POLICY "Allow service role uploads to recursos"
  ON storage.objects FOR INSERT
  TO service_role
  WITH CHECK (bucket_id = 'recursos');

-- certificados: owner + service_role can read
CREATE POLICY "Allow authenticated uploads to certificados"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'certificados');

CREATE POLICY "Allow service role to read certificados"
  ON storage.objects FOR SELECT
  TO service_role
  USING (bucket_id = 'certificados');

-- imagenes-cursos: public read
CREATE POLICY "Allow public read on imagenes-cursos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'imagenes-cursos');

CREATE POLICY "Allow service role uploads to imagenes-cursos"
  ON storage.objects FOR INSERT
  TO service_role
  WITH CHECK (bucket_id = 'imagenes-cursos');
