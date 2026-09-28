/**
 * Verify logic parse của src/lib/clashfox.ts (chạy bằng npx tsx).
 * Cùng regex, cùng flow — in ra kết quả cho từng base.
 */
const CLASHFOX_ORIGIN = 'https://clashfox.com'

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .trim()
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CoCVNOBase/1.0)' },
  })
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return res.text()
}

function parseDetail(html: string) {
  const titleMatch = html.match(/<h1>([^<]+)<\/h1>/)
  if (!titleMatch) return { title: null }
  const title = decodeEntities(titleMatch[1])
  const parsed = title.match(/^Town Hall\s*(\d+)\s+(.+?)\s+by\s+(.+?)(?:\s+\([a-f0-9]+\))?$/i)

  const imgMatch = html.match(
    /<img[^>]+src="(\/weekly_bases\/[^"]+\.(?:webp|png|jpe?g))"/,
  )
  const imageUrl = imgMatch ? `${CLASHFOX_ORIGIN}${decodeEntities(imgMatch[1])}` : ''

  const copyMatch = html.match(
    /href="(https:\/\/link\.clashofclans\.com\/[^"]+)"/,
  )
  return {
    title,
    townhall: parsed ? parseInt(parsed[1], 10) : 0,
    baseType: parsed ? parsed[2].trim() : 'Base',
    author: parsed ? parsed[3].trim() : 'Unknown',
    imageUrl,
    copyLink: copyMatch ? decodeEntities(copyMatch[1]) : '',
  }
}

async function main() {
  const html = await fetchText(`${CLASHFOX_ORIGIN}/trending-bases`)
  const paths = [
    ...new Set(
      (html.match(/(?:https:\/\/clashfox\.com)?(\/base\/th\d+\/[a-z0-9-]+)/g) ?? [])
        .map((m) => m.replace('https://clashfox.com', '')),
    ),
  ]
  console.log('Tổng base:', paths.length)

  for (const p of paths) {
    try {
      const d = await fetchText(`${CLASHFOX_ORIGIN}${p}`)
      const r = parseDetail(d)
      const ok = r.imageUrl && r.copyLink ? 'OK  ' : 'FAIL'
      console.log(`[${ok}] ${p}`)
      console.log('        img :', r.imageUrl || '(KHÔNG CÓ)')
      console.log('        copy:', r.copyLink || '(KHÔNG CÓ)')
    } catch (e) {
      console.log(`[FETCH-ERR] ${p}:`, (e as Error).message)
    }
  }
}

main()
