/**
 * Piezas 3D de la escena: globo con el mapa del juego, halo, estrellas, pin del Explorador con onda,
 * y el teléfono con capturas reales de la partida. Todo se mueve por número de cuadro (sin relojes).
 */
import { useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { staticFile } from 'remotion';
import { BRAND, MAP_CONTINENT_COLORS, countries, getColorGroup, latLonToVec, seeded } from './brand';

// ── Textura del globo (equirectangular, mismos colores por continente que el mapa del juego) ──
export function hashName(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function makeGlobeTexture(): THREE.CanvasTexture {
  const W = 4096, H = 2048;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d')!;
  const ocean = g.createLinearGradient(0, 0, 0, H);
  ocean.addColorStop(0, '#0F2E55');
  ocean.addColorStop(0.5, '#0C2548');
  ocean.addColorStop(1, '#0F2E55');
  g.fillStyle = ocean;
  g.fillRect(0, 0, W, H);
  // Retícula suave cada 15°
  g.strokeStyle = 'rgba(141,205,245,0.10)';
  g.lineWidth = 2;
  for (let lon = -180; lon <= 180; lon += 15) {
    const x = ((lon + 180) / 360) * W;
    g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke();
  }
  for (let lat = -75; lat <= 75; lat += 15) {
    const y = ((90 - lat) / 180) * H;
    g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke();
  }
  const px = (lon: number) => ((lon + 180) / 360) * W;
  const py = (lat: number) => ((90 - lat) / 180) * H;
  g.lineJoin = 'round';
  for (const country of countries) {
    const pal = MAP_CONTINENT_COLORS[getColorGroup(country.name)] ?? MAP_CONTINENT_COLORS.Ice;
    g.fillStyle = pal[hashName(country.name) % pal.length];
    g.beginPath();
    for (const ring of country.polygons) {
      ring.forEach(([lon, lat], i) => (i ? g.lineTo(px(lon), py(lat)) : g.moveTo(px(lon), py(lat))));
      g.closePath();
    }
    g.fill('evenodd');
    g.strokeStyle = 'rgba(255,255,255,0.85)';
    g.lineWidth = 2.4;
    g.stroke();
  }
  g.fillStyle = MAP_CONTINENT_COLORS.Ice[0];
  g.fillRect(0, py(-84), W, H - py(-84));
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

const fresnelVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;
const haloFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uPower;
  uniform float uStrength;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    // Cara interior de una esfera mayor: d = 0 en el borde de afuera, máximo donde asoma tras el globo
    float d = clamp(-dot(vNormal, vView) / 0.62, 0.0, 1.0);
    float f = pow(d, uPower) * uStrength;
    gl_FragColor = vec4(uColor * f, f);
  }
`;
const rimFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uStrength;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float f = pow(1.0 - clamp(dot(vNormal, vView), 0.0, 1.0), 3.0) * uStrength;
    gl_FragColor = vec4(uColor * f, f);
  }
`;

export const GLOBE_R = 2.2;

export function Globe({ rotY, rotX, children }: { rotY: number; rotX: number; children?: React.ReactNode }) {
  const tex = useMemo(makeGlobeTexture, []);
  const halo = useMemo(
    () => new THREE.ShaderMaterial({
      vertexShader: fresnelVertex, fragmentShader: haloFragment, side: THREE.BackSide,
      blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
      uniforms: { uColor: { value: new THREE.Color(BRAND.turquoise) }, uPower: { value: 2.4 }, uStrength: { value: 0.85 } },
    }), []);
  const rim = useMemo(
    () => new THREE.ShaderMaterial({
      vertexShader: fresnelVertex, fragmentShader: rimFragment, blending: THREE.AdditiveBlending,
      transparent: true, depthWrite: false,
      uniforms: { uColor: { value: new THREE.Color('#7FF5EA') }, uStrength: { value: 0.9 } },
    }), []);
  return (
    <group>
      <mesh material={halo} scale={1.28}>
        <sphereGeometry args={[GLOBE_R, 96, 96]} />
      </mesh>
      <group rotation={[rotX, 0, 0]}>
        <group rotation={[0, rotY, 0]}>
          <mesh>
            <sphereGeometry args={[GLOBE_R, 160, 160]} />
            <meshStandardMaterial map={tex} emissiveMap={tex} emissive="#ffffff" emissiveIntensity={0.42} roughness={0.75} metalness={0} />
          </mesh>
          {children}
        </group>
      </group>
      <mesh material={rim} scale={1.004}>
        <sphereGeometry args={[GLOBE_R, 96, 96]} />
      </mesh>
    </group>
  );
}

/**
 * Pin clavado en (lat, lon), siempre de pie en pantalla (no acostado sobre la esfera: visto de frente sería una bola).
 * rotX / rotY = giro del globo, para deshacerlo. drop = altura que le falta para tocar el suelo.
 */
export function SurfacePin({ lat, lon, drop, rotX, rotY, scale = 1 }: { lat: number; lon: number; drop: number; rotX: number; rotY: number; scale?: number }) {
  const n = useMemo(() => new THREE.Vector3(...latLonToVec(lat, lon)).normalize(), [lat, lon]);
  const globeQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(rotX, 0, 0)).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rotY, 0)));
  const inv = globeQ.clone().invert();
  // De pie, un poco inclinado hacia la cámara para que se lea el volumen
  const q = inv.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0.38, 0, 0)));
  const pos = n.clone().multiplyScalar(GLOBE_R * 1.002).add(new THREE.Vector3(0, drop, 0).applyQuaternion(q));
  const mat = { color: BRAND.yellow, emissive: BRAND.yellowDeep, emissiveIntensity: 0.5, roughness: 0.3, metalness: 0.15 };
  return (
    <group position={pos} quaternion={q} scale={scale}>
      <mesh position={[0, 0.2, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.15, 0.4, 48]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      <mesh position={[0, 0.44, 0]}>
        <sphereGeometry args={[0.19, 48, 48]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      <mesh position={[0, 0.45, 0.15]}>
        <sphereGeometry args={[0.075, 32, 32]} />
        <meshStandardMaterial color={BRAND.turquoise} emissive={BRAND.turquoise} emissiveIntensity={1.3} roughness={0.15} />
      </mesh>
    </group>
  );
}

/** Onda turquesa sobre la superficie (t de 0 a 1) */
export function Shockwave({ lat, lon, t }: { lat: number; lon: number; t: number }) {
  const n = useMemo(() => new THREE.Vector3(...latLonToVec(lat, lon)).normalize(), [lat, lon]);
  const q = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), n), [n]);
  if (t <= 0 || t >= 1) return null;
  const s = 0.05 + t * 0.9;
  return (
    <mesh position={n.clone().multiplyScalar(GLOBE_R * 1.004)} quaternion={q} scale={s}>
      <ringGeometry args={[0.9, 1, 128]} />
      <meshBasicMaterial color={BRAND.turquoise} transparent opacity={(1 - t) * 0.95} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
    </mesh>
  );
}

