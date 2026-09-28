"""Test HEAD request den anh clashfox - co bi chan/405 khong?"""
import urllib.request

UA = 'Mozilla/5.0 (compatible; CoCVNOBase/1.0)'
url_ok = 'https://clashfox.com/weekly_bases/th18/th18_20260922_101845_8a6a8b22_thumb.webp'
url_dead = 'https://clashfox.com/weekly_bases/th18/th18_20260922_144644_dce9ca7f_thumb.webp'

for u in [url_ok, url_dead]:
    # HEAD
    try:
        req = urllib.request.Request(u, headers={'User-Agent': UA}, method='HEAD')
        r = urllib.request.urlopen(req, timeout=20)
        print('HEAD', r.status, '->', u[-40:])
    except Exception as e:
        print('HEAD', e, '->', u[-40:])
    # GET Range (chỉ lấy vài byte đầu)
    try:
        req = urllib.request.Request(u, headers={'User-Agent': UA, 'Range': 'bytes=0-99'})
        r = urllib.request.urlopen(req, timeout=20)
        print('GET-Range', r.status, len(r.read()), 'bytes ->', u[-40:])
    except Exception as e:
        print('GET-Range', e, '->', u[-40:])
