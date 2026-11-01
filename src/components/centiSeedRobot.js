import * as THREE from 'three';

// Centi-seed as it was built (March 2018): a clear laser-cut acrylic frame over black servos, a white horn on each
// side servo turning a big boomerang-shaped acrylic leg, a yellow coupler between the two halves of the body that
// rocks it from side to side, and red, white and black servo wires everywhere. On its back, the plant it carries.
//
// It walks the way a robot like this does: the body rocks to lift one side, that side's legs swing forward, and the
// planted side pushes it along. Planted feet stay where they landed, because their angle is worked out from how far
// the body has moved.
//
// It draws to its own small canvas, apart from the prism's scene, so nothing here can touch that scene's shaders,
// post-processing or warm-up. It only draws while something is moving.

const LEG_REACH = 2.5; // from the horn to the sole of the foot, which is also how high the horns stand
const HIPS = [[-1.55, 1], [1.55, 1], [-1.55, -1], [1.55, -1]]; // along the body, and which side
const STRIDE = 1.5; // how far a foot sweeps, front to back
const SPEED = 2.5; // units a second
const smooth = (t) => t * t * (3 - 2 * t);
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

// A flat outline, rounded at its corners, as a solid plate of acrylic
const plate = (shape, depth = 0.09) => {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.025, bevelSegments: 2, curveSegments: 18 });
  g.translate(0, 0, -depth / 2);
  return g;
};
const roundedRect = (w, h, r) => {
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -h / 2);
  s.lineTo(w / 2 - r, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - r); s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  s.lineTo(-w / 2 + r, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  s.lineTo(-w / 2, -h / 2 + r); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  return s;
};

// The boomerang leg, drawn with its horn at the origin: a broad round plate around the horn, an arm running out to
// a rounded bend, and a shin tapering back to a small foot, which sits straight below the horn
const legShape = () => {
  const s = new THREE.Shape();
  s.moveTo(-0.7, 0.1);
  s.bezierCurveTo(-0.7, 0.7, 0.3, 0.85, 0.75, 0.45);
  s.bezierCurveTo(1.2, 0.05, 1.75, -0.4, 2.05, -0.78);
  s.quadraticCurveTo(2.22, -1, 2.05, -1.2);
  s.bezierCurveTo(1.4, -1.9, 0.7, -2.55, 0.16, -3.06);
  s.quadraticCurveTo(0.02, -3.16, -0.1, -3.04);
  s.bezierCurveTo(0.25, -2.4, 0.62, -1.75, 1.02, -1.12);
  s.bezierCurveTo(1.1, -0.98, 0.95, -0.82, 0.75, -0.72);
  s.bezierCurveTo(0.2, -0.5, -0.7, -0.6, -0.7, 0.1);
  return s;
};

const hornCross = (white) => {
  const group = new THREE.Group();
  const arm = (w, h) => { const m = new THREE.Mesh(plate(roundedRect(w, h, 0.07), 0.05), white); group.add(m); return m; };
  arm(1.05, 0.2); arm(0.2, 1.05);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.14, 20), white);
  hub.rotation.x = Math.PI / 2;
  group.add(hub);
  return group;
};

const servo = (black) => {
  const group = new THREE.Group();
  group.add(new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.95, 0.5), black));
  const tabs = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.08, 0.5), black);
  tabs.position.y = 0.24;
  group.add(tabs);
  return group;
};

// Red, white and black, side by side, with the small black plug on the end
const wire = (points, colours, plugMaterial) => {
  const group = new THREE.Group();
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  colours.forEach((material, i) => {
    const offset = new THREE.Vector3((i - 1) * 0.035, 0, (i - 1) * 0.02);
    const c = new THREE.CatmullRomCurve3(curve.points.map((p) => p.clone().add(offset)));
    group.add(new THREE.Mesh(new THREE.TubeGeometry(c, 44, 0.024, 6), material));
  });
  const plug = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.09, 0.13), plugMaterial);
  plug.position.copy(curve.points[curve.points.length - 1]);
  group.add(plug);
  return group;
};

