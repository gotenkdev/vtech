const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Reveal on scroll + mobile menu + image fallback
const rv = $$('.reveal');
const check = () => rv.forEach(el => { if (el.getBoundingClientRect().top < innerHeight * .92) el.classList.add('in'); });
addEventListener('scroll', check, { passive: true }); check();
const mt = $('.menu-t'); if (mt) mt.onclick = () => $('.nav ul').classList.toggle('open');
$$('img').forEach(i => i.addEventListener('error', () => i.style.visibility = 'hidden'));

if ($('#story')) { // home page only
// ---------- MacBook ----------
const rig = $('#rig'), lid = $('#lid'), screen = $('#screen'), vp = $('#vp');
// real laptop layout: [label, width]
const K = (str, w = 1) => str.split(' ').map(c => [c, w]);
const ROWS = [
  [['esc', 1.5], ...K('F1 F2 F3 F4 F5 F6 F7 F8 F9 F10 F11 F12'), ['', 1, 'tid']],
  [...K('` 1 2 3 4 5 6 7 8 9 0 - ='), ['delete', 1.5]],
  [['tab', 1.5], ...K('Q W E R T Y U I O P [ ] \\')],
  [['caps', 1.8], ...K("A S D F G H J K L ; '"), ['return', 1.8]],
  [['shift', 2.3], ...K('Z X C V B N M , . /'), ['shift', 2.3]],
  [['fn'], ['ctrl'], ['opt'], ['⌘', 1.3], ['', 5.2], ['⌘', 1.3], ['opt'], ['←'], ['↑↓'], ['→']]
];
const kb = $('#kb');
kb.innerHTML = ROWS.map(r => `<div class="row">${r.map(([l, w = 1, c = '']) =>
  `<i class="${l.length > 2 ? 'mod ' : ''}${c}" style="flex:${w}">${l}</i>`).join('')}</div>`).join('');
const keys = $$('i', kb);
// shared state read by the WebGL MacBook (assets/mac3d.js)
const MAC = window.MAC = window.MAC || { view: [0, 31, -26, 0, .5, 0], open: false };
const fit = () => vp.style.setProperty('--s', screen.clientWidth / 1440);
new ResizeObserver(fit).observe(screen);

// ---------- VS Code typing ----------
const CODE = [
  '<!-- vtpay.vn · build bởi VTECH -->',
  '<section class="hero">',
  '  <h1>Nhận donate trong <span>5 giây</span></h1>',
  '  <p>Miễn phí 30 ngày đầu · Phí dịch vụ thấp</p>',
  '  <button onclick="startDonate()">Bắt đầu ngay</button>',
  '</section>',
  '<script>',
  '  const qr = await vtpay.createQR({ amount: 100000 });',
  '  render(qr); // thanh toán thẳng về ngân hàng',
  '</script>'
];
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const hl = s => {
  if (/^\s*<!--/.test(s)) return `<span class="cm">${esc(s)}</span>`;
  // single pass so inserted markup is never re-matched
  const re = /(\/\/.*$)|("[^"]*"?)|(<\/?)([a-z0-9]+)|\b(class|onclick)(?==)|\b(const|await)\b|\b(createQR|render|startDonate)\b/g;
  let out = '', last = 0, m;
  while ((m = re.exec(s))) {
    out += esc(s.slice(last, m.index)); last = re.lastIndex;
    const w = (c, t) => `<span class="${c}">${esc(t)}</span>`;
    out += m[1] ? w('cm', m[1]) : m[2] ? w('st', m[2]) : m[4] ? esc(m[3]) + w('tg', m[4])
      : m[5] ? w('at', m[5]) : m[6] ? w('kw', m[6]) : w('fn', m[7]);
  }
  return out + esc(s.slice(last));
};
const codeEl = $('#code'), termOut = $('#termOut');
let typed = 0, total = CODE.join('\n').length, typingDone = false;
function drawCode(n) {
  let left = n, html = '';
  for (const line of CODE) {
    if (left < 0) break;
    const part = line.slice(0, left);
    const cur = left <= line.length ? '<i class="cur"></i>' : '';
    html += `<span class="l">${hl(part)}${cur}</span>`;
    left -= line.length + 1;
  }
  codeEl.innerHTML = html;
  setBuild(n / total * .8);
}
// intro side panel: build checklist follows the typing
const steps = $$("#buildSteps li"), buildBar = $("#buildBar");
function setBuild(f) {
  const k = f >= 1 ? 5 : f >= .8 ? 3 : 2; // steps completed
  steps.forEach((li, i) => { li.className = i < k ? "done" : i === k ? "run" : ""; });
  buildBar.style.transform = `scaleX(${.4 + f * .6})`;
}
function finishTerm() {
  setBuild(1);
  termOut.innerHTML = '<div><span class="dim">$</span> npm run deploy</div><div class="dim">› build 412ms · tối ưu ảnh · nén CSS</div><div class="ok">✓ Deploy thành công → https://vtpay.vn</div>';
}
function type() {
  if (typingDone) return;
  typed = Math.min(total, typed + (Math.random() < .2 ? 3 : 1));
  drawCode(typed);
  const k = keys[(Math.random() * keys.length) | 0]; k.classList.add('on'); setTimeout(() => k.classList.remove('on'), 120);
  MAC.flash?.();
  if (typed < total) setTimeout(type, 22 + Math.random() * 40);
  else { typingDone = true; termOut.innerHTML = '<div><span class="dim">$</span> npm run deploy</div>'; setTimeout(finishTerm, 700); }
}
function skipTyping() { if (typingDone) return; typingDone = true; drawCode(total); finishTerm(); }
drawCode(0);

// Intro: closed lid -> open -> type
if (reduce) { lid.style.transition = 'none'; lid.classList.add('open'); MAC.open = MAC.instant = true; skipTyping(); }
else {
  setTimeout(() => { lid.classList.add('open'); MAC.open = true; }, 500);
  setTimeout(type, 2300);
}

// ---------- Scroll choreography ----------
const story = $('#story'), stage = $('.stage');
const pages = { code: $('.pg-code'), br: $('.pg-br') };
const tabs = $$('.tabs .t'), wins = $$('.w'), caps = $$('.cap'), shops = $$('.shop');
const urlEl = $('#url'), vtWin = $('#vtWin'), bar = $('#progBar');
const URLS = ['', 'vtpay.vn', '', 'vtech.wiki/bang-gia', 'vtech.wiki/cam-ket'];
const SHOP_URLS = ['aura-sneakers.vn (mẫu)', 'novagear.vn (mẫu)', 'lumen-noithat.vn (mẫu)'];
// scene boundaries in story progress (0..1)
const CUTS = [0, .14, .4, .64, .84, 1];
// camera keyframes: p, translateY(vh), rotateX, rotateY, scale
// camera keyframes: p, translateY(vh), rotateX, rotateY, scale, translateX(vw)
// desktop: the MacBook slides away from the side caption of each scene
const KF_DESK = [
  [0, 31, -26, 0, .5, 0],
  [.1, 16, -14, 0, .64, 0],
  [.25, 12, -12, -11, .74, -6],
  [.5, 12, -12, 11, .74, 6],
  [.72, 12, -10, -10, .76, -6],
  [.92, 12, -12, 10, .74, 6],
  [1, 12, -16, 0, .72, 0]
];
// phone: captions sit below, so the MacBook stays centred and fills the width
const KF_MOB = [
  [0, 10, -26, 0, .9, 0],
  [.1, 2, -14, 0, 1.04, 0],
  [.25, 2, -12, -7, 1, 0],
  [.5, 2, -12, 7, 1, 0],
  [.72, 2, -10, -6, 1.02, 0],
  [.92, 2, -12, 6, 1, 0],
  [1, 2, -16, 0, .96, 0]
];
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => t * t * (3 - 2 * t);
function cam(p) {
  const mobile = innerWidth < 860, KF = mobile ? KF_MOB : KF_DESK;
  let i = 0; while (i < KF.length - 2 && p > KF[i + 1][0]) i++;
  const [a, b] = [KF[i], KF[i + 1]], t = ease(Math.min(1, Math.max(0, (p - a[0]) / (b[0] - a[0]))));
  const v = a.map((x, j) => lerp(x, b[j], t));
  MAC.view = v; MAC.mobile = mobile;
  rig.style.setProperty('--ty', v[1] + 'vh');
  rig.style.setProperty('--rx', v[2] + 'deg');
  rig.style.setProperty('--ry', v[3] + 'deg');
  rig.style.setProperty('--sc', v[4]);
  rig.style.setProperty('--tx', v[5] + 'vw');
  rig.style.setProperty('--ryn', v[3]); // drives reflections
}
let scene = -1, shopI = -1;
function setScene(s) {
  if (s === scene) return; scene = s;
  if (s > 0) skipTyping();
  pages.code.classList.toggle('on', s === 0);
  pages.br.classList.toggle('on', s > 0);
  tabs.forEach(t => t.classList.toggle('on', +t.dataset.t === s));
  wins.forEach(w => w.classList.toggle('on', +w.dataset.w === s));
  caps.forEach(c => c.classList.toggle('on', +c.dataset.s === s));
  if (s !== 2 && URLS[s]) urlEl.textContent = URLS[s];
}
function onScroll() {
  const r = story.getBoundingClientRect();
  const p = Math.min(1, Math.max(0, -r.top / (story.offsetHeight - innerHeight)));
  stage.classList.toggle('scrolled', p > .02);
  bar.style.width = p * 100 + '%';
  cam(p);
  let s = 0; while (s < CUTS.length - 2 && p >= CUTS[s + 1]) s++;
  setScene(s);
  const sub = (p - CUTS[s]) / (CUTS[s + 1] - CUTS[s]);
  if (s === 1) { // scroll inside the real VT Pay page
    const winH = vtWin.clientHeight, imgH = vtWin.clientWidth * 5523 / 1455;
    vtWin.style.backgroundPositionY = -Math.max(0, imgH - winH) * ease(Math.min(1, sub * 1.15)) + 'px';
  }
  if (s === 2) { // cycle 3 sample 3D shops
    const k = Math.min(2, Math.floor(sub * 3));
    if (k !== shopI) { shopI = k; shops.forEach((el, j) => el.classList.toggle('on', j === k)); urlEl.textContent = SHOP_URLS[k]; }
  }
}
let raf = 0;
addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; onScroll(); }); }, { passive: true });
addEventListener('resize', onScroll);
onScroll();
}

