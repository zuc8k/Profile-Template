// Scenes, navigation, input, language and live data.
import { AR, EN_EXTRA } from './i18n.js';
import { createCloud } from './cloud.js';

const D = document, R = D.documentElement;
const $ = (s, c = D) => c.querySelector(s);
const $$ = (s, c = D) => [...c.querySelectorAll(s)];
const clamp = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const store = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } };
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
const isMobile = () => window.innerWidth < 900;

/* ================= text ================= */
const EN = { ...EN_EXTRA };
$$('[data-t]').forEach(n => { const k = n.dataset.t; if (!EN[k]) EN[k] = n.textContent; });
$$('[data-ta]').forEach(n => { const k = n.dataset.ta; if (!EN[k]) EN[k] = n.getAttribute('alt') || n.getAttribute('aria-label'); });
let lang = 'en', rtl = false;
const t = k => (lang === 'ar' && AR[k]) || EN[k] || '';
const sceneName = i => (i === 2 ? 'Zucks Bot' : t('s' + i));

/* ================= cloud ================= */
const N = isMobile() ? 8000 : 20000;
const PER = 2500 / N;
const cloud = createCloud($('#gl'), { count: N, reduce, isRtl: () => rtl });
R.classList.toggle('no-webgl', !cloud.webgl);

/* ================= scenes ================= */
const scenes = $$('.sc');
let idx = -1, busy = false, entered = false, verb = 0, xsel = 0, brand = 0, adOpen = false;
const VFORM = ['lattice', 'rings', 'grow', 'connect', 'wave'];
const XFORM = ['logo:ad', 'logo:zucks', 'creators', 'pr', 'logo:vexo', 'logo:vexo'];
/* clean URLs: /zucks, /vexo ... each one opens its scene (and item) directly */
const ROUTES = { '': [0], 'what-i-do': [1], 'zucksbot': [2], 'experience': [3, 0], 'zucks': [3, 1], 'creators': [3, 2], 'public-relations': [3, 3], 'vexo': [3, 4], 'vexo': [3, 5], 'work': [4], 'contact': [5] };
const XPATH = ['experience', 'zucks', 'creators', 'public-relations', 'vexo', 'vexo'];
const pathFor = () => (idx === 3 ? XPATH[xsel] : ['', 'what-i-do', 'zucksbot', '', 'work', 'contact'][idx]);
let routing = false;
function syncUrl() {
  document.title = (idx ? sceneTitle() + ' | ' : '') + 'Zucks — Community Builder';
  if (routing || !history.pushState) return;
  const want = '/' + pathFor();
  if (location.pathname !== want || location.hash) history.pushState(null, '', want);
}
const sceneTitle = () => (idx === 3 ? (xsel ? XL[xsel].name || t(XL[xsel].key) : sceneName(3)) : sceneName(idx));
function routeFrom(path, hash) {
  const key = (path || '/').replace(/^\/+|\/+$/g, '').toLowerCase();
  const legacy = { '#do': 1, '#ad': 2, '#exp': 3, '#now': 4, '#contact': 5 }[hash];
  return (key === '' && legacy) ? [legacy] : (ROUTES[key] || (legacy ? [legacy] : null));
}
function applyRoute(r) {
  if (!r) return;
  routing = true;
  if (r[0] === 3 && r[1] != null) setX(r[1], true);
  go(r[0], true);
  if (r[0] === 3) refresh(true);
  routing = false;
  syncUrl();
}
window.addEventListener('popstate', () => { if (entered) { routing = true; const r = routeFrom(location.pathname, location.hash) || [0]; if (r[0] === 3 && r[1] != null) setX(r[1], true); go(r[0], true); if (r[0] === 3) refresh(true); routing = false; syncUrl(); } });

const XTINT = ['#8f9bff', '#8f8bff', '#f0b3cf', '#f3cba4', '#4d8dff', '#99f9ea'];

