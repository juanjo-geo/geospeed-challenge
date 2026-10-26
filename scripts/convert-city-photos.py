"""Convierte las fotos de ciudades descargadas por scripts/build-city-photos.mjs a WebP.

Uso: python scripts/convert-city-photos.py <carpeta de trabajo (la misma --out del build)>
  <carpeta>/img/<slug>.jpg + <carpeta>/meta.json  →
  - public/cities/<slug>.webp (un solo tamaño: lado mayor ≤ 640 px, calidad 62; si el promedio pasa de 45 KB se
    repite todo a calidad 58 para que el conjunto quede en ~35 MB),
  - public/cities/credits.json (id, nombre, autor, archivo de Commons, licencia, enlaces) para la página de Soporte,
  - src/data/cityPhotoIds.ts (los ids del juego que tienen foto propia; las demás ciudades siguen con la del país).
Igual que las fotos de países y monumentos: las imágenes se redimensionan y convierten; las CC BY-SA se comparten
bajo la misma licencia (lo dice la página de Soporte). Los .webp de public/cities que ya no están en meta.json
(ciudad excluida o sin foto en esta corrida) se borran.
"""
import json
import os
import sys

from PIL import Image, ImageOps

MAX_PX = 640
QUALITY = 62
QUALITY_LOW = 58
AVG_LIMIT = 45 * 1024

work = sys.argv[1]
out = os.path.join('public', 'cities')
os.makedirs(out, exist_ok=True)
meta = json.load(open(os.path.join(work, 'meta.json'), encoding='utf-8'))


def load(it):
    src = os.path.join(work, 'img', it['file'])
    if not os.path.exists(src):
        print(f"  falta {src}")
        return None
    try:
        im = Image.open(src)
        im = ImageOps.exif_transpose(im).convert('RGB')
    except Exception as e:  # noqa: BLE001
        print(f"  no se pudo abrir {src}: {e}")
        return None
    im.thumbnail((MAX_PX, MAX_PX), Image.LANCZOS)
    return im


images = []
for it in meta:
    im = load(it)
    if im is not None:
        images.append((it, im))


def write_all(quality):
    total = 0
    for it, im in images:
        path = os.path.join(out, f"{it['slug']}.webp")
        im.save(path, 'WEBP', quality=quality, method=6)
        total += os.path.getsize(path)
    return total


quality = QUALITY
total = write_all(quality)
if images and total / len(images) > AVG_LIMIT:
    print(f"  promedio {total / len(images) / 1024:.1f} KB > 45 KB: se repite a calidad {QUALITY_LOW}")
    quality = QUALITY_LOW
    total = write_all(quality)

# Restos de corridas anteriores (ciudad excluida o que perdió su foto)
keep = {f"{it['slug']}.webp" for it, _ in images}
for f in os.listdir(out):
    if f.endswith('.webp') and f not in keep:
        os.remove(os.path.join(out, f))
        print(f"  borrada {f}")

credits = [{
    'id': it['id'],
    'name': it['name'],
    'author': it.get('author') or 'Wikimedia Commons',
    'source': it.get('source') or '',
    'license': it.get('license') or '',
    'licenseUrl': it.get('licenseUrl') or '',
    'url': it.get('url') or '',
} for it, _ in images]
credits.sort(key=lambda c: (c['name'].lower(), c['id']))
with open(os.path.join(out, 'credits.json'), 'w', encoding='utf-8', newline='\n') as f:
    json.dump(credits, f, ensure_ascii=False, indent=1)

ids = sorted(it['id'] for it, _ in images)
lines = ['// Generado por scripts/convert-city-photos.py. No editar a mano.',
         '',
         '/** Ciudades con foto propia en /cities/<slug>.webp (slug = id con \':\' cambiado por \'-\'); las demás usan la foto del país. */',
         'export const CITY_PHOTO_IDS: ReadonlySet<string> = new Set([']
lines += [f"  {json.dumps(i, ensure_ascii=False)}," for i in ids]
lines += [']);', '']
with open(os.path.join('src', 'data', 'cityPhotoIds.ts'), 'w', encoding='utf-8', newline='\n') as f:
    f.write('\n'.join(lines))

size = sum(os.path.getsize(os.path.join(out, f)) for f in os.listdir(out))
avg = total / len(images) / 1024 if images else 0
print(f"fotos convertidas: {len(images)} · calidad {quality} · promedio {avg:.1f} KB · {size / 1024 / 1024:.1f} MB en {out}")
