-- ============================================================
-- LUCKY NUMBER CWL - Bang chon so may man hang thang
-- ============================================================

-- 1. Bang luot chon so cua thanh vien
CREATE TABLE IF NOT EXISTS public.lucky_picks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name   TEXT NOT NULL DEFAULT '',
    number      INT  NOT NULL CHECK (number BETWEEN 1 AND 99),
    month       TEXT NOT NULL, -- 'YYYY-MM' (UTC)
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Khong cho 2 nguoi trung so cung thang
    CONSTRAINT lucky_picks_month_number_unique UNIQUE (month, number)
);

-- 2. Bang trang thai (dong mo dang ky, so may man)
CREATE TABLE IF NOT EXISTS public.lucky_state (
    month          TEXT PRIMARY KEY, -- 'YYYY-MM' (UTC)
    is_closed      BOOLEAN NOT NULL DEFAULT FALSE,
    winning_number INT CHECK (winning_number IS NULL OR winning_number BETWEEN 1 AND 99),
    closed_at      TIMESTAMPTZ,
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. RLS
ALTER TABLE public.lucky_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lucky_state ENABLE ROW LEVEL SECURITY;

-- lucky_picks: moi user doc duoc danh sach (de hien bang chon so)
CREATE POLICY "Authenticated can read lucky_picks"
    ON public.lucky_picks FOR SELECT
    TO authenticated
    USING (true);

-- lucky_picks: user chi tu them so cho chinh minh (API con kiem tra <=5 so, dong/mo)
CREATE POLICY "User can insert own picks"
    ON public.lucky_picks FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- lucky_picks: user xoa so cua chinh minh; super_admin xoa duoc cua ai cung duoc (reset)
CREATE POLICY "User can delete own picks"
    ON public.lucky_picks FOR DELETE
    TO authenticated
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- lucky_state: doc trang thai
CREATE POLICY "Authenticated can read lucky_state"
    ON public.lucky_state FOR SELECT
    TO authenticated
    USING (true);

-- lucky_state: ghi (insert/update) chi qua API service_role, khong tao policy write

-- 4. Index
CREATE INDEX IF NOT EXISTS idx_lucky_picks_month ON public.lucky_picks (month);
CREATE INDEX IF NOT EXISTS idx_lucky_picks_user ON public.lucky_picks (user_id, month);

-- 5. Migration: so nguoi trung giai co cau hinh (mac dinh 2)
ALTER TABLE public.lucky_state ADD COLUMN IF NOT EXISTS winner_slots INT NOT NULL DEFAULT 2;
