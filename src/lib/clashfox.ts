/**
 * Fetch + parse dữ liệu Trending Bases từ ClashFox (server-side).
 * Dữ liệu SSR sẵn trong HTML nên không cần headless browser.
 * Cache 1 giờ (revalidate) để không spam site gốc.
 */

const CLASHFOX_ORIGIN = 'https://clashfox.com'
const REVALIDATE = 3600 // 1 giờ

export interface TrendingBase {
  /** Đường dẫn trang gốc trên ClashFox, vd /base/th18/base-pro-656fb6c9fd1b1d73 */
  detailPath: string
  title: string
  townhall: number
  /** Loại base: War Base, Farming Base... */
  baseType: string
  author: string
  imageUrl: string
  copyLink: string
  classification?: string
}

/** Giải mã HTML entities cơ bản */
function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .trim()
}

/** Lấy danh sách đường dẫn base trong trang trending */
async function fetchTrendingPaths(): Promise<string[]> {
  const res = await fetch(`${CLASHFOX_ORIGIN}/trending-bases`, {
    next: { revalidate: REVALIDATE },
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CoCVNOBase/1.0)' },
  })
  if (!res.ok) {
    throw new Error(`ClashFox trending responded ${res.status}`)
  }
  const html = await res.text()
  const paths = [
    ...new Set(
      (html.match(/(?:https:\/\/clashfox\.com)?(\/base\/th\d+\/[a-z0-9-]+)/g) ?? [])
        .map((m) => m.replace('https://clashfox.com', '')),
    ),
  ]
  return paths
}

/** Fetch + parse một trang chi tiết base */
async function fetchBaseDetail(detailPath: string): Promise<TrendingBase | null> {
  try {
    const res = await fetch(`${CLASHFOX_ORIGIN}${detailPath}`, {
      next: { revalidate: REVALIDATE },
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CoCVNOBase/1.0)' },
    })
    if (!res.ok) return null
    const html = await res.text()

    // Title: "Town Hall 18 War Base by Base Pro (071b15) – Copy Link | ClashFox"
    const titleMatch = html.match(/<h1>([^<]+)<\/h1>/)
    if (!titleMatch) return null
    const title = decodeEntities(titleMatch[1])

    // Parse thành phần từ title
    const parsed = title.match(/^Town Hall\s*(\d+)\s+(.+?)\s+by\s+(.+?)(?:\s+\([a-f0-9]+\))?$/i)
    const townhall = parsed ? parseInt(parsed[1], 10) : 0
    const baseType = parsed ? parsed[2].trim() : 'Base'
    const author = parsed ? parsed[3].trim() : 'Unknown'

    // Ảnh preview (bỏ og-cover.jpg)
    const imgMatch = html.match(
      /<img[^>]+src="(\/weekly_bases\/[^"]+\.(?:webp|png|jpe?g))"/,
    )
    const imageUrl = imgMatch ? `${CLASHFOX_ORIGIN}${decodeEntities(imgMatch[1])}` : ''

    // Link copy Clash of Clans
    const copyMatch = html.match(
      /href="(https:\/\/link\.clashofclans\.com\/[^"]+)"/,
    )
    const copyLink = copyMatch ? decodeEntities(copyMatch[1]) : ''

    // Classification (anti3, s2w...)
    const classMatch = html.match(/Classification<\/[^>]+>\s*<[^>]+>([^<]+)</)
    const classification = classMatch ? decodeEntities(classMatch[1]) : undefined

    if (!imageUrl || !copyLink) return null

    return { detailPath, title, townhall, baseType, author, imageUrl, copyLink, classification }
  } catch {
    return null
  }
}

/**
 * Lấy toàn bộ trending bases. Lỗi fetch trang list → throw để UI hiển thị fallback.
 * Lỗi từng base chi tiết → bỏ qua base đó.
 */
export async function getTrendingBases(): Promise<TrendingBase[]> {
  const paths = await fetchTrendingPaths()
  const details = await Promise.all(paths.map((p) => fetchBaseDetail(p)))
  return details.filter((b): b is TrendingBase => b !== null)
}
