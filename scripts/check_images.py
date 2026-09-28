"""Test anh voi day du headers browser + http2."""
import subprocess

HEADERS = (
    '-H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36" '
    '-H "Accept: image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8" '
    '-H "Accept-Language: en-US,en;q=0.9,vi;q=0.8" '
    '-H "Referer: https://clashfox.com/" '
    '-H "Sec-Fetch-Dest: image" -H "Sec-Fetch-Mode: no-cors" -H "Sec-Fetch-Site: same-origin" '
    '-H "sec-ch-ua: \\"Chromium\\";v=\\"131\\", \\"Not_A Brand\\";v=\\"24\\"" '
    '-H "sec-ch-ua-mobile: ?0" -H "sec-ch-ua-platform: \\"Windows\\""'
)

urls = [
    # 6 anh "bi loi" (7 base dau)
    'https://clashfox.com/weekly_bases/th18/th18_20260922_144644_dce9ca7f_thumb.webp',
    'https://clashfox.com/weekly_bases/th18/th18_20260922_144645_cfb1671b_thumb.webp',
    # 1 anh nhom "13 base OK"
    'https://clashfox.com/weekly_bases/th18/th18_20260922_101843_6fa7bf19_thumb.webp',
    'https://clashfox.com/weekly_bases/th18/th18_20260922_101845_8a6a8b22_thumb.webp',
]

for u in urls:
    r = subprocess.run(
        f'curl -s --http2 {HEADERS} -o /dev/null -w "%{{http_code}} %{{size_download}}" "{u}"',
        shell=True, capture_output=True, text=True,
    )
    print(r.stdout, ' <-', u.rsplit('/', 1)[-1])