// ---------- v3: headline — line 1 drawn with a pen, line 2 typed ----------
(() => {
  const l1 = $('.intro .l1'), typed = $('.intro .typed'); if (!l1 || !typed) return;
  const text2 = typed.textContent;
  if (reduce) return; // static headline
  typed.textContent = '';
  const NS = 'http://www.w3.org/2000/svg';
  const draw = () => {
    const svg = document.createElementNS(NS, 'svg'), t = document.createElementNS(NS, 'text');
    t.textContent = l1.textContent; t.setAttribute('x', 0); t.setAttribute('y', 0);
    svg.append(t); svg.classList.add('pen'); l1.textContent = ''; l1.append(svg);
    const b = t.getBBox();
    svg.setAttribute('viewBox', `${b.x - 4} ${b.y - 4} ${b.width + 8} ${b.height + 8}`);
    svg.classList.add('go');
    // after the outline finishes, type line 2
    setTimeout(() => {
      let i = 0;
      (function k() {
        typed.textContent = text2.slice(0, ++i);
        if (i < text2.length) setTimeout(k, 70 + Math.random() * 70);
        else $('.intro .caret').classList.add('idle');
      })();
    }, 1500);
  };
  document.fonts ? document.fonts.ready.then(draw) : draw();
})();

// ---------- v2: cursor light (grid spotlight + card borders) ----------
(() => {
  const root = document.documentElement, lit = $$('.card,.pr,.nw');
  addEventListener('pointermove', e => {
    root.style.setProperty('--mx', e.clientX + 'px'); root.style.setProperty('--my', e.clientY + 'px');
  }, { passive: true });
  lit.forEach(el => el.addEventListener('pointermove', e => {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--px', e.clientX - r.left + 'px'); el.style.setProperty('--py', e.clientY - r.top + 'px');
  }));
})();

