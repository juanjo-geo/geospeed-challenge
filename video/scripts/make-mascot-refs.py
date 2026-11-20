# Cuadros de inicio 9:16 para la biblioteca de clips del Explorador (Higgsfield, Seedance 2.0).
# Pone cada pose de mascot/emociones sobre el azul marino de la marca, centrada y con espacio arriba para saltos.
# Uso (desde video/):  python -E -P scripts/make-mascot-refs.py   →  higgsfield/biblioteca/refs/<pose>.png
import sys, site, os, glob
sys.path.append(site.getusersitepackages())
import numpy as np
from PIL import Image

SRC = '../mascot/emociones'
OUT = 'higgsfield/biblioteca/refs'
W, H = 1080, 1920
BG = (7, 20, 38)          # #071426, el mismo fondo de los clips anteriores (key_clip.py lo recorta)
FIG_W = 700               # ancho del personaje
FEET = 0.80               # línea del piso (fracción del alto)

os.makedirs(OUT, exist_ok=True)
for f in sorted(glob.glob(os.path.join(SRC, '*.png'))):
    im = Image.open(f).convert('RGBA')
    a = np.asarray(im)[..., 3]
    ys, xs = np.where(a > 128)
    im = im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    s = FIG_W / im.width
    if im.height * s > H * 0.62:
        s = H * 0.62 / im.height
    im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    canvas = Image.new('RGBA', (W, H), BG + (255,))
    canvas.alpha_composite(im, ((W - im.width) // 2, round(H * FEET) - im.height))
    name = os.path.splitext(os.path.basename(f))[0]
    canvas.convert('RGB').save(os.path.join(OUT, name + '.png'))
    print(name, im.size)