export function Stars({ spin }: { spin: number }) {
  const geo = useMemo(() => {
    const rnd = seeded(7);
    const pts: number[] = [];
    for (let i = 0; i < 1800; i++) {
      const u = rnd() * 2 - 1, a = rnd() * Math.PI * 2, r = 30 + rnd() * 30;
      const s = Math.sqrt(1 - u * u);
      const z = -Math.abs(u * r) - 6;
      pts.push(Math.cos(a) * s * r, Math.sin(a) * s * r * 0.6, z);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);
  return (
    <points geometry={geo} rotation={[0, 0, spin]}>
      <pointsMaterial color="#cfe8ff" size={0.09} sizeAttenuation transparent opacity={0.75} depthWrite={false} />
    </points>
  );
}

// ── Teléfono con capturas reales ──
/** Capturas del juego como texturas. useLoader suspende y ThreeCanvas espera a que carguen antes de sacar el cuadro. */
export function useTextures(paths: string[]) {
  const list = useLoader(THREE.TextureLoader, paths.map((p) => staticFile(p)));
  list.forEach((t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; });
  return list;
}

function makeSheenTexture() {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 512;
  const g = c.getContext('2d')!;
  // Franja de luz inclinada y fina
  g.translate(512, 256);
  g.rotate(-0.42);
  const grd = g.createLinearGradient(-90, 0, 90, 0);
  grd.addColorStop(0, 'rgba(255,255,255,0)');
  grd.addColorStop(0.5, 'rgba(255,255,255,0.3)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(-90, -600, 180, 1200);
  return new THREE.CanvasTexture(c);
}

/** Cuerpo del teléfono: rectángulo de esquinas redondas con canto biselado, centrado; la cara de adelante queda en z = front */
function makePhoneBody(w: number, h: number, r: number, depth: number, bevel: number) {
  const x = -w / 2, y = -h / 2;
  const sh = new THREE.Shape();
  sh.moveTo(x + r, y);
  sh.lineTo(x + w - r, y); sh.quadraticCurveTo(x + w, y, x + w, y + r);
  sh.lineTo(x + w, y + h - r); sh.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  sh.lineTo(x + r, y + h); sh.quadraticCurveTo(x, y + h, x, y + h - r);
  sh.lineTo(x, y + r); sh.quadraticCurveTo(x, y, x + r, y);
  const geo = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 6, curveSegments: 24 });
  geo.translate(0, 0, -depth / 2);
  return { geo, front: depth / 2 + bevel };
}

export const PHONE_W = 4.6;
const SCREEN_W = 4.38;

/**
 * Teléfono 3D. texture = lo que se ve en la pantalla (captura o cuadro de la partida grabada);
 * aspect = ancho / alto de esa imagen.
 */
export function Phone({ texture, aspect = 1576 / 725, screenW = SCREEN_W, sheen, flash, ...props }: { texture: THREE.Texture; aspect?: number; screenW?: number; sheen: number; flash: number } & JSX.IntrinsicElements['group']) {
  const screenH = screenW / aspect;
  const body = useMemo(() => makePhoneBody(screenW + 0.16, screenH + 0.16, Math.min(0.3, screenW * 0.12), 0.13, 0.03), [screenW, screenH]);
  const sheenTex = useMemo(makeSheenTexture, []);
  sheenTex.offset.x = 0.75 - sheen * 1.5;
  const z = body.front;
  return (
    <group {...props}>
      {/* Canto turquesa: la luz de marca recorta la silueta */}
      <mesh geometry={body.geo} scale={[1.012, 1.028, 0.8]}>
        <meshBasicMaterial color={BRAND.turquoise} transparent opacity={0.4} toneMapped={false} />
      </mesh>
      <mesh geometry={body.geo}>
        <meshStandardMaterial color="#0A111C" roughness={0.3} metalness={0.55} />
      </mesh>
      <mesh position={[0, 0, z + 0.004]} renderOrder={2}>
        <planeGeometry args={[screenW, screenH]} />
        <meshBasicMaterial map={texture} transparent toneMapped={false} />
      </mesh>
      {sheen > 0 && sheen < 1 && (
        <mesh position={[0, 0, z + 0.007]} renderOrder={3}>
          <planeGeometry args={[screenW, screenH]} />
          <meshBasicMaterial map={sheenTex} transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
      )}
      {flash > 0 && (
        <mesh position={[0, 0, z + 0.01]} renderOrder={4}>
          <planeGeometry args={[screenW, screenH]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={flash} depthWrite={false} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}

/** Teléfono de la escena de prueba: dos capturas fijas */
export function StillPhone({ screen, ...props }: { screen: number; sheen: number; flash: number } & JSX.IntrinsicElements['group']) {
  const textures = useTextures(['screens/game-01.png', 'screens/game-02.png']);
  return <Phone texture={textures[screen]} {...props} />;
}

// ── Partida grabada: un cuadro del video por cuadro del render ──
const recent: string[] = [];
/** Cuadro n de la partida grabada (public/frames/f00000.jpg, 30 por segundo). Solo quedan en memoria los últimos. */
export function useGameFrame(n: number, dir = 'frames'): THREE.Texture {
  const url = staticFile(`${dir}/f${String(Math.round(n)).padStart(5, '0')}.jpg`);
  const tex = useLoader(THREE.TextureLoader, url);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  if (recent[recent.length - 1] !== url) {
    recent.push(url);
    while (recent.length > 4) {
      const old = recent.shift()!;
      if (!recent.includes(old)) useLoader.clear(THREE.TextureLoader, old);
    }
  }
  return tex;
}

/** Teléfono con la partida grabada */
export function GamePhone({ videoFrame, dir, ...props }: { videoFrame: number; dir?: string; sheen: number; flash: number } & JSX.IntrinsicElements['group']) {
  const tex = useGameFrame(videoFrame, dir);
  return <Phone texture={tex} aspect={1704 / 786} {...props} />;
}

/** Chispas que suben (combo en llamas). t = cuadros desde que empiezan */
export function Embers({ t, width, height, count = 70 }: { t: number; width: number; height: number; count?: number }) {
  const base = useMemo(() => {
    const rnd = seeded(41);
    return Array.from({ length: count }, () => ({ x: rnd() - 0.5, phase: rnd(), speed: 0.5 + rnd() * 0.9, sway: rnd() * Math.PI * 2, size: rnd() }));
  }, [count]);
  const geo = useMemo(() => new THREE.BufferGeometry(), []);
  const pts = new Float32Array(count * 3);
  base.forEach((b, i) => {
    const life = ((t / 30) * b.speed + b.phase) % 1;
    pts[i * 3] = b.x * width + Math.sin(b.sway + t / 9) * 0.12;
    pts[i * 3 + 1] = -height / 2 + life * height * 1.25;
    pts[i * 3 + 2] = 0.3 + b.size * 0.4;
  });
  geo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
  if (t < 0) return null;
  return (
    <points geometry={geo}>
      <pointsMaterial color="#FFB347" size={0.09} sizeAttenuation transparent opacity={Math.min(1, t / 8) * 0.95} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
    </points>
  );
}
