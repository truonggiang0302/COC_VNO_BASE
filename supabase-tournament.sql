-- ============================================================
-- TOURNAMENT - Giai dau loai truc tiep trong clan
-- ============================================================

-- 1. Bang trang thai giai (1 dong duy nhat, id = 1)
--    status: 'open' = dang mo dang ky | 'running' = da ghep tran | 'finished' = da co ket qua
CREATE TABLE IF NOT EXISTS public.tournament_state (
    id         INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    status     TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'running', 'finished')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Bang nguoi dang ky giai
CREATE TABLE IF NOT EXISTS public.tournament_entries (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name  TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Bang tran dau (moi tran: 2 nguoi + nguoi thang)
--    Bye (mien vong dau) = tran chi co 1 nguoi, winner_id = nguoi do luon
--    is_third_place = tran tranh hang ba giua 2 nguoi thua ban ket
CREATE TABLE IF NOT EXISTS public.tournament_matches (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    round        INT NOT NULL,             -- vong thu may (1 = vong dau)
    slot         INT NOT NULL,             -- vi tri tran trong vong
    player1_id   UUID,
    player1_name TEXT NOT NULL DEFAULT '',
    player2_id   UUID,
    player2_name TEXT NOT NULL DEFAULT '',
    winner_id    UUID,                     -- NULL = chua co ket qua
    is_third_place BOOLEAN NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT tournament_matches_position_unique UNIQUE (round, slot, is_third_place)
);

-- 4. RLS (doc qua client, ghi chi qua API service_role)
ALTER TABLE public.tournament_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read tournament_state"
    ON public.tournament_state FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can read tournament_entries"
    ON public.tournament_entries FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can read tournament_matches"
    ON public.tournament_matches FOR SELECT TO authenticated USING (true);

-- 5. Index
CREATE INDEX IF NOT EXISTS idx_tournament_matches_round ON public.tournament_matches (round, slot);
