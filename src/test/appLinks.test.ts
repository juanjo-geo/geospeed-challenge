/** App Links de Android: qué enlaces del sitio abre la app y a qué ruta interna van */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { appLinkPath, APP_LINK_PREFIXES } from '@/lib/appLinks';

const SITE = 'https://geospeed-challenge.vercel.app';

describe('appLinkPath', () => {
  it('abre en la app los enlaces de invitación', () => {
    expect(appLinkPath(`${SITE}/reto/ABC12`)).toBe('/reto/ABC12');
    expect(appLinkPath(`${SITE}/sala/123456`)).toBe('/sala/123456');
    expect(appLinkPath(`${SITE}/q/K7M2PX`)).toBe('/q/K7M2PX');
    expect(appLinkPath(`${SITE}/conquista/ABC234`)).toBe('/conquista/ABC234');
    expect(appLinkPath(`${SITE}/conquista`)).toBe('/conquista');
  });

  it('conserva los datos del diario y quita ?app=1 (solo sirve a la vista previa web)', () => {
    expect(appLinkPath(`${SITE}/d/195?r=Juanjo&h=8&t=42&g=GGYR&app=1`)).toBe('/d/195?r=Juanjo&h=8&t=42&g=GGYR');
  });

  it('deja en la web lo que no es una invitación, la pantalla para proyectar y otros dominios', () => {
    expect(appLinkPath(`${SITE}/`)).toBeNull();
    expect(appLinkPath(`${SITE}/privacy`)).toBeNull();
    expect(appLinkPath(`${SITE}/sala/123456/tv`)).toBeNull();
    expect(appLinkPath('https://otro-sitio.com/reto/ABC12')).toBeNull();
    expect(appLinkPath('no es un enlace')).toBeNull();
  });

  it('el manifiesto de Android declara las mismas rutas', () => {
    const manifest = readFileSync('android/app/src/main/AndroidManifest.xml', 'utf8');
    expect(manifest).toContain('android:autoVerify="true"');
    for (const p of APP_LINK_PREFIXES) expect(manifest).toContain(`android:pathPrefix="${p}"`);
  });

  it('assetlinks.json autoriza el paquete con la huella de la llave de Google Play', () => {
    const links = JSON.parse(readFileSync('public/.well-known/assetlinks.json', 'utf8'));
    expect(links[0].target.package_name).toBe('com.geospeed.challenge');
    expect(links[0].target.sha256_cert_fingerprints).toContain('C7:18:1F:11:59:D3:05:D9:9C:A2:1B:AD:03:6A:D5:F7:47:3D:23:50:18:E3:B3:09:92:97:55:CF:66:47:94:21');
  });
});
