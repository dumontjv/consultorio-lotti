-- ============================================================
-- Migration 003: Supabase Storage Buckets e Policies
-- Consultório Lotti Fonseca - Sistema de Gestão
-- ============================================================

-- ============================================================
-- BUCKETS
-- ============================================================

INSERT INTO storage.buckets (id, name, public) VALUES
  ('documentos-pdf', 'documentos-pdf', false),
  ('fotos-perfil', 'fotos-perfil', false),
  ('logo-consultorio', 'logo-consultorio', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- POLICIES: fotos-perfil
-- Upload: o próprio usuário pode fazer upload na sua pasta
-- ============================================================

CREATE POLICY "fotos_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'fotos-perfil'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "fotos_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'fotos-perfil'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "fotos_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'fotos-perfil'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Visualização: qualquer usuário autenticado pode ver fotos de perfil
CREATE POLICY "fotos_view" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'fotos-perfil'
    AND auth.uid() IS NOT NULL
  );

-- ============================================================
-- POLICIES: documentos-pdf
-- Upload e visualização: qualquer usuário autenticado
-- ============================================================

CREATE POLICY "docs_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documentos-pdf'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "docs_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'documentos-pdf'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "docs_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documentos-pdf'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "docs_view" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documentos-pdf'
    AND auth.uid() IS NOT NULL
  );

-- ============================================================
-- POLICIES: logo-consultorio (bucket público)
-- ============================================================

CREATE POLICY "logo_view" ON storage.objects
  FOR SELECT USING (bucket_id = 'logo-consultorio');

-- Apenas admin pode fazer upload do logo
CREATE POLICY "logo_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'logo-consultorio'
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "logo_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'logo-consultorio'
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );
