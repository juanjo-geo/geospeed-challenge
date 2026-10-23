"""Convierte las fotos descargadas por scripts/build-landmarks.mjs a WebP y escribe public/landmarks/credits.json.

Uso: python scripts/convert-landmarks.py <carpeta de trabajo (la misma --out del build)>
  <carpeta>/img/<slug>.jpg|png + <carpeta>/meta.json  →  public/landmarks/<slug>.webp (≤ 960 px, q74),
  public/landmarks/<slug>-sm.webp (≤ 640 px, q70) y public/landmarks/credits.json (autor, licencia, fuente).
Igual que las fotos de países (public/countries): las imágenes se redimensionan y convierten; las CC BY-SA se
comparten bajo la misma licencia (lo dice la página de Soporte).
"""
import json
import os
import sys

from PIL import Image, ImageOps

work = sys.argv[1]
out = os.path.join('public', 'landmarks')
os.makedirs(out, exist_ok=True)
meta = json.load(open(os.path.join(work, 'meta.json'), encoding='utf-8'))

credits = []
done = 0
for it in meta:
    photo = it.get('photo')
    if not photo:
        continue
    src = os.path.join(work, 'img', photo['file'])
    if not os.path.exists(src):
        continue
    try:
        im = Image.open(src)
        im = ImageOps.exif_transpose(im).convert('RGB')
    except Exception as e:  # noqa: BLE001
        print(f"  no se pudo abrir {src}: {e}")
        continue
    for suffix, max_px, q in (('', 800, 70), ('-sm', 480, 66)):
        im2 = im.copy()
        im2.thumbnail((max_px, max_px), Image.LANCZOS)
        im2.save(os.path.join(out, f"{it['id']}{suffix}.webp"), 'WEBP', quality=q, method=6)
    credits.append({
        'id': it['id'],
        'name': it['es'],
        'author': photo.get('author') or 'Wikimedia Commons',
        'source': photo.get('source'),
        'license': photo.get('license') or '',
        'licenseUrl': photo.get('licenseUrl') or '',
        'url': photo.get('url') or '',
    })
    done += 1

credits.sort(key=lambda c: c['name'].lower())
with open(os.path.join(out, 'credits.json'), 'w', encoding='utf-8') as f:
    json.dump(credits, f, ensure_ascii=False, indent=1)
total = sum(os.path.getsize(os.path.join(out, f)) for f in os.listdir(out))
print(f"fotos convertidas: {done} · {total / 1024 / 1024:.1f} MB en {out}")
