-- ============================================================
-- CoC Base Hub – Supabase SQL Schema
-- Chạy trong SQL Editor của Supabase dashboard
-- ============================================================

-- 1. Bật extension uuid
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Tạo bảng bases
CREATE TABLE IF NOT EXISTS public.bases (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  townhall    INTEGER NOT NULL CHECK (townhall BETWEEN 9 AND 17),
  base_type   TEXT NOT NULL CHECK (
    base_type IN ('Farming', 'War', 'Trophy', 'Hybrid', 'Anti 2 Star', 'Anti 3 Star')
  ),
  image_url   TEXT NOT NULL,
  base_link   TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Bật Row Level Security
ALTER TABLE public.bases ENABLE ROW LEVEL SECURITY;

-- 4. Policy: Mọi người đều có thể đọc (SELECT)
CREATE POLICY "Public can read bases"
  ON public.bases
  FOR SELECT
  USING (true);

-- 5. Policy: Chỉ authenticated user mới INSERT
CREATE POLICY "Authenticated users can insert"
  ON public.bases
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 6. Policy: Chỉ authenticated user mới UPDATE
CREATE POLICY "Authenticated users can update"
  ON public.bases
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 7. Policy: Chỉ authenticated user mới DELETE
CREATE POLICY "Authenticated users can delete"
  ON public.bases
  FOR DELETE
  TO authenticated
  USING (true);

-- 8. Index để tìm kiếm nhanh hơn
CREATE INDEX IF NOT EXISTS bases_townhall_idx ON public.bases (townhall);
CREATE INDEX IF NOT EXISTS bases_base_type_idx ON public.bases (base_type);
CREATE INDEX IF NOT EXISTS bases_created_at_idx ON public.bases (created_at DESC);
CREATE INDEX IF NOT EXISTS bases_name_idx ON public.bases USING GIN (to_tsvector('simple', name));

-- ============================================================
-- STORAGE: Tạo bucket 'base-images' thủ công trong Supabase
-- Storage > New Bucket > Name: base-images > Public: ON
-- Sau đó thêm storage policy cho phép upload:
-- ============================================================

-- Policy cho phép authenticated user upload
INSERT INTO storage.buckets (id, name, public)
VALUES ('base-images', 'base-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'base-images');

CREATE POLICY "Public can read images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'base-images');

CREATE POLICY "Authenticated users can delete images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'base-images');
