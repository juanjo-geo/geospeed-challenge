# Pasa las imágenes finales a JPEG sin canal alfa (Play: JPEG o PNG de 24 bits) y las copia a store-listing/.
import os, sys
from PIL import Image

here = os.path.dirname(os.path.abspath(__file__))
repo = os.path.abspath(os.path.join(here, '..', '..'))
for lang in ('es', 'en'):
    src = os.path.join(here, 'final', lang)
    dst = os.path.join(repo, 'store-listing', 'screenshots', lang)
    os.makedirs(dst, exist_ok=True)
    for name in sorted(os.listdir(src)):
        if not name.endswith('.png'):
            continue
        im = Image.open(os.path.join(src, name)).convert('RGB')
        if name.startswith('imagen-destacada'):
            out = os.path.join(repo, 'store-listing', f'imagen-destacada-{lang}.png')
            im.save(out, 'PNG', optimize=True)
        else:
            out = os.path.join(dst, name.replace('.png', '.jpg'))
            im.save(out, 'JPEG', quality=92, optimize=True, progressive=True)
        w, h = im.size
        print(f'{os.path.relpath(out, repo)}  {w}x{h}  {os.path.getsize(out) // 1024} KB  modo {im.mode}')
