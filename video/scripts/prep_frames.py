# Prepara una grabación para el video: la pasa a 30 cuadros por segundo, encuentra los cuadros exactos en que el
# juego reacciona (toques, tarjetas, aviso del rival) y extrae a public/ solo los tramos que usa el video.
# Uso (desde video/): python -E -P scripts/prep_frames.py clasico|colombia|reto <sufijo>     (sufijo: "" o "-en")
# Imprime las anclas para src/recordings.ts.
import json, io, os, subprocess, sys, shutil
from PIL import Image, ImageChops, ImageStat

kind, suf = sys.argv[1], (sys.argv[2] if len(sys.argv) > 2 else '')
rec = f'rec/{kind}{suf}'
FF = ['npx', 'remotion', 'ffmpeg', '-y', '-loglevel', 'error']
run = lambda args: subprocess.run(' '.join(args), shell=True, check=True)

fr = json.load(io.open(f'{rec}/frames.json', encoding='utf-8'))
ev = json.load(io.open(f'{rec}/events.json', encoding='utf-8'))
with io.open(f'{rec}/list.txt', 'w', encoding='utf-8', newline='\n') as f:
    for i, t in enumerate(fr):
        d = (fr[i + 1] - t) if i + 1 < len(fr) else 0.033
        f.write(f"file 'frames/{i:05d}.jpg'\nduration {d:.4f}\n")
    f.write(f"file 'frames/{len(fr) - 1:05d}.jpg'\n")
mp4 = f'rec/{kind}{suf}.mp4'
run(FF + ['-f', 'concat', '-safe', '0', '-i', f'{rec}/list.txt', '-r', '30', '-c:v', 'libx264', '-crf', '15', '-pix_fmt', 'yuv420p', mp4])
small = f'{rec}/small'
shutil.rmtree(small, ignore_errors=True); os.makedirs(small)
run(FF + ['-i', mp4, '-vf', 'scale=426:-2', '-q:v', '5', f'{small}/%05d.jpg'])   # 00001.jpg = cuadro 0 del video
total = len(os.listdir(small))
load = lambda i: Image.open(f'{small}/{min(total, max(1, i + 1)):05d}.jpg').convert('L')
t0 = fr[0]
frame_of = lambda t: round((t - t0) * 30)   # cuadro del video para un tiempo de events.json
event = lambda ty, r=None: [e for e in ev if e['type'] == ty and (r is None or e.get('round') == r)][0]['t']

def change(after_frame, thr=2.5, box=None, back=4, ahead=45):
    """Primer cuadro que cambia respecto de uno anterior al evento (la grabación llega con retraso)"""
    base = load(after_frame - back)
    for i in range(after_frame - back + 1, after_frame + ahead):
        a, b = (base.crop(box), load(i).crop(box)) if box else (base, load(i))
        if ImageStat.Stat(ImageChops.difference(a, b)).mean[0] > thr:
            return i
    raise SystemExit(f'sin cambio después del cuadro {after_frame}')

def extract(out, a, b):
    os.makedirs(f'public/{out}', exist_ok=True)
    a = max(0, a)
    run(FF + ['-ss', f'{a / 30:.4f}', '-t', f'{(b - a) / 30:.4f}', '-i', mp4, '-start_number', str(a), '-q:v', '3', f'public/{out}/f%05d.jpg'])

anchors = {}
if kind == 'clasico':
    out = 'frames' + suf.replace('-', '_')
    q = frame_of(event('prompt', 1)) + 4
    tap1 = change(frame_of(event('tap', 1)))
    card = frame_of(event('card', 1))
    hits = [change(frame_of(event('tap', r))) for r in (5, 6, 8)]
    anchors = dict(dir=out, qStart=q, tap1=tap1, cardWide=card - 4, cardTall=card + 6, hits=hits, leave=hits[2] + 29)
    extract(out, q - 30, card + 85)
    for h in hits: extract(out, h - 30, h + 62)
elif kind == 'colombia':
    out = 'frames_co' + suf.replace('-', '_')
    tap = change(frame_of(event('tap')))
    anchors = dict(dir=out, tap=tap, lo=tap - 60, hi=tap + 45, title=[e for e in ev if e['type'] == 'prompt'][0]['title'])
    extract(out, tap - 60, tap + 46)
elif kind == 'reto':
    out = 'frames_reto' + suf.replace('-', '_')
    # El aviso del rival aparece en la franja de arriba del mapa
    pulse = change(frame_of(event('pulse')) - 6, thr=4, box=(100, 40, 330, 70), back=20, ahead=60)
    tap = change(frame_of(event('tap', 1)))
    card2 = frame_of(event('card', 2)) + 13
    anchors = dict(dir=out, raceStart=pulse - 14, pulse=pulse, tap=tap, raceEnd=pulse - 14 + 100, cardStart=card2, cardEnd=card2 + 48)
    extract(out, pulse - 14, pulse - 14 + 102)
    extract(out, card2, card2 + 50)
shutil.rmtree(small, ignore_errors=True)
print(json.dumps(anchors, ensure_ascii=False))
