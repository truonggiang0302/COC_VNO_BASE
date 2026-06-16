-- ============================================================
-- Tạo bảng clan_members cho Slider Thành Viên Clan
-- Chạy trong SQL Editor của Supabase dashboard
-- ============================================================

-- 1. Tạo bảng clan_members
CREATE TABLE IF NOT EXISTS public.clan_members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('leader', 'co_leader', 'elder', 'member')),
  image_url     TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Bật RLS
ALTER TABLE public.clan_members ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Ai cũng đọc được
CREATE POLICY "Anyone can read clan_members"
  ON public.clan_members
  FOR SELECT
  TO authenticated
  USING (true);

-- 4. Policy: Admin có thể thêm
CREATE POLICY "Admins can insert clan_members"
  ON public.clan_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- 5. Policy: Admin có thể sửa
CREATE POLICY "Admins can update clan_members"
  ON public.clan_members
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

-- 6. Policy: Admin có thể xóa
CREATE POLICY "Admins can delete clan_members"
  ON public.clan_members
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- 7. Index
CREATE INDEX IF NOT EXISTS clan_members_order_idx ON public.clan_members (display_order);