function camFor(i) {
  const m = isMobile(), s = rtl ? -1 : 1;
  if (m && window.innerHeight < 680 && i !== 2 && i !== 5) return { dist: [7.4, 7.6, 0, 8.6, 8][i], ox: 0, oy: .7, spin: i === 4 ? 0 : .08, sway: i === 4 ? .3 : 0, pitch: i === 1 ? .5 : .25 };
  switch (i) {
    case 0: return m ? { dist: 4.6, ox: 0, oy: .42, spin: .06, pitch: .15 } : { dist: 3.5, ox: .42 * s, oy: .02, spin: .06, pitch: .15 };
    case 1: return m ? { dist: 5.6, ox: 0, oy: .42, spin: .09, pitch: .5 } : { dist: 4.0, ox: .38 * s, oy: 0, spin: .09, pitch: .5 };
    case 2: return adOpen ? { dist: 1.9, ox: 0, oy: 0, spin: .035, pitch: .1 } : { dist: m ? 4.2 : 3.5, ox: 0, oy: 0, spin: .035, pitch: .1 };
    case 3:
      // a logo turns gently instead of spinning, so it never goes edge-on
      if (XFORM[xsel].startsWith('logo:')) return m ? { dist: 4.4, ox: 0, oy: .52, spin: 0, sway: .38, pitch: 0 } : { dist: 3.4, ox: .24 * s, oy: .22, spin: 0, sway: .42, pitch: 0 };
      return m ? { dist: 5.8, ox: 0, oy: .5, spin: .1, pitch: .3 } : { dist: 5.2, ox: .1 * s, oy: .26, spin: .1, pitch: .3 };
    case 4: return m ? { dist: 5.2, ox: 0, oy: .42, spin: .12, pitch: .3 } : { dist: 5.9, ox: 0, oy: .36, spin: 0, sway: .32, pitch: .22 };
    default: return { dist: m ? 5 : 4.6, ox: 0, oy: m ? .1 : .04, spin: 0, sway: .22, pitch: 0 };
  }
}
const formFor = i => ['halo', VFORM[verb], 'ad', XFORM[xsel], isMobile() ? (brand ? 'vexo' : 'vexo') : 'duo', 'ring'][i];
const tintFor = i => (i === 2 ? '#8f9bff' : i === 3 ? XTINT[xsel] : i === 4 ? '#99f9ea' : '#aebbd6');
function refresh(fast) { if (idx < 0) return; cloud.morph(formFor(idx), camFor(idx), fast); R.style.setProperty('--tint', tintFor(idx)); }

const numEl = $('#num');
let cntRaf = 0;
function runCount() {
  cancelAnimationFrame(cntRaf);
  if (reduce) { numEl.textContent = '2500+'; return; }
  const t0 = performance.now() + 500;
  const step = now => { const c = clamp((now - t0) / 1900), e = 1 - Math.pow(1 - c, 4); numEl.textContent = c >= 1 ? '2500+' : Math.round(e * 2500).toLocaleString('en-US'); if (c < 1) cntRaf = requestAnimationFrame(step); };
  step(t0);
}

function go(i, force) {
  i = Math.max(0, Math.min(scenes.length - 1, i));
  if ((i === idx && !force) || !entered || (busy && !force)) return;
  busy = true; setTimeout(() => { busy = false; }, reduce ? 50 : 650);
  const old = scenes[idx];
  if (old && old !== scenes[i]) { old.classList.remove('on'); old.classList.add('out'); old.setAttribute('aria-hidden', 'true'); old.inert = true; setTimeout(() => old.classList.remove('out'), 450); }
  if (idx === 2 && i !== 2) setAd(false, true);
  idx = i;
  const sc = scenes[i]; sc.classList.add('on'); sc.removeAttribute('aria-hidden'); sc.inert = false;
  refresh(false);
  if (i === 2) runCount();
  paintNav();
  $('#live').textContent = `${i + 1} / ${scenes.length}: ${sceneName(i)}`;
  closeSheet();
  syncUrl();
}
function paintNav() {
  $$('#rail button, #sheetL button').forEach(b => b.setAttribute('aria-current', +b.dataset.go === idx));
  const last = idx === scenes.length - 1;
  $('#prev').disabled = $('#mPrev').disabled = idx <= 0;
  $('#nextL').textContent = sceneName(last ? 0 : idx + 1);
  $('#mIdx').textContent = `0${idx + 1} / 0${scenes.length}`; $('#mLab').textContent = sceneName(idx);
}
const next = () => go(idx === scenes.length - 1 ? 0 : idx + 1);
const prev = () => go(idx - 1);

function buildNav() {
  let h = '', s = '';
  scenes.forEach((_, i) => {
    const c = i === 2 ? ' class="ltr"' : '', item = `<b>0${i + 1}</b><span${c}>${sceneName(i)}</span>`;
    h += `<li><button type="button" data-go="${i}">${item}</button></li>`;
    s += `<li><button type="button" data-go="${i}">${item}</button></li>`;
  });
  $('#rail').innerHTML = h; $('#sheetL').innerHTML = s;
}
D.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-go]'); if (b) go(+b.dataset.go); });
$('#next').addEventListener('click', next); $('#mNext').addEventListener('click', next);
$('#prev').addEventListener('click', prev); $('#mPrev').addEventListener('click', prev);
const sheet = $('#sheet');
function closeSheet() { sheet.classList.remove('open'); }
$('#mNow').addEventListener('click', () => sheet.classList.toggle('open'));
sheet.addEventListener('click', e => { if (e.target === sheet) closeSheet(); });

