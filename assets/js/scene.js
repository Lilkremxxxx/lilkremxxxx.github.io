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
  },
  // Boot state: everything collapsed into a dense core before the manifold unfolds.
  core(out, count, rand) {
    for (let i = 0; i < count; i += 1) {
      out[i * 3] = gaussian(rand) * 0.08;
      out[i * 3 + 1] = gaussian(rand) * 0.08;
      out[i * 3 + 2] = gaussian(rand) * 0.08;
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
  uniform float uScale;
  uniform float uPixelRatio;
  uniform float uWaveFront;
  uniform float uWaveAmp;
  uniform vec2 uMouse;
  uniform float uMouseAmp;
  uniform float uAspect;
  uniform vec3 uRipple;
  varying float vLime;
  varying float vSeed;
  varying float vDepth;
  varying float vGlow;

  float easeInOut(float t) {
    return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
  }

  void main() {
    // Per-point stagger: points leave in waves, then travel on an outward arc.
    float local = easeInOut(clamp(uMix * 1.35 - aSeed * 0.35, 0.0, 1.0));
    vec3 p = mix(aFrom, aTo, local) * uScale;
    p += normalize(p + 0.0001) * sin(local * 3.14159) * 0.45;
    float t = uTime * 0.25 + aSeed * 6.2831;
    p += vec3(sin(t + p.y * 1.7), cos(t * 0.9 + p.x * 1.3), sin(t * 1.1 + p.z * 1.5)) * 0.05;

    // Forward pass: a signal front sweeping along x lights and lifts the points it crosses.
    float wave = uWaveAmp * exp(-pow((p.x - uWaveFront) * 2.2, 2.0));
    p += normalize(p + 0.0001) * wave * 0.14;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vec4 clip = projectionMatrix * mv;
    vec2 ndc = clip.xy / clip.w;

    // Pointer lens + click ripple, measured in screen space so they feel attached to the cursor.
    vec2 dv = (ndc - uMouse) * vec2(uAspect, 1.0);
    float mouseF = uMouseAmp * smoothstep(0.45, 0.0, length(dv));
    vec2 dir = normalize(dv + 0.0001);
    float ripple = 0.0;
    if (uRipple.z >= 0.0) {
      vec2 rv = (ndc - uRipple.xy) * vec2(uAspect, 1.0);
      ripple = exp(-pow((length(rv) - uRipple.z * 1.7) * 8.0, 2.0)) * max(0.0, 1.0 - uRipple.z / 1.4);
      if (ripple > mouseF) dir = normalize(rv + 0.0001);
    }
    mv.xy += dir * (mouseF * 0.6 + ripple * 0.4) * (-mv.z) * 0.12;
    gl_Position = projectionMatrix * mv;

    float glow = clamp(wave + mouseF * 0.9 + ripple, 0.0, 1.5);
    float size = uSize * (aLime > 0.5 ? 1.8 : 1.0) * (0.6 + aSeed * 0.8) * (1.0 + glow * 0.9);
    gl_PointSize = size * uPixelRatio * (6.0 / -mv.z);
    vLime = aLime;
    vSeed = aSeed;
    vDepth = -mv.z;
    vGlow = glow;
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
  varying float vGlow;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    // Bright core + soft halo reads as bokeh once the glass blurs it.
    float disc = smoothstep(0.5, 0.0, d) * 0.55 + smoothstep(0.2, 0.0, d) * 0.65;
    float twinkle = vLime > 0.5 ? 0.55 + 0.45 * sin(uTime * 2.2 + vSeed * 40.0) : 1.0;
    float depthFade = clamp(1.3 - (vDepth - 4.0) * 0.1, 0.3, 1.0);
    vec3 color = mix(uBlue, uLime, clamp(vLime + vGlow * 0.85, 0.0, 1.0));
    color = mix(color, vec3(1.0), vGlow * 0.25);
    float alpha = disc * uIntensity * twinkle * depthFade * (vLime > 0.5 ? 1.0 : 0.8) * (1.0 + vGlow * 0.8);
    gl_FragColor = vec4(color * alpha, alpha);
  }
`;

const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;

export async function startScene(canvas, { reducedMotion = false } = {}) {
  let THREE;
  try {
    THREE = await import(THREE_URL);
  } catch (_error) {
    return null;
  }

  const isNarrow = window.matchMedia('(max-width: 760px)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const lowPower = (navigator.hardwareConcurrency || 4) <= 2 || navigator.connection?.saveData === true;
  const count = lowPower ? 2600 : isNarrow ? 4200 : 8000;

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
    lime[i] = rand() < 0.12 ? 1 : 0;
  }
  const shapeCache = new Map();
  const shapeBuffer = (name) => {
    if (!shapeCache.has(name)) {
      const buffer = new Float32Array(count * 3);
      SHAPES[name](buffer, count, mulberry32(name.length * 9973 + name.charCodeAt(0) * 31 + 17));
      shapeCache.set(name, buffer);
    }
    return shapeCache.get(name);
  };

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geometry.setAttribute('aFrom', new THREE.BufferAttribute(from, 3));
  geometry.setAttribute('aTo', new THREE.BufferAttribute(to, 3));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  geometry.setAttribute('aLime', new THREE.BufferAttribute(lime, 1));
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 12);

  const uniforms = {
    uTime: { value: 0 },
    uMix: { value: 1 },
    uSize: { value: isNarrow ? 5.6 : 5.2 },
    uScale: { value: isNarrow ? 1.0 : 1.25 },
    uPixelRatio: { value: renderer.getPixelRatio() },
    uIntensity: { value: 0 },
    uWaveFront: { value: -99 },
    uWaveAmp: { value: 0 },
    uMouse: { value: new THREE.Vector2(9, 9) },
    uMouseAmp: { value: 0 },
    uAspect: { value: 1 },
    uRipple: { value: new THREE.Vector3(0, 0, -1) },
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
    mode: 'tween',
    pair: ['core', 'manifold'],
    shape: 'manifold',
    tweenStart: 0,
    tweenDuration: 1700,
    tweening: false,
    mixTarget: 1,
    intensityTarget: 1,
    focusX: 0,
    focusXTarget: 0,
    pointer: { x: 0, y: 0, lastMove: -1e9 },
    tilt: { x: 0, y: 0 },
    waveStart: -1e9,
    nextWave: 0,
    rippleStart: -1e9,
    dollyStart: -1e9,
    baseZ: 7.5,
    running: false,
    lastTime: performance.now(),
    spin: 0
  };

  function setPair(a, b) {
    if (state.pair[0] === a && state.pair[1] === b) return;
    state.pair = [a, b];
    from.set(shapeBuffer(a));
    to.set(shapeBuffer(b));
    geometry.attributes.aFrom.needsUpdate = true;
    geometry.attributes.aTo.needsUpdate = true;
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

  function fireWave(now = performance.now()) {
    if (reducedMotion) return;
    state.waveStart = now;
    state.nextWave = now + 5200 + Math.random() * 2000;
  }

  function resize() {
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    uniforms.uAspect.value = width / height;
    state.baseZ = width < 760 ? 8.3 : 7.5;
    camera.updateProjectionMatrix();
    if (reducedMotion) renderFrame(performance.now());
  }

  function renderFrame(now) {
    const dt = Math.min(now - state.lastTime, 64) / 1000;
    state.lastTime = now;
    uniforms.uTime.value = reducedMotion ? 0 : now / 1000;

    if (state.tweening) {
      const progress = Math.min((now - state.tweenStart) / state.tweenDuration, 1);
      uniforms.uMix.value = progress;
      if (progress >= 1) {
        state.tweening = false;
        state.mode = 'scrub-ready';
      }
    } else if (state.mode === 'scrub') {
      const follow = reducedMotion ? 1 : 1 - Math.exp(-dt * 7);
      uniforms.uMix.value += (state.mixTarget - uniforms.uMix.value) * follow;
    }

    const ease = reducedMotion ? 1 : 1 - Math.exp(-dt * 2.2);
    uniforms.uIntensity.value += (state.intensityTarget - uniforms.uIntensity.value) * ease;
    state.focusX += (state.focusXTarget - state.focusX) * ease;
    group.position.x = state.focusX;

    if (!reducedMotion) {
      // Signal wave: 1.8s sweep from left to right across the shape.
      if (now > state.nextWave) fireWave(now);
      const waveP = (now - state.waveStart) / 1800;
      uniforms.uWaveAmp.value = waveP >= 0 && waveP <= 1 ? Math.sin(Math.PI * waveP) : 0;
      uniforms.uWaveFront.value = -4.5 + 9 * easeInOutSine(Math.min(Math.max(waveP, 0), 1));

      const idle = now - state.pointer.lastMove;
      const mouseTarget = finePointer && idle < 1400 ? 1 : 0;
      uniforms.uMouseAmp.value += (mouseTarget - uniforms.uMouseAmp.value) * (1 - Math.exp(-dt * (mouseTarget ? 6 : 1.6)));

      const rippleAge = (now - state.rippleStart) / 1000;
      uniforms.uRipple.value.z = rippleAge < 1.4 ? rippleAge : -1;

      // Route change: the camera dives into the field and settles back (1.1s).
      const dolly = (now - state.dollyStart) / 1100;
      camera.position.z = state.baseZ - (dolly >= 0 && dolly <= 1 ? Math.sin(Math.PI * dolly) * 1.6 : 0);

      state.spin += dt * 0.05;
      state.tilt.x += (state.pointer.y * 0.16 - state.tilt.x) * (1 - Math.exp(-dt * 3));
      state.tilt.y += (state.pointer.x * 0.22 - state.tilt.y) * (1 - Math.exp(-dt * 3));
    } else {
      camera.position.z = state.baseZ;
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

  function tweenTo(name, duration = 1700) {
    if (!SHAPES[name]) return;
    state.shape = name;
    if (reducedMotion) {
      setPair(name, name);
      uniforms.uMix.value = 1;
      state.mode = 'scrub-ready';
      renderFrame(performance.now());
      return;
    }
    from.set(currentPositions());
    to.set(shapeBuffer(name));
    state.pair = ['__live__', name];
    geometry.attributes.aFrom.needsUpdate = true;
    geometry.attributes.aTo.needsUpdate = true;
    uniforms.uMix.value = 0;
    state.mode = 'tween';
    state.tweenStart = performance.now();
    state.tweenDuration = duration;
    state.tweening = true;
    fireWave();
  }

  const onPointer = (event) => {
    state.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    state.pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
    state.pointer.lastMove = performance.now();
    uniforms.uMouse.value.set(state.pointer.x, -state.pointer.y);
  };
  const onDown = (event) => {
    if (reducedMotion || event.target.closest?.('a, button, input, textarea, select, label')) return;
    uniforms.uRipple.value.x = (event.clientX / window.innerWidth) * 2 - 1;
    uniforms.uRipple.value.y = -((event.clientY / window.innerHeight) * 2 - 1);
    state.rippleStart = performance.now();
  };
  const onVisibility = () => (document.hidden ? stop() : start());
  window.addEventListener('pointermove', onPointer, { passive: true });
  window.addEventListener('pointerdown', onDown, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('resize', resize);

  resize();
  // Boot: the field unfolds from a dense core into the manifold.
  setPair('core', 'manifold');
  if (reducedMotion) {
    setPair('manifold', 'manifold');
    uniforms.uIntensity.value = 1;
    state.mode = 'scrub-ready';
    renderFrame(performance.now());
  } else {
    uniforms.uMix.value = 0;
    state.tweenStart = performance.now() + 150;
    state.tweenDuration = 2400;
    state.tweening = true;
    state.nextWave = performance.now() + 2600;
    start();
  }

  return {
    // Time-based morph (route changes).
    setShape(name, { duration } = {}) {
      if (name === state.shape && state.mode !== 'scrub') return;
      tweenTo(name, duration);
    },
    // Scroll-linked morph between two section shapes; t in [0, 1].
    scrub(a, b, t) {
      if (state.tweening || !SHAPES[a] || !SHAPES[b]) return;
      const target = reducedMotion ? (t < 0.5 ? 0 : 1) : t;
      const pairChanged = state.pair[0] !== a || state.pair[1] !== b;
      if (state.mode !== 'scrub' || pairChanged) {
        setPair(a, b);
        uniforms.uMix.value = target;
      }
      state.mode = 'scrub';
      state.mixTarget = target;
      state.shape = target < 0.5 ? a : b;
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
    wave() {
      fireWave();
    },
    dive() {
      if (!reducedMotion) state.dollyStart = performance.now();
    },
    destroy() {
      stop();
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('pointerdown', onDown);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', resize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    }
  };
}
