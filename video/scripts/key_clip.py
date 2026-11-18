# Recorta el fondo azul liso de un clip del Explorador (generado con Higgsfield) y lo deja como secuencia de
# imágenes con transparencia para el cierre del video.
# Uso (desde video/):  python -I scripts/key_clip.py <carpeta de cuadros jpg> <public/explorer_x>
#   Los cuadros se sacan antes con:  npx remotion ffmpeg -i higgsfield/clip-a/clip.mp4 -q:v 2 <carpeta>/f%03d.jpg
# Escribe f000.webp … y meta.json (tamaño del recorte y dónde queda el personaje en la pose inicial).
import sys, site, os, glob, json
sys.path.append(site.getusersitepackages())
import numpy as np
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
files = sorted(glob.glob(os.path.join(src, 'f*.jpg')))
os.makedirs(out, exist_ok=True)
LO, HI = 10.0, 34.0      # distancia de color al fondo: por debajo es fondo, por encima es personaje
MARGIN = 20

def load(f):
    a = np.asarray(Image.open(f).convert('RGB'), dtype=np.float32)
    h, w, _ = a.shape
    corners = np.concatenate([a[:40, :40].reshape(-1, 3), a[:40, -40:].reshape(-1, 3), a[-40:, :40].reshape(-1, 3), a[-40:, -40:].reshape(-1, 3)])
    bg = np.median(corners, axis=0)
    dist = np.sqrt(((a - bg) ** 2).sum(axis=2))
    return a, bg, dist

def spread_rows(near, reach):
    """Dentro de cada fila, todo tramo seguido de 'near' que toque un pixel alcanzado queda alcanzado"""
    h, w = near.shape
    start = np.ones((h, w), dtype=bool)
    start[:, 1:] = near[:, 1:] != near[:, :-1]
    ids = np.cumsum(start.ravel()) - 1
    hit = np.bincount(ids, weights=reach.ravel(), minlength=ids[-1] + 1) > 0
    return hit[ids].reshape(h, w) & near

def connected_to_border(near):
    """Relleno desde el borde (sin scipy): alterna barridos por filas y por columnas hasta que no cambia"""
    reach = np.zeros_like(near)
    reach[0], reach[-1], reach[:, 0], reach[:, -1] = near[0], near[-1], near[:, 0], near[:, -1]
    for _ in range(200):
        nxt = spread_rows(near, reach)
        nxt = spread_rows(near.T, nxt.T).T
        if nxt.sum() == reach.sum():
            break
        reach = nxt
    return reach

# 1) Caja que contiene al personaje en todos los cuadros
boxes = []
for f in files:
    _, _, dist = load(f)
    ys, xs = np.where(dist > HI)
    boxes.append((xs.min(), ys.min(), xs.max(), ys.max()))
b = np.array(boxes)
h, w = load(files[0])[0].shape[:2]
x0, y0 = max(0, int(b[:, 0].min()) - MARGIN), max(0, int(b[:, 1].min()) - MARGIN)
x1, y1 = min(w, int(b[:, 2].max()) + MARGIN), min(h, int(b[:, 3].max()) + MARGIN)

# 2) Cada cuadro: transparencia suave en el borde; lo oscuro de adentro (pupilas) no se toca
for i, f in enumerate(files):
    a, bg, dist = load(f)
    a, dist = a[y0:y1, x0:x1], dist[y0:y1, x0:x1]
    outside = connected_to_border(dist < HI)                             # fondo conectado con el borde del recorte
    soft = np.clip((dist - LO) / (HI - LO), 0, 1)
    alpha = np.where(outside, soft, 1.0)
    # Quita el azul del fondo mezclado en el borde
    aa = np.maximum(alpha, 0.05)[..., None]
    fg = np.clip((a - (1 - aa) * bg) / aa, 0, 255)
    rgba = np.dstack([fg, alpha * 255]).astype(np.uint8)
    Image.fromarray(rgba, 'RGBA').save(os.path.join(out, f'f{i:03d}.webp'), quality=90, method=4)

fx0, fy0, fx1, fy1 = boxes[0]
meta = dict(frames=len(files), w=x1 - x0, h=y1 - y0,
            pose=dict(x=int(fx0 - x0), y=int(fy0 - y0), w=int(fx1 - fx0 + 1), h=int(fy1 - fy0 + 1)),
            feet=int(b[:, 3].max() - y0))
json.dump(meta, open(os.path.join(out, 'meta.json'), 'w'))
print(out, meta)
