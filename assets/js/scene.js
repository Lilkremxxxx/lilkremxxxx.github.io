// Latent field: a WebGL point cloud behind the glass that morphs between shapes as the visitor moves through the site.
// startScene() resolves to a controller, or null when WebGL is unavailable (the CSS backdrop stays visible).

const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js';

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rand) {
  const u = Math.max(rand(), 1e-6);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
}

// Each builder fills `out` (Float32Array, xyz per point) deterministically.
const SHAPES = {
  manifold(out, count, rand) {
    for (let i = 0; i < count; i += 1) {
      const t = rand() * Math.PI * 2;
      const r = 1.25 + 0.5 * Math.cos(3 * t);
      const tube = 0.07 + rand() * 0.09;
      out[i * 3] = r * Math.cos(2 * t) + gaussian(rand) * tube;
      out[i * 3 + 1] = r * Math.sin(2 * t) + gaussian(rand) * tube;
      out[i * 3 + 2] = 0.55 * Math.sin(3 * t) + gaussian(rand) * tube;
    }
  },
  clusters(out, count, rand) {
    const centers = Array.from({ length: 7 }, (_, index) => {
      const phi = Math.acos(1 - (2 * (index + 0.5)) / 7);
      const theta = Math.PI * (1 + Math.sqrt(5)) * index;
      return [1.9 * Math.sin(phi) * Math.cos(theta), 1.5 * Math.cos(phi), 1.9 * Math.sin(phi) * Math.sin(theta)];
    });
    for (let i = 0; i < count; i += 1) {
      const c = centers[i % centers.length];
      const spread = 0.22 + (i % 3) * 0.06;
      out[i * 3] = c[0] + gaussian(rand) * spread;
      out[i * 3 + 1] = c[1] + gaussian(rand) * spread;
      out[i * 3 + 2] = c[2] + gaussian(rand) * spread;
    }
  },
  network(out, count, rand) {
    const layers = [-2.3, -1.15, 0, 1.15, 2.3];
    const radii = [0.9, 1.5, 1.7, 1.5, 0.7];
    const nodes = Math.floor(count * 0.7);
    for (let i = 0; i < count; i += 1) {
      if (i < nodes) {
        const layer = i % layers.length;
        const angle = rand() * Math.PI * 2;
        const radius = Math.sqrt(rand()) * radii[layer];
        out[i * 3] = layers[layer] + gaussian(rand) * 0.04;
        out[i * 3 + 1] = Math.sin(angle) * radius;
        out[i * 3 + 2] = Math.cos(angle) * radius;
      } else {
        // Points strung between adjacent layers read as connections.
        const layer = Math.floor(rand() * (layers.length - 1));
        const a1 = rand() * Math.PI * 2;
        const a2 = rand() * Math.PI * 2;
        const r1 = Math.sqrt(rand()) * radii[layer];
        const r2 = Math.sqrt(rand()) * radii[layer + 1];
        const k = rand();
        out[i * 3] = layers[layer] + (layers[layer + 1] - layers[layer]) * k;
        out[i * 3 + 1] = Math.sin(a1) * r1 * (1 - k) + Math.sin(a2) * r2 * k;
        out[i * 3 + 2] = Math.cos(a1) * r1 * (1 - k) + Math.cos(a2) * r2 * k;
      }
    }
  },
  lattice(out, count, rand) {
    const side = Math.ceil(Math.cbrt(count));
    const step = 3.8 / side;
    for (let i = 0; i < count; i += 1) {
      const x = i % side;
      const y = Math.floor(i / side) % side;
      const z = Math.floor(i / (side * side));
      out[i * 3] = (x - side / 2) * step + gaussian(rand) * 0.02;
      out[i * 3 + 1] = (y - side / 2) * step * 0.8 + gaussian(rand) * 0.02;
      out[i * 3 + 2] = (z - side / 2) * step + gaussian(rand) * 0.02;
    }
  },
  spiral(out, count, rand) {
    const tilt = 1.05;
    for (let i = 0; i < count; i += 1) {
      const arm = i % 3;
      const r = Math.pow(rand(), 0.7) * 2.7;
      const angle = (arm * Math.PI * 2) / 3 + r * 1.7 + gaussian(rand) * 0.18;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      const y = gaussian(rand) * 0.12 * (1.2 - r / 3);
      out[i * 3] = x;
      out[i * 3 + 1] = y * Math.cos(tilt) - z * Math.sin(tilt);
      out[i * 3 + 2] = y * Math.sin(tilt) + z * Math.cos(tilt);
    }
  },
  plane(out, count, rand) {
    for (let i = 0; i < count; i += 1) {
      const x = (rand() - 0.5) * 9;
      const z = (rand() - 0.5) * 6;
      out[i * 3] = x;
      out[i * 3 + 1] = -1.3 + 0.28 * Math.sin(x * 1.1) * Math.cos(z * 1.3);
      out[i * 3 + 2] = z;
    }
  },
  haze(out, count, rand) {
    for (let i = 0; i < count; i += 1) {
      const r = 2.5 + Math.pow(rand(), 0.5) * 2.5;
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);
      out[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      out[i * 3 + 1] = r * Math.cos(phi) * 0.7;
      out[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta) - 1;
    }
  }
};