// ---------- v2: data packets travelling along the grid ----------
(() => {
  const cv = $('#net'); if (!cv || reduce) return;
  const ctx = cv.getContext('2d'), G = 96, dpr = Math.min(devicePixelRatio, 2);
  let W, H, packets = [];
  const size = () => { W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  size(); addEventListener('resize', size);
  const spawn = () => {
    const horiz = Math.random() < .5, speed = 1.2 + Math.random() * 2.2, dir = Math.random() < .5 ? 1 : -1;
    const lane = Math.round(Math.random() * ((horiz ? H : W) / G)) * G;
    const start = dir > 0 ? -80 : (horiz ? W : H) + 80;
    return { horiz, lane, pos: start, v: speed * dir, len: 60 + Math.random() * 90, hue: Math.random() < .8 ? '59,130,255' : '34,211,238' };
  };
  for (let i = 0; i < 9; i++) { const p = spawn(); p.pos = Math.random() * (p.horiz ? W : H); packets.push(p); }
  (function tick() {
    ctx.clearRect(0, 0, W, H);
    packets.forEach((p, i) => {
      p.pos += p.v;
      const tail = p.pos - p.len * Math.sign(p.v);
      const [x1, y1, x2, y2] = p.horiz ? [tail, p.lane, p.pos, p.lane] : [p.lane, tail, p.lane, p.pos];
      const g = ctx.createLinearGradient(x1, y1, x2, y2);
      g.addColorStop(0, `rgba(${p.hue},0)`); g.addColorStop(1, `rgba(${p.hue},.55)`);
      ctx.strokeStyle = g; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x1 + .5, y1 + .5); ctx.lineTo(x2 + .5, y2 + .5); ctx.stroke();
      ctx.fillStyle = `rgba(${p.hue},.9)`; ctx.fillRect(x2 - 1, y2 - 1, 3, 3);
      const lim = p.horiz ? W : H;
      if (p.pos < -200 || p.pos > lim + 200) packets[i] = spawn();
    });
    requestAnimationFrame(tick);
  })();
})();

