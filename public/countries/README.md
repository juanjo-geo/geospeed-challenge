# Fotos de países (D7 · tarea de contenido C4)

Las 195 fotos aprobadas por JuanJo (zip `GeoSpeed_195_Paises_Aprobados.zip`, entrega del 17 oct 2026,
todas de Wikimedia Commons). El código ya las usa; si un país no tiene archivo, simplemente no se muestra foto.

## Archivos

| Archivo | Uso | Formato |
|---|---|---|
| `CO.webp` | Repaso de ciudad ("Para recordarla") | ≤ 960 px, WebP calidad 74 |
| `CO-sm.webp` | Tarjeta de respuesta, Mundial, comparación de retos | ≤ 640 px, WebP calidad 70 |
| `credits.json` | Créditos en la página de Soporte (obligatorios: 170 fotos son CC BY / CC BY-SA) | — |

El nombre es el código **ISO-3166 alfa-2 en mayúsculas** (`src/lib/flags.ts` resuelve el país → ISO).
Total ≈ 25 MB (originales: 62 MB, no se suben).

## credits.json

```json
[
  { "iso": "CO", "country": "Colombia", "author": "…", "source": "Wikimedia Commons",
    "license": "CC BY-SA 4.0", "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0", "url": "https://commons.wikimedia.org/wiki/File:…" }
]
```

## Regenerar desde el zip

Se generan con un script de Python + Pillow que lee `paises.json` del zip: para cada país abre
`imagenes/<iso>/<id>.jpg`, corrige la orientación EXIF, reduce a 960 px y 640 px (lado mayor) y guarda
WebP (calidad 74 y 70, method 6). `credits.json` sale de los campos `autor`, `licencia`, `url_licencia`
y `pagina_fuente`. Si cambia una foto, vuelve a correr la conversión completa y revisa que el total
no pase de ~30 MB.

Cobertura actual: 160 de los 162 países del catálogo de ciudades (faltan Guayana Francesa y Taiwán, que no
están entre los 195) y todos los países del mapa salvo territorios (Groenlandia, Kosovo, Puerto Rico,
Sahara Occidental, Antártida…). 23 fotos de microestados aún no se usan (no tienen ciudades en el juego).