/* 02: what I do */
function setVerb(v, quiet) {
  verb = v; $$('#verbs button').forEach((b, i) => b.setAttribute('aria-pressed', i === v));
  const say = $('#say'); say.classList.add('sw'); say.firstChild.textContent = t('y' + v); void say.offsetWidth; say.classList.remove('sw');
  if (!quiet && idx === 1) refresh(true);
}
$('#verbs').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setVerb(+b.dataset.v); });

/* 03: Zucks Bot */
function setAd(open, quiet) {
  adOpen = open; scenes[2].classList.toggle('open', open);
  const btn = $('#adBtn'); btn.setAttribute('aria-expanded', open); btn.firstChild.textContent = t(open ? 'a6' : 'a5');
  $('#adMore').inert = !open; if (!quiet && idx === 2) cloud.setCam(camFor(2));
}
$('#adBtn').addEventListener('click', () => setAd(!adOpen));
let live = null;
function paintSource() {
  $('#adsrc').textContent = live ? t('live').replace('{n}', live.members.toLocaleString('en-US')).replace('{o}', live.online.toLocaleString('en-US')) : t('a3');
  $('#ptcap').textContent = t('pc').replace('{n}', PER);
}

/* 04: experience */
const arrow = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 9l6-6M4 3h5v5"/></svg>';
const XL = [
  { logo: '<img src="images/zucksbot.gif" width="256" height="256" alt="">', name: 'Zucks Bot', links: [['zucks', 'https://zuck.ddns.net/en', 'open'], ['discord.gg/zucks', 'https://discord.gg/zucks', 'join']] },
  { logo: '<img class="raw" src="images/zucksbot.gif" width="140" height="37" alt="zucks">', name: 'zucks', links: [['zucksbot', 'https://zuck.ddns.net/en', 'open'], ['discord.gg/zucks', 'https://discord.gg/zucks', 'join']] },
  { key: 'o2', links: [] },
  { key: 'o3', links: [] },
  { logo: '<img class="raw" src="images/vexo.png" width="168" height="168" alt="">', name: 'vexo', links: [['vexo.ddns.net', 'https://vexo.ddns.net/', 'open'], ['discord.gg/jy7Fk2ynEy', 'https://discord.gg/jy7Fk2ynEy', 'join']] },
  { logo: '<img class="sq" src="images/vexo.png" width="192" height="192" alt="">', name: 'vexo', links: [['vexo.ddns.net', 'https://vexo.ddns.net/', 'open'], ['discord.gg/jy7Fk2ynEy', 'https://discord.gg/jy7Fk2ynEy', 'join']] }
];
function setX(x, quiet) {
  xsel = x; $$('#xl button').forEach((b, i) => b.setAttribute('aria-pressed', i === x));
  const d = XL[x];
  let h = (d.logo ? `<div class="logo">${d.logo}</div>` : '') + `<p class="kick">${t('r' + Math.min(x, 4))}</p><h3${d.name ? ' class="ltr"' : ''}>${d.name || t(d.key)}</h3><p class="w">${t('d' + x)}</p>`;
  if (d.links.length) h += '<p class="go">' + d.links.map(l => `<a class="ltr" href="${l[1]}" target="_blank" rel="noopener" data-cur="${l[2]}">${l[0]}${arrow}</a>`).join('') + '</p>';
  const box = $('#xd'), inn = $('#xdIn'); box.classList.add('sw'); inn.innerHTML = h; void box.offsetWidth; box.classList.remove('sw');
  if (!quiet && idx === 3) { refresh(true); syncUrl(); }
}
$('#xl').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setX(+b.dataset.x); });

/* 05: current work */
function setBrand(b, quiet) {
  brand = b; $$('#tabs button').forEach((n, i) => n.setAttribute('aria-pressed', i === b));
  const m = isMobile(); $('#bV').hidden = m && b === 1; $('#bR').hidden = m && b === 0;
  if (!quiet && idx === 4) refresh(true);
}
$('#tabs').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setBrand(+b.dataset.b); });

/* 06: contact */
function copy(label) {
  const text = $('#handle').textContent.trim();
  const done = () => { label.textContent = t('copied'); setTimeout(() => { label.textContent = t('copy'); }, 1600); };
  const pick = () => { const r = D.createRange(); r.selectNodeContents($('#handle')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); };
  try { navigator.clipboard.writeText(text).then(done, pick); } catch (e) { pick(); }
}
$('#copy').addEventListener('click', () => copy($('#copy')));