const plant = (stem, leaf, dark) => {
  const group = new THREE.Group();
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.26, 0.42, 22), dark);
  pot.position.y = 0.21;
  group.add(pot);
  const grown = new THREE.Group();
  grown.position.y = 0.42;
  group.add(grown);
  const path = new THREE.CatmullRomCurve3([[0, 0, 0], [0.05, 0.5, 0], [-0.05, 1, 0.02], [0.05, 1.5, 0]].map((p) => new THREE.Vector3(...p)));
  grown.add(new THREE.Mesh(new THREE.TubeGeometry(path, 20, 0.035, 7), stem));
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0);
  leafShape.bezierCurveTo(0.2, 0.22, 0.55, 0.3, 0.8, 0.12);
  leafShape.bezierCurveTo(0.6, -0.14, 0.2, -0.16, 0, 0);
  const leafGeometry = new THREE.ShapeGeometry(leafShape, 12);
  [[0.05, 1.5, 0, 0.5, 0.3], [0, 1.08, 0.01, 2.65, -0.4], [0.02, 0.72, 0, 0.35, 0.7], [0, 0.42, 0, 2.8, 1]].forEach(([x, y, z, tilt, turn], i) => {
    const m = new THREE.Mesh(leafGeometry, leaf);
    m.position.set(x, y, z);
    m.rotation.set(0, turn, tilt);
    m.scale.setScalar(1 - i * 0.1);
    grown.add(m);
  });
  return { group, grown };
};

// A small studio to reflect in the acrylic: a warm sun, a cool fill, and a strip of the prism's colours
const studio = (renderer, lightMode) => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(lightMode ? 0xdfe3ea : 0x08090c);
  const panel = (colour, w, h, x, y, z) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(colour), side: THREE.DoubleSide }));
    m.position.set(x, y, z);
    m.lookAt(0, 0, 0);
    scene.add(m);
  };
  const glow = lightMode ? 1.2 : 5;
  panel(new THREE.Color(0xfff0d8).multiplyScalar(glow * 1.6), 8, 8, 2, 11, 6);
  panel(new THREE.Color(0xbcd4ff).multiplyScalar(glow * 0.5), 6, 10, -11, 3, 4);
  ['#ff5a52', '#ff9a3d', '#f2d34a', '#5fd38d', '#4dd0e1', '#6a8cff', '#b07cff'].forEach((c, i) => {
    panel(new THREE.Color(c).multiplyScalar(glow * 0.8), 1.3, 7, -6 + i * 2, 1, 11);
  });
  const pmrem = new THREE.PMREMGenerator(renderer);
  const texture = pmrem.fromScene(scene, 0.04).texture;
  pmrem.dispose();
  scene.traverse((o) => { o.geometry?.dispose(); o.material?.dispose(); });
  return texture;
};

