"""Script test crawl ClashFox - kiem tra co extract duoc anh + link copy khong."""
import urllib.request
import re
import json

UA = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'}


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers=UA)
    return urllib.request.urlopen(req, timeout=25).read().decode('utf-8', 'ignore')


def main():
    # 1. Trang trending - lay danh sach base SSR
    html = fetch('https://clashfox.com/trending-bases')
    print('trending HTML size:', len(html))

    # Link trang chi tiết base (tương đối hoặc tuyệt đối)
    base_urls = sorted(set(re.findall(r'(?:https://clashfox\.com)?(/base/th\d+/[a-z0-9-]+)', html)))
    print('so base link trong trending:', len(base_urls))
    for u in base_urls[:5]:
        print('  ', u)

    # 2. Trang chi tiết dau tien - tim anh + link copy
    if base_urls:
        detail = fetch('https://clashfox.com' + base_urls[0])
        print('\ndetail HTML size:', len(detail))

        print('\n--- IMAGES ---')
        for u in list(dict.fromkeys(re.findall(
                r'https://[^"\'\\\s<>]+\.(?:png|jpe?g|webp)[^"\'\\\s<>]*', detail)))[:10]:
            print('  ', u)

        print('\n--- COPY LINKS (link.clashofclans.com) ---')
        for u in list(dict.fromkeys(re.findall(
                r'https://link\.clashofclans\.com[^"\'\\\s<>]*', detail)))[:5]:
            print('  ', u)

        print('\n--- Next.js RSC payload chunks:', detail.count('self.__next_f'))
        print('--- escaped copy link (\\u002F or \\/) ---')
        for u in list(dict.fromkeys(re.findall(
                r'link\.clashofclans[^"\'\\\s<>]{0,80}', detail)))[:5]:
            print('  ', u)

        # luu html de xem tay
        with open('clashfox_detail_sample.html', 'w') as f:
            f.write(detail)
        print('\nSaved: clashfox_detail_sample.html')


if __name__ == '__main__':
    main()