/* ================= language ================= */
function setLang(l) {
  lang = l; rtl = l === 'ar'; R.lang = l; R.dir = rtl ? 'rtl' : 'ltr';
  $$('[data-t]').forEach(n => { n.textContent = t(n.dataset.t); });
  $$('[data-ta]').forEach(n => n.setAttribute(n.tagName === 'IMG' ? 'alt' : 'aria-label', t(n.dataset.ta)));
  $$('[data-lang]').forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === l));
  buildNav(); paintSource(); setVerb(verb, true); setX(xsel, true); setAd(adOpen, true); setBrand(brand, true);
  if (idx >= 0) { paintNav(); cloud.invalidate(); refresh(true); }
  store('zucks-lang', l);
}
$$('[data-lang]').forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang)));

/* ================= input ================= */
D.addEventListener('keydown', e => {
  if (!entered) { if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') { e.preventDefault(); enter(); } return; }
  const tag = (e.target.tagName || '').toLowerCase();
  if (e.key === 'Escape') { if (sheet.classList.contains('open')) closeSheet(); else if (adOpen) setAd(false); return; }
  if (e.key === 'ArrowRight') rtl ? prev() : next();
  else if (e.key === 'ArrowLeft') rtl ? next() : prev();
  else if (e.key === 'PageDown') next();
  else if (e.key === 'PageUp') prev();
  else if (e.key === 'Enter' && tag !== 'button' && tag !== 'a') next();
});
let tsx = 0, tsy = 0, tst = 0;
D.addEventListener('touchstart', e => { tsx = e.touches[0].clientX; tsy = e.touches[0].clientY; tst = Date.now(); }, { passive: true });
D.addEventListener('touchend', e => {
  if (!entered) return;
  const dx = e.changedTouches[0].clientX - tsx, dy = e.changedTouches[0].clientY - tsy;
  if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.8 && Date.now() - tst < 600) { if ((dx < 0) !== rtl) next(); else prev(); }
}, { passive: true });
// a deliberate wheel flick also steps scenes; a convenience, never required
let wheelLock = 0;
window.addEventListener('wheel', e => {
  if (!entered) return;
  const sc = scenes[idx]; if (sc && sc.scrollHeight > sc.clientHeight + 4) return;
  const now = Date.now(); if (now < wheelLock || Math.abs(e.deltaY) < 40) return;
  wheelLock = now + 1100; if (e.deltaY > 0) { if (idx < scenes.length - 1) next(); } else prev();
}, { passive: true });