// Soft round textures: the sun's pool on the floor, and the robot's shadow
const softDisc = (stops) => {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  stops.forEach(([at, colour]) => g.addColorStop(at, colour));
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

/**
 * Builds the robot on a canvas. Returns { walkIn(), rest(), follow(x), resize(), setLightMode(light), dispose() }.
 * follow takes 0..1 across the canvas: the sun goes there and the robot walks to it.
 */
export const createCentiSeed = (canvas, { lightMode = false, floor = 0.8 } = {}) => {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(20, 2, 1, 200);

  const acrylic = new THREE.MeshPhysicalMaterial({ color: 0xf2f8ff, transparent: true, opacity: 0.2, roughness: 0.06, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.6, side: THREE.DoubleSide, depthWrite: false });
  const edgeLine = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });
  const black = new THREE.MeshStandardMaterial({ color: 0x17181b, roughness: 0.45, metalness: 0.1 });
  const white = new THREE.MeshStandardMaterial({ color: 0xf1f1ee, roughness: 0.4 });
  const yellow = new THREE.MeshStandardMaterial({ color: 0xf2c11d, roughness: 0.4 });
  const red = new THREE.MeshStandardMaterial({ color: 0xc3322d, roughness: 0.5 });
  const stem = new THREE.MeshStandardMaterial({ color: 0x6fbe7d, roughness: 0.55 });
  const leaf = new THREE.MeshStandardMaterial({ color: 0x5fd38d, roughness: 0.5, side: THREE.DoubleSide });
  const materials = [acrylic, edgeLine, black, white, yellow, red, stem, leaf];

  // Clear acrylic reads by its cut edges, which catch the light
  const clear = (geometry) => {
    const m = new THREE.Mesh(geometry, acrylic);
    m.renderOrder = 2;
    m.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 28), edgeLine));
    return m;
  };

  const robot = new THREE.Group(); // where it stands, and which way it faces
  const body = new THREE.Group(); // rocks from side to side about its spine
  body.position.y = LEG_REACH;
  robot.add(body);
  scene.add(robot);

  // The frame: two halves of clear plate, the coupler between them, the servos hung under it
  [-1.55, 1.55].forEach((x) => {
    const top = clear(plate(roundedRect(2.55, 1.9, 0.16), 0.08));
    top.rotation.x = Math.PI / 2;
    top.position.set(x, 0.42, 0);
    body.add(top);
    const low = clear(plate(roundedRect(2.55, 1.9, 0.16), 0.08));
    low.rotation.x = Math.PI / 2;
    low.position.set(x, -0.42, 0);
    body.add(low);
    [-1, 1].forEach((side) => {
      const wall = clear(plate(roundedRect(2.3, 0.86, 0.1), 0.07));
      wall.position.set(x, 0, side * 0.94);
      body.add(wall);
      const s = servo(black);
      s.rotation.y = Math.PI;
      s.position.set(x, 0.02, side * 0.64);
      body.add(s);
    });
    const under = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 0.64), black);
    under.position.set(x, -0.74, 0);
    body.add(under);
  });
  const coupler = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.34, 0.5), yellow);
  coupler.position.set(0, 0.06, 0);
  body.add(coupler);
  [-0.42, 0.42].forEach((x) => {
    const tie = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1.05, 0.03), white);
    tie.position.set(x, 0.24, 0.98);
    body.add(tie);
  });

  // Webcam on the nose: this is how it looked for the light
  const cam = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.72), black);
  cam.position.set(3.08, 0.46, 0);
  body.add(cam);
  const lens = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 12), new THREE.MeshStandardMaterial({ color: 0x223044, emissive: 0xff9a3d, emissiveIntensity: 0.9, roughness: 0.15 }));
  materials.push(lens.material);
  lens.position.set(3.3, 0.46, 0);
  body.add(lens);

  // The wires, looping out and trailing behind
  body.add(wire([[0.2, 0.46, 0.5], [-0.5, 1.1, 0.7], [-1.6, 0.86, 1.1], [-2.5, 0.7, 1.15], [-3.3, 0.1, 1.05], [-3.75, 0.45, 1.3]], [red, white, black], black));
  body.add(wire([[1.2, 0.46, -0.6], [2.1, 1.1, -0.8], [2.9, 0.7, -1.15], [3.4, -0.2, -1.2]], [red, white, black], black));

  const legs = HIPS.map(([x, side]) => {
    const pivot = new THREE.Group(); // turns on the servo
    pivot.position.set(x, 0, side * 1.14);
    body.add(pivot);
    const geometry = plate(legShape(), 0.1);
    geometry.scale(x > 0 ? 0.8 : -0.8, 0.8, 1); // the bends point away from the body's middle
    const shape = clear(geometry);
    pivot.add(shape);
    const horn = hornCross(white);
    horn.position.z = side * 0.09;
    pivot.add(horn);
    return { x, side, pivot, shape };
  });

  const { group: planter, grown } = plant(stem, leaf, black);
  planter.position.set(-1.5, 0.46, 0);
  body.add(planter);

  // Its shadow, and the pool of sun on the floor
  const shadowTexture = softDisc([[0, 'rgba(8,10,16,0.5)'], [1, 'rgba(0,0,0,0)']]);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 3.6), new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false, toneMapped: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.01;
  scene.add(shadow);
  const sunTexture = softDisc([[0, 'rgba(255,226,170,0.62)'], [0.5, 'rgba(255,214,150,0.2)'], [1, 'rgba(255,214,150,0)']]);
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(16, 7), new THREE.MeshBasicMaterial({ map: sunTexture, transparent: true, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending }));
  pool.rotation.x = -Math.PI / 2;
  scene.add(pool);

  const sun = new THREE.DirectionalLight(0xffeccc, 2.4);
  const fill = new THREE.HemisphereLight(0xcfdcff, 0x202028, 0.9);
  scene.add(sun, sun.target, fill);

  let env = null;
  const applyLight = (light) => {
    env?.dispose();
    env = studio(renderer, light);
    scene.environment = env;
    edgeLine.color.set(light ? 0x6f8094 : 0xffffff);
    edgeLine.opacity = light ? 0.75 : 0.6;
    acrylic.opacity = light ? 0.3 : 0.2;
    pool.visible = !light;
    shadow.material.opacity = light ? 0.34 : 1;
  };
  applyLight(lightMode);

  let halfWidth = 12;
  let state = 'rest';
  let x = 0;
  let target = 0;
  let sunX = 0;
  let sunShown = 0;
  let heading = 0; // 0 faces right, PI faces left
  let aim = 0;
  let travelled = 0;
  let grow = 1;
  let frame = 0;
  let last = 0;

  const setPose = () => {
    // Half a step for each side: a side swings forward while the body rocks it clear, then pushes back while planted
    const cycle = travelled / (STRIDE * 2);
    const phase = (cycle - Math.floor(cycle)) * 2; // 0..2
    const swinging = phase < 1 ? 1 : -1; // which side is in the air
    const t = phase < 1 ? phase : phase - 1;
    const standing = state === 'rest' || !travelled;
    const roll = standing ? 0 : Math.sin(t * Math.PI) * 0.13;
    body.rotation.x = -roll * swinging;
    legs.forEach((leg) => {
      const inAir = leg.side === swinging;
      // Where the foot is, ahead of or behind the hip
      const foot = inAir ? -STRIDE / 2 + STRIDE * smooth(t) : STRIDE / 2 - STRIDE * t;
      leg.pivot.rotation.z = standing ? 0 : Math.asin(clamp(foot / LEG_REACH, -0.8, 0.8));
    });
    // The planted feet stay on the floor: the body rides on them as they pass under it, and rises as it rocks
    const planted = standing ? 0 : STRIDE / 2 - STRIDE * t;
    body.position.y = Math.sqrt(LEG_REACH * LEG_REACH - planted * planted) + roll * 1.14;
    robot.position.x = x;
    robot.rotation.y = heading;
    grown.scale.setScalar(Math.max(0.001, smooth(grow)));
    shadow.position.x = x;
    pool.position.x = sunShown;
    sun.position.set(sunShown + 3, 12, 8);
    sun.target.position.set(sunShown, 0, 0);
  };

  const draw = () => renderer.render(scene, camera);

  const tick = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    sunShown += (sunX - sunShown) * Math.min(1, dt * 5);
    let busy = Math.abs(sunX - sunShown) > 0.02;
    const d = target - x;
    if (Math.abs(heading - aim) > 0.01) {
      heading += clamp(aim - heading, -dt * 3.4, dt * 3.4);
      travelled += dt * 1.2; // shuffles round as it turns
      busy = true;
    } else if (Math.abs(d) > 0.05) {
      const speed = SPEED * clamp(Math.abs(d) / 1.2, 0.4, 1);
      const step = Math.min(Math.abs(d), speed * dt);
      x += Math.sign(d) * step;
      travelled += step;
      busy = true;
    } else if (state === 'walking') {
      state = 'growing';
    } else if (state === 'following') {
      state = 'rest';
    }
    if (state === 'growing') {
      grow = Math.min(1, grow + dt / 1.6);
      if (grow === 1) state = 'rest';
      busy = true;
    }
    setPose();
    draw();
    frame = busy ? requestAnimationFrame(tick) : 0;
  };
  const go = () => {
    if (frame) return;
    last = performance.now();
    frame = requestAnimationFrame(tick);
  };

  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // The robot keeps one size on the screen (about 170 px long, smaller on a phone) however wide the card is
    const robotPx = clamp(w * 0.36, 170, 300);
    const unitsTall = (h / robotPx) * 7.4;
    const distance = unitsTall / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const tilt = 0.17; // looking a little down at it
    const mid = unitsTall * (floor - 0.5); // how far above the floor line the camera looks
    camera.position.set(2.2, mid + Math.sin(tilt) * distance, Math.cos(tilt) * distance);
    camera.lookAt(0.0, mid, 0);
    camera.updateProjectionMatrix();
    halfWidth = (unitsTall * camera.aspect) / 2;
    setPose();
    draw();
  };

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  const onLost = (e) => { e.preventDefault(); cancelAnimationFrame(frame); frame = 0; };
  canvas.addEventListener('webglcontextlost', onLost);

  return {
    /** It walks in from the left, to the sun in the middle, and its plant grows */
    walkIn() {
      cancelAnimationFrame(frame);
      frame = 0;
      x = -halfWidth - 6;
      target = 0;
      sunX = 0;
      sunShown = 0;
      heading = 0;
      aim = 0;
      travelled = 0;
      grow = 0.12;
      state = 'walking';
      go();
    },
    /** Already there, for reduced motion */
    rest() {
      cancelAnimationFrame(frame);
      frame = 0;
      x = 0;
      target = 0;
      sunX = 0;
      sunShown = 0;
      heading = 0;
      aim = 0;
      travelled = 0;
      grow = 1;
      state = 'rest';
      setPose();
      draw();
    },
    follow(at) {
      if (state === 'growing') return;
      const reach = Math.max(1, halfWidth - 4.5);
      sunX = clamp((at - 0.5) * 2 * halfWidth, -reach, reach);
      target = sunX;
      if (Math.abs(target - x) > 0.6) {
        aim = target > x ? 0 : Math.PI;
        if (state === 'rest') state = 'following';
      }
      go();
    },
    setLightMode(light) {
      applyLight(light);
      draw();
    },
    resize,
    dispose() {
      cancelAnimationFrame(frame);
      ro.disconnect();
      canvas.removeEventListener('webglcontextlost', onLost);
      scene.traverse((o) => o.geometry?.dispose());
      materials.forEach((m) => m.dispose());
      [shadowTexture, sunTexture].forEach((t) => t.dispose());
      shadow.material.dispose();
      pool.material.dispose();
      env?.dispose();
      renderer.dispose();
    },
  };
};