const VERTEX = /* glsl */ `
  attribute vec3 aFrom;
  attribute vec3 aTo;
  attribute float aSeed;
  attribute float aLime;
  uniform float uTime;
  uniform float uMix;
  uniform float uSize;
  uniform float uPixelRatio;
  varying float vLime;
  varying float vSeed;
  varying float vDepth;

  float easeInOut(float t) {
    return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
  }

  void main() {
    float local = easeInOut(clamp(uMix * 1.35 - aSeed * 0.35, 0.0, 1.0));
    vec3 p = mix(aFrom, aTo, local);
    p += normalize(p + 0.0001) * sin(local * 3.14159) * 0.35;
    float t = uTime * 0.25 + aSeed * 6.2831;
    p += vec3(sin(t + p.y * 1.7), cos(t * 0.9 + p.x * 1.3), sin(t * 1.1 + p.z * 1.5)) * 0.045;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float size = uSize * (aLime > 0.5 ? 1.8 : 1.0) * (0.6 + aSeed * 0.8);
    gl_PointSize = size * uPixelRatio * (6.0 / -mv.z);
    vLime = aLime;
    vSeed = aSeed;
    vDepth = -mv.z;
  }
`;

const FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  uniform vec3 uBlue;
  uniform vec3 uLime;
  varying float vLime;
  varying float vSeed;
  varying float vDepth;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float disc = smoothstep(0.5, 0.05, d);
    float twinkle = vLime > 0.5 ? 0.5 + 0.5 * sin(uTime * 2.2 + vSeed * 40.0) : 1.0;
    float depthFade = clamp(1.25 - (vDepth - 4.0) * 0.12, 0.25, 1.0);
    float alpha = disc * uIntensity * twinkle * depthFade * (vLime > 0.5 ? 1.0 : 0.62);
    gl_FragColor = vec4(mix(uBlue, uLime, vLime) * alpha, alpha);
  }
