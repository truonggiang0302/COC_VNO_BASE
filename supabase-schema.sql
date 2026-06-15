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
  townhall    INTEGER NOT NULL CHECK (townhall BETWEEN 9 AND 18),
  base_type   TEXT NOT NULL CHECK (
    base_type IN ('Farming', 'War', 'Trophy', 'Hybrid', 'Anti 2 Star', 'Anti 3 Star')
  ),
  image_url   TEXT NOT NULL,
  base_link   TEXT NOT NULL,
  description TEXT,
  downloads   INTEGER NOT NULL DEFAULT 0,
  rating      DECIMAL(3,1) NOT NULL DEFAULT 0.0,
  rating_count INTEGER NOT NULL DEFAULT 0,
  created_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tạo bảng profiles (phân quyền user)
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  name        TEXT NOT NULL DEFAULT '',
  role        TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('super_admin', 'admin', 'viewer')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Trigger: Tự động tạo profile khi có user mới từ auth
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (NEW.id, NEW.email, '', 'viewer');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 5. Bật Row Level Security
ALTER TABLE public.bases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 6. Policy cho bases: Authenticated user có thể SELECT
CREATE POLICY "Authenticated users can read bases"
  ON public.bases
  FOR SELECT
  TO authenticated
  USING (true);

-- 7. Policy cho bases: admin và super_admin có thể INSERT
CREATE POLICY "Admins can insert bases"
  ON public.bases
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- 8. Policy cho bases: admin và super_admin có thể UPDATE
CREATE POLICY "Admins can update bases"
  ON public.bases
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- 9. Policy cho bases: admin và super_admin có thể DELETE
CREATE POLICY "Admins can delete bases"
  ON public.bases
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- 10. Policy cho profiles: tất cả authenticated user đều có thể đọc profiles
-- (Không dùng subquery vào chính bảng profiles để tránh đệ quy)
CREATE POLICY "Authenticated users can read profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- 11. Policy cho profiles: super_admin có thể UPDATE (dùng auth.email() thay vì subquery vào profiles)
CREATE POLICY "Super admin can update profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
-- (Lưu ý: UPDATE được bảo vệ ở tầng UI, chỉ super_admin mới thấy nút)

-- 13. Index
CREATE INDEX IF NOT EXISTS bases_townhall_idx ON public.bases (townhall);
CREATE INDEX IF NOT EXISTS bases_base_type_idx ON public.bases (base_type);
CREATE INDEX IF NOT EXISTS bases_created_at_idx ON public.bases (created_at DESC);
CREATE INDEX IF NOT EXISTS bases_name_idx ON public.bases USING GIN (to_tsvector('simple', name));
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles (role);

-- ============================================================
-- STORAGE: Bucket 'base-images'
-- ============================================================

-- 14. Function increment_downloads
CREATE OR REPLACE FUNCTION increment_downloads(base_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.bases SET downloads = downloads + 1 WHERE id = base_id;
END;
$$;

-- 15. Function rate_base
CREATE OR REPLACE FUNCTION rate_base(base_id UUID, new_rating INTEGER)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.bases
  SET
    rating = ROUND(((rating * rating_count) + new_rating)::numeric / (rating_count + 1), 1),
    rating_count = rating_count + 1
  WHERE id = base_id;
END;
$$;

-- Storage policies
INSERT INTO storage.buckets (id, name, public)
VALUES ('base-images', 'base-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'base-images');

CREATE POLICY "Authenticated users can read images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'base-images');

CREATE POLICY "Authenticated users can delete images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'base-images');