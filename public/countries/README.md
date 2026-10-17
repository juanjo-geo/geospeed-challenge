# Fotos de países (D7 · tarea de contenido C4)

Aquí van las 195 fotos del catálogo de JuanJo. El código ya las usa; mientras un archivo no exista,
simplemente no se muestra nada en su lugar.

## Archivos esperados

| Archivo | Uso | Tamaño recomendado |
|---|---|---|
| `FR.webp` | Feedback de ronda, revisión de ciudad, tarjeta del Mundial | ancho ≤ 1280 px, calidad 75, ~120 KB |
| `FR-sm.webp` | Tarjetas pequeñas (comparación por ciudad, listas) | ancho ≤ 480 px, calidad 70, ~25 KB |
| `credits.json` | Créditos visibles en la página de Soporte | — |

El nombre es el código **ISO-3166 alfa-2 en mayúsculas** (`src/lib/flags.ts` resuelve el país → ISO).

## credits.json

```json
[
  { "iso": "FR", "author": "Nombre", "source": "Unsplash", "license": "Unsplash License", "url": "https://unsplash.com/photos/…" }
]
```

## Conversión rápida (desde una carpeta con JPG/PNG nombrados por ISO)

Con ImageMagick instalado:

```bash
for f in origen/*.{jpg,jpeg,png}; do iso=$(basename "${f%.*}" | tr a-z A-Z); \
  magick "$f" -auto-orient -resize 1280x1280\> -quality 75 "public/countries/$iso.webp"; \
  magick "$f" -auto-orient -resize 480x480\> -quality 70 "public/countries/$iso-sm.webp"; done
```

Los `.webp` de esta carpeta **sí** se suben al repositorio (son parte del producto). Revisa que el total
no pase de ~30 MB para no castigar el despliegue en Vercel.