`;

export async function startScene(canvas, { reducedMotion = false } = {}) {
  let THREE;
  try {
    THREE = await import(THREE_URL);
  } catch (_error) {
    return null;
  }

  const isNarrow = window.matchMedia('(max-width: 760px)').matches;
  const lowPower = (navigator.hardwareConcurrency || 4) <= 2 || navigator.connection?.saveData === true;
  const count = lowPower ? 2200 : isNarrow ? 3200 : 6500;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'low-power' });
  } catch (_error) {
    return null;
  }
  const maxDpr = lowPower ? 1 : isNarrow ? 1.5 : 1.75;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 50);
  camera.position.set(0, 0, 7.5);

  const rand = mulberry32(20260617);
  const from = new Float32Array(count * 3);
  const to = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const lime = new Float32Array(count);
  for (let i = 0; i < count; i += 1) {
    seeds[i] = rand();
    lime[i] = rand() < 0.11 ? 1 : 0;
  }
  const shapeCache = new Map();
  const shapeBuffer = (name) => {
    if (!shapeCache.has(name)) {
      const buffer = new Float32Array(count * 3);
      SHAPES[name](buffer, count, mulberry32(name.length * 9973 + 17));
      shapeCache.set(name, buffer);
    }
    return shapeCache.get(name);
  };

  let currentShape = 'manifold';
  from.set(shapeBuffer(currentShape));
  to.set(shapeBuffer(currentShape));

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geometry.setAttribute('aFrom', new THREE.BufferAttribute(from, 3));
  geometry.setAttribute('aTo', new THREE.BufferAttribute(to, 3));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  geometry.setAttribute('aLime', new THREE.BufferAttribute(lime, 1));
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 10);

  const uniforms = {
    uTime: { value: 0 },
    uMix: { value: 1 },
    uSize: { value: isNarrow ? 5.2 : 4.6 },
    uPixelRatio: { value: renderer.getPixelRatio() },
    uIntensity: { value: 0 },
    uBlue: { value: new THREE.Color('#3992ff') },
    uLime: { value: new THREE.Color('#bdff00') }
  };

  const material = new THREE.ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const group = new THREE.Group();
  group.add(new THREE.Points(geometry, material));
  scene.add(group);

  const state = {
    transitionStart: 0,
    transitionDuration: 1700,
    transitioning: false,
    intensityTarget: 1,
    focusX: 0,
    focusXTarget: 0,
    pointer: { x: 0, y: 0 },
    tilt: { x: 0, y: 0 },
    running: false,
    lastTime: performance.now(),
    spin: 0
  };

  function resize() {
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.position.z = width < 760 ? 9.5 : 7.5;
    camera.updateProjectionMatrix();
    if (reducedMotion) renderFrame(performance.now());
  }

  function renderFrame(now) {
    const dt = Math.min(now - state.lastTime, 64) / 1000;
    state.lastTime = now;
    uniforms.uTime.value = reducedMotion ? 0 : now / 1000;

    if (state.transitioning) {
      const progress = Math.min((now - state.transitionStart) / state.transitionDuration, 1);
      uniforms.uMix.value = progress;
      if (progress >= 1) state.transitioning = false;
    }

    const ease = reducedMotion ? 1 : 1 - Math.exp(-dt * 2.2);
    uniforms.uIntensity.value += (state.intensityTarget - uniforms.uIntensity.value) * ease;
    state.focusX += (state.focusXTarget - state.focusX) * ease;
    group.position.x = state.focusX;

    if (!reducedMotion) {
      state.spin += dt * 0.05;
      state.tilt.x += (state.pointer.y * 0.18 - state.tilt.x) * (1 - Math.exp(-dt * 3));
      state.tilt.y += (state.pointer.x * 0.25 - state.tilt.y) * (1 - Math.exp(-dt * 3));
    }
    group.rotation.set(state.tilt.x + 0.15, state.spin + state.tilt.y, 0);
    renderer.render(scene, camera);
  }

  function loop(now) {
    if (!state.running) return;
    renderFrame(now);
    requestAnimationFrame(loop);
  }

  function start() {
    if (state.running || reducedMotion || document.hidden) return;
    state.running = true;
    state.lastTime = performance.now();
    requestAnimationFrame(loop);
  }

  function stop() {
    state.running = false;
  }

  function currentPositions() {
    const mix = uniforms.uMix.value;
    const out = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      let local = Math.min(Math.max(mix * 1.35 - seeds[i] * 0.35, 0), 1);
      local = local < 0.5 ? 4 * local ** 3 : 1 - (-2 * local + 2) ** 3 / 2;
      for (let k = 0; k < 3; k += 1) {
        const j = i * 3 + k;
        out[j] = from[j] + (to[j] - from[j]) * local;
      }
    }
    return out;
  }

  const onPointer = (event) => {
    state.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    state.pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
  };
  const onVisibility = () => (document.hidden ? stop() : start());
  window.addEventListener('pointermove', onPointer, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('resize', resize);

  resize();
  state.intensityTarget = 1;
  if (reducedMotion) {
    uniforms.uIntensity.value = 1;
    renderFrame(performance.now());
  } else {
    start();
  }

  return {
    setShape(name) {
      if (!SHAPES[name] || name === currentShape) return;
      currentShape = name;
      if (reducedMotion) {
        from.set(shapeBuffer(name));
        to.set(shapeBuffer(name));
        uniforms.uMix.value = 1;
      } else {
        from.set(currentPositions());
        to.set(shapeBuffer(name));
        uniforms.uMix.value = 0;
        state.transitionStart = performance.now();
        state.transitioning = true;
      }
      geometry.attributes.aFrom.needsUpdate = true;
      geometry.attributes.aTo.needsUpdate = true;
      if (reducedMotion) renderFrame(performance.now());
    },
    setFocus({ x = 0, intensity = 1 } = {}) {
      state.focusXTarget = canvas.clientWidth < 760 ? 0 : x;
      state.intensityTarget = intensity;
      if (reducedMotion) {
        state.focusX = state.focusXTarget;
        renderFrame(performance.now());
      }
    },
    destroy() {
      stop();
      window.removeEventListener('pointermove', onPointer);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', resize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    }
  };
}
