// Photoreal MacBook for the scroll story: Three.js PBR body + CSS3D screen.
// The CSS MacBook in index.html stays as the fallback when WebGL is unavailable.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';

const stage = document.querySelector('.stage');
const sceneEl = document.querySelector('.scene');
const screenEl = document.getElementById('screen');
const MAC = window.MAC = window.MAC || { view: [0, 25, -26, 0, .62, 0], open: false };
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---- dimensions (cm, roughly a 14" MacBook Pro) ----
const W = 31.2, D = 22, BH = 1.15, LT = .5;          // base width/depth/height, lid thickness
const DISP_W = 29.2, DISP_H = DISP_W * 900 / 1440;    // display matches the 1440x900 HTML screen
const BEZ_TOP = .75, BEZ_BOT = 1.25, LH = DISP_H + BEZ_TOP + BEZ_BOT;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
} catch { /* no WebGL: keep the CSS MacBook */ }
if (renderer) init();

function init() {
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.className = 'mac-gl';

  const css = new CSS3DRenderer();
  css.domElement.className = 'mac-css';
  sceneEl.append(renderer.domElement, css.domElement);

  const scene = new THREE.Scene(), cssScene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;

  const camera = new THREE.PerspectiveCamera(26, 1, 1, 2000);
  camera.position.set(0, 0, 160);

  // ---- materials ----
  const alu = new THREE.MeshPhysicalMaterial({ color: 0xd9dbe0, metalness: 1, roughness: .28, clearcoat: .2, clearcoatRoughness: .45, envMapIntensity: 1.35 });
  const aluDark = new THREE.MeshPhysicalMaterial({ color: 0x9da0a8, metalness: 1, roughness: .42 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x050506, metalness: 0, roughness: .06, clearcoat: 1, clearcoatRoughness: .03, envMapIntensity: .9 });
  const keyMat = new THREE.MeshPhysicalMaterial({ color: 0x141518, roughness: .5, metalness: .1, clearcoat: .2 });
  const wellMat = new THREE.MeshStandardMaterial({ color: 0x0c0d10, roughness: .8 });
  const padMat = new THREE.MeshPhysicalMaterial({ color: 0xcfd2d8, metalness: .6, roughness: .16, clearcoat: .8, clearcoatRoughness: .1 });

  // ---- rig: origin = hinge line on top of the base ----
  const mac = new THREE.Group(); scene.add(mac);

  // base
  const base = new THREE.Mesh(new RoundedBoxGeometry(W, BH, D, 6, .55), alu);
  base.position.set(0, -BH / 2, D / 2); base.castShadow = base.receiveShadow = true; mac.add(base);
  // front lip notch
  const lip = new THREE.Mesh(new RoundedBoxGeometry(4.2, .25, .6, 3, .12), aluDark);
  lip.position.set(0, -.12, D - .05); mac.add(lip);
  // hinge barrel
  const hinge = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, W * .78, 32), new THREE.MeshPhysicalMaterial({ color: 0x1a1b1f, metalness: .8, roughness: .3 }));
  hinge.rotation.z = Math.PI / 2; hinge.position.set(0, -.05, .25); mac.add(hinge);

  // keyboard well + keys
  const ROWS = [
    [['esc', 1.5], ...'F1 F2 F3 F4 F5 F6 F7 F8 F9 F10 F11 F12'.split(' ').map(k => [k, 1]), ['', 1]],
    [...'` 1 2 3 4 5 6 7 8 9 0 - ='.split(' ').map(k => [k, 1]), ['delete', 1.5]],
    [['tab', 1.5], ...'Q W E R T Y U I O P [ ] \\'.split(' ').map(k => [k, 1])],
    [['caps lock', 1.8], ...'A S D F G H J K L ; \''.split(' ').map(k => [k, 1]), ['return', 1.8]],
    [['shift', 2.3], ...'Z X C V B N M , . /'.split(' ').map(k => [k, 1]), ['shift', 2.3]],
    [['fn', 1], ['control', 1], ['option', 1], ['command', 1.3], ['', 5.2], ['command', 1.3], ['option', 1], ['◀', 1], ['▲▼', 1], ['▶', 1]]
  ];
  const KB_W = 27.2, GAP = .2, U = 1.62, FN_H = .9, KB_Z0 = 1.25;
  const rowsH = [FN_H, U, U, U, U, U];
  const KB_D = rowsH.reduce((a, b) => a + b) + GAP * 5;
  const well = new THREE.Mesh(new RoundedBoxGeometry(KB_W + .5, .06, KB_D + .5, 2, .03), wellMat);
  well.position.set(0, .0, KB_Z0 + KB_D / 2); mac.add(well);

  const keyBoxes = [];
  let z = KB_Z0;
  ROWS.forEach((row, ri) => {
    const sum = row.reduce((a, [, w]) => a + w, 0), unit = (KB_W - GAP * (row.length - 1)) / sum;
    let x = -KB_W / 2;
    row.forEach(([label, w]) => {
      const kw = unit * w;
      keyBoxes.push({ x: x + kw / 2, z: z + rowsH[ri] / 2, w: kw, d: rowsH[ri], label, small: label.length > 2 || ri === 0 });
      x += kw + GAP;
    });
    z += rowsH[ri] + GAP;
  });
  const keyGeo = new RoundedBoxGeometry(1, .18, 1, 2, .07);
  const keys = new THREE.InstancedMesh(keyGeo, keyMat, keyBoxes.length);
  const m4 = new THREE.Matrix4(), black = new THREE.Color(0x141518), blue = new THREE.Color(0x3b82ff);
  keyBoxes.forEach((k, i) => {
    m4.compose(new THREE.Vector3(k.x, .1, k.z), new THREE.Quaternion(), new THREE.Vector3(k.w, 1, k.d));
    keys.setMatrixAt(i, m4); keys.setColorAt(i, black);
  });
  keys.castShadow = true; mac.add(keys);

  // key legends: one canvas decal laid over the key tops
  {
    const S = 80, cv = document.createElement('canvas');
    cv.width = KB_W * S; cv.height = KB_D * S;
    const g = cv.getContext('2d'); g.fillStyle = '#e6e8ee'; g.textBaseline = 'middle';
    keyBoxes.forEach(k => {
      if (!k.label) return;
      const cx = (k.x + KB_W / 2) * S, cy = (k.z - KB_Z0) * S;
      g.font = `500 ${k.small ? .26 * S : .42 * S}px "Be Vietnam Pro", system-ui, sans-serif`;
      g.textAlign = k.small && k.label.length > 2 ? 'left' : 'center';
      const tx = g.textAlign === 'left' ? cx - k.w * S / 2 + .16 * S : cx;
      const ty = k.small && k.label.length > 2 ? cy + k.d * S / 2 - .22 * S : cy;
      g.fillText(k.label, tx, ty);
    });
    // Touch ID ring
    const t = keyBoxes[13]; g.strokeStyle = '#3a3c43'; g.lineWidth = .05 * S;
    g.beginPath(); g.arc((t.x + KB_W / 2) * S, (t.z - KB_Z0) * S, .3 * S, 0, Math.PI * 2); g.stroke();
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const decal = new THREE.Mesh(new THREE.PlaneGeometry(KB_W, KB_D), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: .85, depthWrite: false }));
    decal.rotation.x = -Math.PI / 2; decal.position.set(0, .195, KB_Z0 + KB_D / 2); mac.add(decal);
  }

  // speaker grilles
  {
    const cv = document.createElement('canvas'); cv.width = 64; cv.height = 512;
    const g = cv.getContext('2d'); g.fillStyle = '#2b2d33';
    for (let y = 6; y < 512; y += 9) for (let x = 6; x < 64; x += 9) { g.beginPath(); g.arc(x, y, 2.2, 0, 7); g.fill(); }
    const tex = new THREE.CanvasTexture(cv);
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: .9, depthWrite: false });
    [-1, 1].forEach(sd => {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(1.2, KB_D), mat);
      p.rotation.x = -Math.PI / 2; p.position.set(sd * (KB_W / 2 + 1.1), .002, KB_Z0 + KB_D / 2); mac.add(p);
    });
  }

  // trackpad
  const padD = D - (KB_Z0 + KB_D) - 1.9;
  const pad = new THREE.Mesh(new RoundedBoxGeometry(W * .44, .04, padD, 3, .02), padMat);
  pad.position.set(0, .005, KB_Z0 + KB_D + .95 + padD / 2); pad.receiveShadow = true; mac.add(pad);

  // lid
  const lid = new THREE.Group(); mac.add(lid);
  const shell = new THREE.Mesh(new RoundedBoxGeometry(W, LH, LT, 6, .22), alu);
  shell.position.set(0, LH / 2, -LT / 2); shell.castShadow = true; lid.add(shell);
  const bezel = new THREE.Mesh(new RoundedBoxGeometry(W - .3, LH - .3, .05, 4, .02), glass);
  bezel.position.set(0, LH / 2, .02); lid.add(bezel);
  const notch = new THREE.Mesh(new RoundedBoxGeometry(3.2, .55, .02, 2, .01), new THREE.MeshBasicMaterial({ color: 0x000000 }));
  notch.position.set(0, LH - .45, .055); lid.add(notch);
  const camDot = new THREE.Mesh(new THREE.CircleGeometry(.11, 24), new THREE.MeshPhysicalMaterial({ color: 0x223355, roughness: .1, clearcoat: 1 }));
  camDot.position.set(0, LH - .45, .07); lid.add(camDot);
  // back logo: polished "V"
  {
    const cv = document.createElement('canvas'); cv.width = cv.height = 256;
    const g = cv.getContext('2d'); g.fillStyle = '#fff'; g.font = '700 220px "Space Grotesk", system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('V', 128, 140);
    const logo = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 1, roughness: .05, alphaMap: new THREE.CanvasTexture(cv), transparent: true }));
    logo.position.set(0, LH / 2, -LT - .01); logo.rotation.y = Math.PI; lid.add(logo);
  }
  // HTML screen glued to the display
  const anchor = new THREE.Object3D(); anchor.position.set(0, BEZ_BOT + DISP_H / 2, .06); lid.add(anchor);
  screenEl.style.cssText = 'width:1440px;height:900px;border-radius:14px';
  const cssObj = new CSS3DObject(screenEl); cssObj.matrixAutoUpdate = false; cssScene.add(cssObj);
  const pxScale = new THREE.Matrix4().makeScale(DISP_W / 1440, DISP_W / 1440, 1);

  // floor for the soft contact shadow
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(140, 140), new THREE.ShadowMaterial({ opacity: .38 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, -BH - .01, D / 2); floor.receiveShadow = true; mac.add(floor);

  // lights (environment does most of the work)
  scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x0a0c14, .35));
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(-8, 110, 70);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 8; key.shadow.bias = -.0004;
  Object.assign(key.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 10, far: 250 });
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x6ea8ff, 1.1); rim.position.set(40, 20, -60); scene.add(rim);

  // key flash from the typing effect
  MAC.flash = () => {
    const i = (Math.random() * keyBoxes.length) | 0;
    keys.setColorAt(i, blue); keys.instanceColor.needsUpdate = true;
    setTimeout(() => { keys.setColorAt(i, black); keys.instanceColor.needsUpdate = true; }, 130);
  };

  // ---- layout & animation ----
  let w = 0, h = 0;
  const size = () => {
    w = sceneEl.clientWidth; h = sceneEl.clientHeight;
    renderer.setSize(w, h); css.setSize(w, h);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  size(); addEventListener('resize', size);

  const CLOSED = Math.PI / 2, OPEN = -.2;
  let lidA = MAC.instant ? OPEN : CLOSED, openT0 = 0;
  const cur = MAC.view.slice();
  const D2R = Math.PI / 180;

  let running = true;
  new IntersectionObserver(([e]) => { running = e.isIntersecting; if (running) tick(); }).observe(stage);

  function tick(t = performance.now()) {
    if (!running) return;
    requestAnimationFrame(tick);
    // smooth toward the scroll-driven target view
    const v = MAC.view; for (let i = 0; i < 6; i++) cur[i] += (v[i] - cur[i]) * (reduce ? 1 : .12);
    const [, ty, rx, ry, sc, tx] = cur;

    // world units per CSS px at the rig's depth
    const vh = 2 * camera.position.z * Math.tan(camera.fov * D2R / 2), upp = vh / h;
    const mw = MAC.mobile ? Math.min(620, w * .94) : Math.min(1080, w * .62, h * 1.15); // same width rule as the CSS rig
    mac.scale.setScalar(mw * sc * upp / W);
    mac.position.set(tx / 100 * w * upp, -ty / 100 * h * upp, 0);
    mac.rotation.set(-rx * D2R, ry * D2R, 0, 'XYZ'); // same order as CSS rotateX() rotateY()

    // lid: closed -> open once, eased
    if (MAC.open && !openT0) openT0 = t;
    if (openT0 && !MAC.instant) {
      const k = Math.min(1, (t - openT0) / 1800), e = 1 - Math.pow(1 - k, 3);
      lidA = CLOSED + (OPEN - CLOSED) * e;
    } else if (MAC.instant) lidA = OPEN;
    lid.rotation.x = lidA;

    // the HTML screen only exists once the lid faces the viewer
    mac.updateMatrixWorld(true);
    cssObj.matrix.copy(anchor.matrixWorld).multiply(pxScale);
    const facing = (CLOSED - lidA) / (CLOSED - OPEN);
    screenEl.style.opacity = Math.max(0, Math.min(1, (facing - .55) / .3));

    renderer.render(scene, camera);
    css.render(cssScene, camera);
  }
  stage.classList.add('has3d');
  tick();
}
