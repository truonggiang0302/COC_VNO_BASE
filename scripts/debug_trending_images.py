"""Debug: kiem tra 7 base dau trong trending co the co anh khac cau truc."""
import urllib.request
import re

UA = {'User-Agent': 'Mozilla/5.0 (compatible; CoCVNOBase/1.0)'}


def fetch(url):
    req = urllib.request.Request(url, headers=UA)
    return urllib.request.urlopen(req, timeout=25).read().decode('utf-8', 'ignore')


html = fetch('https://clashfox.com/trending-bases')
paths = list(dict.fromkeys(
    m.replace('https://clashfox.com', '')
    for m in re.findall(r'(?:https://clashfox\.com)?(/base/th\d+/[a-z0-9-]+)', html)
))
print('tong so base:', len(paths))

for p in paths[:8]:
    d = fetch('https://clashfox.com' + p)
    title = re.search(r'<h1>([^<]+)</h1>', d)
    imgs = re.findall(r'<img[^>]*src="([^"]+)"[^>]*>', d)
    copy = re.search(r'href="(https://link\.clashofclans\.com/[^"]+)"', d)
    print('\n==', p)
    print('   title:', title.group(1) if title else 'N/A')
    print('   imgs:', imgs)
    print('   copy:', 'OK' if copy else 'MISSING')
