# CoC Base Hub 🏰

Ứng dụng quản lý và chia sẻ Base Layout Clash of Clans, xây dựng bằng **Next.js 15** + **Supabase** + **Tailwind CSS**.

---

## Tính năng

- 🗺️ **Trang công khai** – Xem, tìm kiếm, lọc base theo TH và loại. Copy link 1 click.
- 🔐 **Admin dashboard** – Thêm, sửa, xóa base với upload ảnh lên Supabase Storage.
- 🎨 **CoC dark theme** – Vàng gold, stone dark, army green, phong cách Clash of Clans.
- ⚡ **Server Components** – Bộ lọc qua URL search params, SEO-friendly.
- 🛡️ **Row Level Security** – Chỉ admin đã đăng nhập mới có thể thay đổi dữ liệu.

---

## Cấu trúc dự án

```
src/
├── app/
│   ├── layout.tsx          # Root layout + Toaster
│   ├── page.tsx            # Trang chủ (Server Component)
│   ├── globals.css         # CoC theme styles
│   └── admin/
│       ├── login/
│       │   ├── page.tsx    # Trang đăng nhập
│       │   └── LoginForm.tsx
│       └── dashboard/
│           ├── page.tsx         # Server component + auth check
│           ├── DashboardClient.tsx
│           ├── BaseFormModal.tsx
│           └── DeleteConfirmModal.tsx
├── components/
│   ├── Header.tsx
│   ├── FilterBar.tsx        # Client component với debounce
│   ├── BaseGrid.tsx         # Server component
│   ├── BaseCard.tsx         # Client component
│   └── BaseGridSkeleton.tsx
├── types/index.ts
├── lib/cn.ts
├── middleware.ts            # Auth protection
└── utils/supabase/
    ├── client.ts            # Browser Supabase client
    └── server.ts            # Server Supabase client
```

---

## Bước 1 – Tạo Supabase Project

1. Đăng ký tại [supabase.com](https://supabase.com) và tạo project mới.
2. Vào **SQL Editor** → **New query** → Dán toàn bộ nội dung file `supabase-schema.sql` → **Run**.
3. Vào **Storage** → Kiểm tra bucket `base-images` đã được tạo và có trạng thái **Public**.

### Tạo Admin User

1. Vào **Authentication** → **Users** → **Add user**.
2. Điền email và mật khẩu → **Create user**.
3. Dùng email/password này để đăng nhập vào `/admin/login`.

---

## Bước 2 – Cài đặt local

```bash
# Clone dự án
git clone <your-repo-url>
cd coc-base-manager

# Cài dependencies
npm install

# Tạo file env
cp .env.local.example .env.local
```

Điền giá trị vào `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` → Lấy từ **Project Settings > API > Project URL**
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Lấy từ **Project Settings > API > anon public**

```bash
# Chạy dev server
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000).

---

## Bước 3 – Deploy lên Vercel

### Cách 1: Vercel CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

### Cách 2: Vercel Dashboard

1. Push code lên GitHub.
2. Vào [vercel.com](https://vercel.com) → **New Project** → Import repo.
3. Thêm **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click **Deploy**.

### Sau khi deploy

Thêm domain Vercel vào **Supabase**:
- **Authentication > URL Configuration > Site URL** → nhập domain Vercel
- **Redirect URLs** → thêm `https://your-domain.vercel.app/**`

---

## Cấu hình Supabase Storage (nếu bucket chưa tạo tự động)

Nếu lệnh SQL tạo bucket thất bại (do quyền), tạo thủ công:

1. **Storage** → **New bucket**
2. Name: `base-images`
3. Public bucket: **ON**
4. Save

Sau đó chạy lại phần Storage policies trong `supabase-schema.sql`.

---

## Môi trường & Biến

| Biến | Mô tả |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL Supabase project của bạn |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon/Public key của Supabase |

> ⚠️ Không bao giờ để `service_role` key vào frontend!

---

## Tech Stack

- **Next.js 15** – App Router, Server Components, Streaming
- **TypeScript** – Strict mode
- **Tailwind CSS** – Custom CoC theme
- **Supabase** – Auth, PostgreSQL, Storage
- **Lucide React** – Icons
- **React Hot Toast** – Notifications