// ---------- Cam kết: 3D shield tilt + token count ----------
(() => {
  const w = $('#w3d'), obj = $('#w3dObj'), toks = $$('.tok'), out = $('#fixN'); if (!w) return;
  w.parentElement.addEventListener('pointermove', e => {
    const r = w.getBoundingClientRect();
    obj.style.setProperty('--ty', ((e.clientX - r.left) / r.width - .5) * 30 + 'deg');
    obj.style.setProperty('--tx', -((e.clientY - r.top) / r.height - .5) * 20 + 'deg');
  });
  w.parentElement.addEventListener('pointerleave', () => { obj.style.setProperty('--ty', '0deg'); obj.style.setProperty('--tx', '0deg'); });
  let done = false;
  new IntersectionObserver(([en]) => {
    if (!en.isIntersecting || done) return; done = true;
    toks.forEach((t, i) => setTimeout(() => { t.classList.add('on'); out.textContent = i + 1; }, reduce ? 0 : 400 + i * 180));
  }, { threshold: .4 }).observe(w);
})();

// ---------- analytics (loads only when IDs are set in VTECH_CFG) ----------
const CFG = window.VTECH_CFG || {};
function track(name, params = {}) {
  if (window.gtag) gtag('event', name, params);
  if (window.fbq) fbq('trackCustom', name, params);
}
(() => {
  if (CFG.GA4_ID) {
    const s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + CFG.GA4_ID; document.head.append(s);
    window.dataLayer = window.dataLayer || []; window.gtag = function () { dataLayer.push(arguments); };
    gtag('js', new Date()); gtag('config', CFG.GA4_ID);
  }
  if (CFG.FB_PIXEL_ID) {
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments) }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s) }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', CFG.FB_PIXEL_ID); fbq('track', 'PageView');
  }
  // every call / Zalo link counts as a contact click
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="tel:"],a[href*="zalo.me"]'); if (!a) return;
    track(a.href.startsWith('tel:') ? 'click_call' : 'click_zalo', { location: a.closest('section,header,footer')?.id || 'fab' });
  });
})();

// ---------- quote form ----------
(() => {
  const f = $('#quoteForm'); if (!f) return;
  const msg = $('#qfMsg'), btn = $('button', f);
  const say = (t, cls = '') => { msg.textContent = t; msg.className = 'qf-msg ' + cls; };
  f.addEventListener('submit', async e => {
    e.preventDefault();
    const ten = f.ten, sdt = f.sdt;
    ten.setAttribute('aria-invalid', !ten.value.trim()); sdt.setAttribute('aria-invalid', !sdt.checkValidity());
    if (!ten.value.trim()) { say('Vui lòng nhập họ tên.', 'err'); ten.focus(); return; }
    if (!sdt.checkValidity()) { say('Số điện thoại chưa đúng — nhập 9–15 chữ số.', 'err'); sdt.focus(); return; }
    const data = Object.fromEntries(new FormData(f)); data.trang = location.href; data.thoigian = new Date().toLocaleString('vi-VN');
    btn.disabled = true; say('Đang gửi…');
    try {
      if (!CFG.FORM_ENDPOINT) throw new Error('no-endpoint');
      await fetch(CFG.FORM_ENDPOINT, { method: 'POST', mode: 'no-cors', body: new URLSearchParams(data) });
      track('generate_lead', { goi: data.goi });
      say('Đã nhận yêu cầu! VTECH sẽ gọi lại cho bạn trong giờ làm việc.', 'ok'); f.reset();
    } catch {
      // no endpoint (or network error): hand the request over via Zalo instead of losing it
      const text = `Yêu cầu báo giá VTECH\nGói: ${data.goi}\nTên: ${data.ten}\nSĐT: ${data.sdt}\nNhu cầu: ${data.ghichu || '-'}`;
      try { await navigator.clipboard.writeText(text); } catch {}
      track('generate_lead', { goi: data.goi, via: 'zalo' });
      say('Đã sao chép nội dung — dán vào Zalo vừa mở để gửi cho VTECH.', 'ok');
      window.open('https://zalo.me/0783682006', '_blank', 'noopener');
    } finally { btn.disabled = false; }
  });
})();
