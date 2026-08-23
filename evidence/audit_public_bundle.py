from pathlib import Path
import re
from urllib.parse import urljoin

import requests

BASE_URL = 'https://hamo236.github.io/neon-guess-game-public/'
index_response = requests.get(BASE_URL, timeout=30)
index_response.raise_for_status()
asset_match = re.search(r'(?:src|href)="([^"]+assets/index-[^"]+\.js)"', index_response.text)
if not asset_match:
    raise RuntimeError('Could not resolve the deployed Vite index asset from the live HTML.')
asset_url = urljoin(BASE_URL, asset_match.group(1))
out = Path('/tmp/neon-public-index.js')
response = requests.get(asset_url, timeout=30)
response.raise_for_status()
out.write_bytes(response.content)
text = response.text
print(f'=== deployed asset ===\n{asset_url}')
print('=== deployed marker counts ===')
for token in ['GuessGrid', 'GUESS BOARD', 'Choose one card', 'GUESS CORRECT', 'Confirm that', 'targetOwnerId']:
    print(f'{token:20} {text.count(token)}')
print('=== deployed bundle size ===')
print(len(response.content))