const curEl = $('#cur'), curT = $('#curT');
let cxp = -100, cyp = -100, ccx = -100, ccy = -100;
if (fine) {
  window.addEventListener('mousemove', e => { cxp = e.clientX; cyp = e.clientY; cloud.pointer(e.clientX / innerWidth * 2 - 1, e.clientY / innerHeight * 2 - 1); if (!reduce) curEl.classList.add('onn'); }, { passive: true });
  D.addEventListener('mouseleave', () => curEl.classList.remove('onn'));
  D.addEventListener('mouseover', e => {
    const n = e.target.closest ? e.target.closest('[data-cur]') : null, h = e.target.closest ? e.target.closest('a,button') : null;
    curEl.classList.toggle('hov', !!h && !n);
    if (n) { curT.textContent = t(n.dataset.cur); curEl.classList.add('lab'); } else curEl.classList.remove('lab');
  });
  if (!reduce) [$('#next'), $('#copy'), $('#enter')].forEach(b => {
    b.addEventListener('mousemove', e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${((e.clientX - r.left - r.width / 2) * .22).toFixed(1)}px,${((e.clientY - r.top - r.height / 2) * .32).toFixed(1)}px)`; });
    b.addEventListener('mouseleave', () => { b.style.transform = ''; });
  });
}
window.addEventListener('deviceorientation', e => { if (reduce || e.gamma == null) return; cloud.pointer(clamp((e.gamma + 30) / 60) * 2 - 1, clamp((e.beta - 20) / 60) * 2 - 1); }, { passive: true });

/* ================= render loop ================= */
let hidden = false;
D.addEventListener('visibilitychange', () => { hidden = D.hidden; });
function paintCenter(c) { R.style.setProperty('--cx', ((c.ox * .5 + .5) * innerWidth).toFixed(1) + 'px'); R.style.setProperty('--cy', ((.5 - c.oy * .5) * innerHeight).toFixed(1) + 'px'); }
function loop(ts) {
  if (!hidden) paintCenter(cloud.draw(ts));
  if (fine) { ccx += (cxp - ccx) * .22; ccy += (cyp - ccy) * .22; curEl.style.transform = `translate3d(${ccx.toFixed(1)}px,${ccy.toFixed(1)}px,0)`; }
  requestAnimationFrame(loop);
}

/* ================= live data written by the server every few minutes ================= */
function loadLive() {
  fetch('/live/discord.json', { cache: 'no-cache' }).then(r => (r.ok ? r.json() : null)).then(j => {
    if (!j) return;
    if (j.members > 0) { live = { members: j.members, online: j.online || 0 }; paintSource(); }
    if (j.avatar) $$('img[data-live]').forEach(img => {
      const probe = new Image();
      probe.onload = () => { img.src = probe.src; };
      probe.src = img.dataset.live + '?v=' + encodeURIComponent(j.avatar);
    });
  }).catch(() => {});
}

/* ================= opening ================= */
function enter() {
  if (entered) return; entered = true;
  try { sessionStorage.setItem('zucks-seen', '1'); } catch (e) {}
  $('#intro').classList.add('gone'); R.classList.add('in');
  const r = routeFrom(location.pathname, location.hash);
  if (r && (r[0] > 0)) applyRoute(r); else go(0, true);
}
function opening() {
  let seen = false; try { seen = sessionStorage.getItem('zucks-seen') === '1'; } catch (e) {}
  'Zucks'.split('').forEach((ch, i) => { const s = D.createElement('span'); s.textContent = ch; s.style.setProperty('--i', i); s.setAttribute('aria-hidden', 'true'); $('#introN').appendChild(s); });
  cloud.init('spark');
  if (reduce || seen || location.hash.length > 1 || location.pathname.length > 1) { enter(); return; }
  $('#intro').addEventListener('click', enter);
}

/* ================= start ================= */
scenes.forEach(s => { s.setAttribute('aria-hidden', 'true'); s.inert = true; });
cloud.resize(isMobile());
setLang(store('zucks-lang') === 'ar' ? 'ar' : 'en');
let wasMobile = isMobile();
window.addEventListener('resize', () => {
  cloud.resize(isMobile());
  if (idx >= 0) { setBrand(brand, true); if (wasMobile !== isMobile()) cloud.invalidate(); wasMobile = isMobile(); refresh(true); }
  if (reduce) paintCenter(cloud.draw(0));
});
loadLive();

/* ================= logos as point clouds, sampled from the official files ================= */
// [key, file, width in scene units, crop to a circle]; colours and shapes come straight from the logo pixels.
// Drop the files into assets/img/ and the formations turn into the real logos. Missing files fall back to a built-in formation.
const LOGOS = [['ad', 'images/zucksbot.gif', 1.6, true], ['zucks', 'assets/img/zucks.svg', 2.5], ['vexo', 'assets/vexo.png', 1.55], ['vexo', 'images/vexo.png', 2.3]];
function sampleLogo([key, src, width, round]) {
  const img = new Image();
  img.src = src;
  return img.decode().then(() => {
    const iw = img.naturalWidth || 256, ih = img.naturalHeight || 256, S = 260;
    const w = S, h = Math.max(1, Math.round(S * ih / iw)), cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const x = cv.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0, w, h);
    const d = x.getImageData(0, 0, w, h).data, out = [], unit = width / w;
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
      const o = (yy * w + xx) * 4; if (d[o + 3] < 140) continue;
      // a square image of a round logo: keep only the circle
      if (round && Math.hypot(xx - w / 2 + .5, yy - h / 2 + .5) > w * .49) continue;
      // light parts of a logo (faces, wordmarks) get more points than its background, so the shape reads clearly
      const L = (d[o] * .3 + d[o + 1] * .59 + d[o + 2] * .11) / 255;
      const copies = L > .72 ? 3 : L > .5 ? 2 : (xx + yy) % 2 ? 1 : 0;
      for (let k = 0; k < copies; k++) out.push((xx - w / 2) * unit, (h / 2 - yy) * unit, d[o] / 255, d[o + 1] / 255, d[o + 2] / 255);
    }
    cloud.addShape(key, new Float32Array(out));
    if (idx === 3 && XFORM[xsel] === 'logo:' + key) { cloud.invalidate(); refresh(true); }
  }).catch(() => {});
}
LOGOS.forEach(sampleLogo);
opening();
if (reduce) paintCenter(cloud.draw(0)); else requestAnimationFrame(loop);
