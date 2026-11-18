# Pista de música del video: los primeros 36 s del tema del juego, 16 veces más fuerte.
# El mp3 del juego está masterizado muy bajo (pico 0,04) porque el juego le sube el volumen al reproducirlo;
# sin este paso la música casi no se oye en el video.
# Uso (desde video/):  python -I scripts/make-music.py   →  public/music/track-menu.mp3 y public/music/track-video.wav
import sys, site, os, shutil, subprocess, wave
sys.path.append(site.getusersitepackages())
import numpy as np

SRC = '../public/music/track-menu.mp3'
OUT = 'public/music'
GAIN, SECONDS = 16, 36

os.makedirs(OUT, exist_ok=True)
shutil.copyfile(SRC, f'{OUT}/track-menu.mp3')
tmp = f'{OUT}/_tmp.wav'
subprocess.run(f'npx remotion ffmpeg -y -loglevel error -t {SECONDS} -i {SRC} -ac 2 -ar 44100 {tmp}', shell=True, check=True)
w = wave.open(tmp)
params = w.getparams()
a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) * GAIN
w.close()
os.remove(tmp)
clipped = int((np.abs(a) > 32767).sum())
out = wave.open(f'{OUT}/track-video.wav', 'wb')
out.setparams(params)
out.writeframes(np.clip(a, -32768, 32767).astype(np.int16).tobytes())
out.close()
print('pico', round(float(np.abs(a).max()) / 32768, 3), 'muestras recortadas', clipped)
