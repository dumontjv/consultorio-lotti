-- ============================================================
-- Migration 003: Supabase Storage Buckets e Policies
-- Pronto — Sistema de Gestão para Clínicas
-- ============================================================

-- ============================================================
-- BUCKETS
-- ============================================================

INSERT INTO storage.buckets (id, name, public) VALUES
  ('documentos-pdf', 'documentos-pdf', false),
  ('fotos-perfil', 'fotos-perfil', false),
  ('logo-consultorio', 'logo-consultorio', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- POLICIES: fotos-perfil
-- Upload: o próprio usuário pode fazer upload na sua pasta
-- ============================================================

DROP POLICY IF EXISTS "fotos_upload" ON storage.objects;
CREATE POLICY "fotos_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'fotos-perfil'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "fotos_update" ON storage.objects;
CREATE POLICY "fotos_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'fotos-perfil'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "fotos_delete" ON storage.objects;
CREATE POLICY "fotos_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'fotos-perfil'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Visualização: qualquer usuário autenticado pode ver fotos de perfil
DROP POLICY IF EXISTS "fotos_view" ON storage.objects;
CREATE POLICY "fotos_view" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'fotos-perfil'
    AND auth.uid() IS NOT NULL
  );

-- ============================================================
-- POLICIES: documentos-pdf
-- Upload e visualização: qualquer usuário autenticado
-- ============================================================

DROP POLICY IF EXISTS "docs_upload" ON storage.objects;
CREATE POLICY "docs_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documentos-pdf'
    AND auth.uid() IS NOT NULL
  );

DROP POLICY IF EXISTS "docs_update" ON storage.objects;
CREATE POLICY "docs_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'documentos-pdf'
    AND auth.uid() IS NOT NULL
  );

DROP POLICY IF EXISTS "docs_delete" ON storage.objects;
CREATE POLICY "docs_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documentos-pdf'
    AND auth.uid() IS NOT NULL
  );

DROP POLICY IF EXISTS "docs_view" ON storage.objects;
CREATE POLICY "docs_view" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documentos-pdf'
    AND auth.uid() IS NOT NULL
  );

-- ============================================================
-- POLICIES: logo-consultorio (bucket público)
-- ============================================================

DROP POLICY IF EXISTS "logo_view" ON storage.objects;
CREATE POLICY "logo_view" ON storage.objects
  FOR SELECT USING (bucket_id = 'logo-consultorio');

-- Apenas admin pode fazer upload do logo
DROP POLICY IF EXISTS "logo_upload" ON storage.objects;
CREATE POLICY "logo_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'logo-consultorio'
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "logo_update" ON storage.objects;
CREATE POLICY "logo_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'logo-consultorio'
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );
