import re
import requests

base = 'https://hamo236.github.io/neon-guess-game-public/'
origin = 'https://hamo236.github.io'
html = requests.get(base, timeout=30).text

def resolve(item):
    return (origin + item) if item.startswith('/') else (base + item)

urls = sorted(set(resolve(item) for item in re.findall(r'(?:src|href)="([^"]+\.js)"', html)))
index_url = urls[0]
index = requests.get(index_url, timeout=30).text
for item in re.findall(r'([A-Za-z0-9_./-]+\.js)', index):
    urls.append(resolve(item))
urls = sorted(set(urls))
markers = ['GuessGrid', 'GUESS BOARD', 'Choose one card', 'ROUND TARGET GUIDE', 'Target Guide', 'Guess Card', 'GUESS CORRECT', 'Confirm that', 'targetOwnerId']
print('chunks', len(urls))
for url in urls:
    try:
        response = requests.get(url, timeout=30)
        print('\n', url, response.status_code, len(response.content))
        if response.ok:
            for marker in markers:
                count = response.text.count(marker)
                if count:
                    print(' ', marker, count)
    except Exception as exc:
        print(' ERROR', exc)
