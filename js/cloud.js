// The point cloud: one fixed set of points that rearranges into a new formation per scene.
// WebGL when available, a thinned-out 2D canvas otherwise.

const TAU = Math.PI * 2;
const clamp = v => (v < 0 ? 0 : v > 1 ? 1 : v);

const SILVER = [.60, .68, .88], GOLD = [.89, .81, .60], ADC = [.50, .55, 1], PBC = [.46, .44, 1],
  VXC = [.16, .50, 1], RZC = [.60, .98, .92], WARM = [.95, .78, .62], ROSE = [.93, .66, .80];

export function createCloud(canvas, { count, reduce, isRtl }) {
  const N = count;

  /* ---------- seeded random, so every formation looks the same on every visit ---------- */
  let seed = 1337;
  const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let x = Math.imul(seed ^ seed >>> 15, 1 | seed); x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296; };
  const gs = () => (rnd() + rnd() + rnd() + rnd() - 2) * .87;
  const sph = (r, o, i) => { const u = rnd() * 2 - 1, a = rnd() * TAU, s = Math.sqrt(1 - u * u); o[i] = r * s * Math.cos(a); o[i + 1] = r * u; o[i + 2] = r * s * Math.sin(a); };
  const fib = (k, n, r) => { const y = 1 - (k + .5) / n * 2, s = Math.sqrt(1 - y * y), a = k * 2.39996; return [r * s * Math.cos(a), r * y, r * s * Math.sin(a)]; };
  const tint = (c, col, k) => { for (let i = 0; i < N; i++) { const b = .45 + rnd() * .75, s = rnd() < k ? GOLD : col; c[i * 3] = s[0] * b; c[i * 3 + 1] = s[1] * b; c[i * 3 + 2] = s[2] * b; } };

  /* ---------- logo shapes: point positions and colours sampled from logo files ---------- */
  const shapes = {};
  function shape(p, c, pts) {
    const n = pts.length / 5;
    for (let i = 0; i < N; i++) {
      const k = Math.floor(rnd() * n) * 5, edge = i % 7 === 0;
      p[i * 3] = pts[k] + gs() * .006; p[i * 3 + 1] = pts[k + 1] + gs() * .006;
      // a thin slab with a little depth, so the logo reads as an object when it turns
      p[i * 3 + 2] = edge ? gs() * .12 : (rnd() - .5) * .07;
      const b = edge ? .4 : .8 + rnd() * .35;
      c[i * 3] = pts[k + 2] * b; c[i * 3 + 1] = pts[k + 3] * b; c[i * 3 + 2] = pts[k + 4] * b;
    }
  }

  /* ---------- formations ---------- */
  const F = {
    spark(p, c) { for (let i = 0; i < N; i++) { p[i * 3] = gs() * .035; p[i * 3 + 1] = gs() * .035; p[i * 3 + 2] = gs() * .035; } tint(c, GOLD, 1); },
    halo(p, c) { for (let i = 0; i < N; i++) sph(i % 10 < 7 ? 1 + gs() * .025 : 1.12 + rnd() * .85, p, i * 3); tint(c, SILVER, .07); },
    lattice(p, c) { const g = Math.ceil(Math.cbrt(N)); for (let i = 0; i < N; i++) { p[i * 3] = ((i % g) / (g - 1) - .5) * 1.75; p[i * 3 + 1] = ((Math.floor(i / g) % g) / (g - 1) - .5) * 1.75; p[i * 3 + 2] = (Math.floor(i / g / g) / (g - 1) - .5) * 1.75; } tint(c, SILVER, .05); },
    rings(p, c) { const K = 14; for (let i = 0; i < N; i++) { const k = Math.floor(Math.sqrt(rnd()) * K), r = .22 + k * .085, a = rnd() * TAU; p[i * 3] = r * Math.cos(a); p[i * 3 + 1] = gs() * .004 + (k % 2 ? .05 : -.05) * (k / K); p[i * 3 + 2] = r * Math.sin(a); } tint(c, SILVER, .05); },
    grow(p, c) {
      for (let i = 0; i < N; i++) { const f = i / N, r = Math.sqrt(f) * 1.45, a = i * 2.39996; p[i * 3] = r * Math.cos(a); p[i * 3 + 1] = Math.pow(1 - f, 3) * .9 - .25; p[i * 3 + 2] = r * Math.sin(a); }
      for (let i = 0; i < N; i++) { const b = .4 + (1 - i / N) * .9, s = i < N * .06 ? GOLD : SILVER; c[i * 3] = s[0] * b; c[i * 3 + 1] = s[1] * b; c[i * 3 + 2] = s[2] * b; }
    },
    connect(p, c) {
      const K = 14, H = [], E = [];
      for (let k = 0; k < K; k++) H.push(fib(k, K, 1.05));
      for (let k = 0; k < K; k++) {
        const ds = [];
        for (let j = 0; j < K; j++) if (j !== k) ds.push([Math.hypot(H[k][0] - H[j][0], H[k][1] - H[j][1], H[k][2] - H[j][2]), j]);
        ds.sort((a, b) => a[0] - b[0]);
        for (let j = 0; j < 3; j++) E.push([k, ds[j][1]]);
      }
      for (let i = 0; i < N; i++) {
        if (i % 20 < 11) { const h = H[i % K]; p[i * 3] = h[0] + gs() * .085; p[i * 3 + 1] = h[1] + gs() * .085; p[i * 3 + 2] = h[2] + gs() * .085; }
        else { const e = E[Math.floor(rnd() * E.length)], u = rnd(), A = H[e[0]], B = H[e[1]]; for (let d = 0; d < 3; d++) p[i * 3 + d] = A[d] + (B[d] - A[d]) * u + gs() * .006; }
      }
      tint(c, SILVER, .06);
    },
    wave(p, c) { for (let i = 0; i < N; i++) { const k = Math.floor(rnd() * 16), r = .12 + k * .095 + gs() * .004, a = rnd() * TAU; p[i * 3] = r * Math.cos(a); p[i * 3 + 1] = .16 * Math.sin(r * 9) * (1 - r / 1.9); p[i * 3 + 2] = r * Math.sin(a); } tint(c, SILVER, .05); },
    ad(p, c, sc = 1) {
      const K = 240, H = [];
      for (let k = 0; k < K; k++) { const o = [0, 0, 0]; sph(Math.pow(rnd(), .42) * 2.1, o, 0); H.push(o); }
      for (let i = 0; i < N; i++) {
        if (i % 4) { const h = H[Math.floor(Math.pow(rnd(), 1.4) * K)], s = .05 + rnd() * .09; for (let d = 0; d < 3; d++) p[i * 3 + d] = (h[d] + gs() * s) * sc; }
        else sph(Math.pow(rnd(), .5) * 2.6 * sc, p, i * 3);
      }
      for (let i = 0; i < N; i++) { const b = .55 + rnd() * .95, w = rnd(), q = w < .05 ? GOLD : w < .5 ? SILVER : ADC; c[i * 3] = q[0] * b; c[i * 3 + 1] = q[1] * b; c[i * 3 + 2] = q[2] * b; }
    },
    community(p, c) { F.ad(p, c, .42); },
    probot(p, c) {
      const L = 19, per = Math.floor(N / L);
      for (let i = 0; i < N; i++) {
        if (i % 16 === 0) { p[i * 3] = gs() * .01; p[i * 3 + 1] = (rnd() * 2 - 1) * 1.05; p[i * 3 + 2] = gs() * .01; }
        else { const l = i % L, a = (Math.floor(i / L) / per) * TAU * (l % 2 ? 1 : -1) + l * .3, r = .72 + (l % 3 === 0 ? .1 : 0); p[i * 3] = r * Math.cos(a); p[i * 3 + 1] = (l / (L - 1) - .5) * 1.9; p[i * 3 + 2] = r * Math.sin(a); }
      }
      tint(c, PBC, .04);
    },
    creators(p, c) {
      const K = 5, ax = [];
      for (let k = 0; k < K; k++) { const o = [0, 0, 0]; sph(1, o, 0); ax.push(o); }
      for (let i = 0; i < N; i++) {
        const k = i % K, a0 = k / K * TAU, hx = Math.cos(a0) * .9, hy = Math.sin(a0) * .9, hz = k % 2 ? .18 : -.18;
        if (i % 7 === 0) { p[i * 3] = hx + gs() * .03; p[i * 3 + 1] = hy + gs() * .03; p[i * 3 + 2] = hz + gs() * .03; continue; }
        const rr = .13 + Math.floor(rnd() * 4) * .085, a = rnd() * TAU, n = ax[k];
        let ux = -n[1], uy = n[0]; const ul = Math.hypot(ux, uy) || 1; ux /= ul; uy /= ul;
        const vx = -n[2] * uy, vy = n[2] * ux, vz = n[0] * uy - n[1] * ux;
        p[i * 3] = hx + rr * (Math.cos(a) * ux + Math.sin(a) * vx); p[i * 3 + 1] = hy + rr * (Math.cos(a) * uy + Math.sin(a) * vy); p[i * 3 + 2] = hz + rr * Math.sin(a) * vz;
      }
      tint(c, ROSE, .1);
    },
    pr(p, c) {
      for (let i = 0; i < N; i++) {
        let ang = Math.sqrt(rnd()) * .62, az = rnd() * TAU, tt;
        if (i % 3 === 0) tt = .5 + Math.floor(rnd() * 5) * .42 + gs() * .004;
        else { ang = Math.sqrt((i % 37) / 37) * .62; az = (i % 37) * 2.39996; tt = rnd() * 2.3; }
        p[i * 3] = -1.15 + tt * Math.cos(ang); p[i * 3 + 1] = tt * Math.sin(ang) * Math.cos(az); p[i * 3 + 2] = tt * Math.sin(ang) * Math.sin(az);
      }
      tint(c, WARM, .12);
    },
    vetox(p, c, sx = 0, sc = 1, lo = 0, hi = N) {
      const ed = [[0,0,0,1,0,0],[0,1,0,1,0,0],[0,0,1,1,0,0],[0,1,1,1,0,0],[0,0,0,0,1,0],[1,0,0,0,1,0],[0,0,1,0,1,0],[1,0,1,0,1,0],[0,0,0,0,0,1],[1,0,0,0,0,1],[0,1,0,0,0,1],[1,1,0,0,0,1]];
      for (let i = lo; i < hi; i++) {
        const m = i % 27, e = ed[Math.floor(rnd() * 12)], u = rnd(), s = .34, g = .58;
        const x = (m % 3 - 1) * g + ((e[0] + e[3] * u) - .5) * s, y = (Math.floor(m / 3) % 3 - 1) * g + ((e[1] + e[4] * u) - .5) * s, z = (Math.floor(m / 9) - 1) * g + ((e[2] + e[5] * u) - .5) * s;
        p[i * 3] = x * sc + sx; p[i * 3 + 1] = y * sc; p[i * 3 + 2] = z * sc;
        const b = .7 + rnd() * .9, q = m === 13 ? [.8, .9, 1] : VXC; c[i * 3] = q[0] * b; c[i * 3 + 1] = q[1] * b; c[i * 3 + 2] = q[2] * b;
      }
    },
    rize(p, c, sx = 0, sc = 1, lo = 0, hi = N) {
      // a tournament bracket seen in 3D: 32 entries narrowing to one winner at the top
      const L = 5, ed = [];
      const node = (l, k) => { const cnt = Math.pow(2, l), a = (k + .5) / cnt * TAU, r = l * .27; return [r * Math.cos(a), .95 - l * .42, r * Math.sin(a)]; };
      for (let l = 1; l <= L; l++) for (let k = 0; k < Math.pow(2, l); k++) ed.push([node(l, k), node(l - 1, k >> 1), l]);
      for (let i = lo; i < hi; i++) {
        const e = ed[Math.floor(Math.pow(rnd(), .8) * ed.length)], u = rnd(), A = e[0], B = e[1];
        let x, y, z;
        if (u < .5) { x = A[0]; z = A[2]; y = A[1] + (B[1] - A[1]) * u * 2; } else { const v = (u - .5) * 2; x = A[0] + (B[0] - A[0]) * v; z = A[2] + (B[2] - A[2]) * v; y = B[1]; }
        if (i % 9 === 0) { x = A[0] + gs() * .02; y = A[1] + gs() * .02; z = A[2] + gs() * .02; }
        p[i * 3] = (x + gs() * .004) * sc + sx; p[i * 3 + 1] = (y + gs() * .004) * sc; p[i * 3 + 2] = (z + gs() * .004) * sc;
        const b = .4 + rnd() * .7 + (5 - e[2]) * .12; c[i * 3] = RZC[0] * b; c[i * 3 + 1] = RZC[1] * b; c[i * 3 + 2] = RZC[2] * b;
      }
    },
    duo(p, c) { const h = Math.floor(N / 2), s = isRtl() ? -1 : 1; F.vetox(p, c, -1.5 * s, .78, 0, h); F.rize(p, c, 1.5 * s, .82, h, N); },
    ring(p, c) { for (let i = 0; i < N; i++) { const w = i % 10, r = w < 6 ? 1.2 + gs() * .004 : w < 9 ? 1.2 + Math.abs(gs()) * .5 : 1.75 + gs() * .004, a = rnd() * TAU; p[i * 3] = r * Math.cos(a); p[i * 3 + 1] = r * Math.sin(a); p[i * 3 + 2] = gs() * .01; } tint(c, SILVER, .3); }
  };

  /* ---------- buffers ---------- */
  const pA = new Float32Array(N * 3), pB = new Float32Array(N * 3), cA = new Float32Array(N * 3), cB = new Float32Array(N * 3), rn = new Float32Array(N * 4);
  for (let q = 0; q < N * 4; q++) rn[q] = rnd();
  const ST = .55;
  const tOf = (i, T) => { const x = clamp(T * (1 + ST) - rn[i * 4] * ST); return x * x * (3 - 2 * x); };

  let gl = null, ctx2 = null, U = {}, bufs = [];
  try { gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' }); } catch (e) { gl = null; }
  if (gl) {
    const vs = `attribute vec3 aA,aB,aCA,aCB;attribute vec4 aR;
uniform float uT,uTime,uDist,uAsp,uSize,uFlash;uniform vec2 uRot,uOff;varying vec3 vC;
void main(){
  float t=clamp(uT*1.55-aR.x*.55,0.,1.);t=t*t*(3.-2.*t);
  vec3 p=mix(aA,aB,t);vec3 n=normalize(aR.yzw-.5);
  p+=n*sin(t*3.14159)*(.3+aR.x*.55);p+=n*.014*sin(uTime*(.5+aR.y)+aR.z*40.);
  float cy=cos(uRot.x),sy=sin(uRot.x),cx=cos(uRot.y),sx=sin(uRot.y);
  p=vec3(p.x*cy+p.z*sy,p.y,-p.x*sy+p.z*cy);p=vec3(p.x,p.y*cx-p.z*sx,p.y*sx+p.z*cx);
  float z=uDist-p.z;float k=1.9/max(z,.05);float sc=min(1.,uAsp*1.15);
  gl_Position=z<.08?vec4(3.,3.,0.,1.):vec4(p.x*k*sc/uAsp+uOff.x,p.y*k*sc+uOff.y,0.,1.);
  gl_PointSize=max(1.,uSize*(.45+aR.w)*(1.+uFlash)/z);
  float fade=clamp(1.5-z/(uDist*1.25),.12,1.);vC=mix(aCA,aCB,t)*fade*(1.+uFlash*1.6);
}`;
    const fs = 'precision mediump float;varying vec3 vC;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.08,d);gl_FragColor=vec4(vC*a,1.);}';
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) gl = null;
    else {
      gl.useProgram(pr);
      const attr = (name, data, size, dyn) => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, dyn ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW); const l = gl.getAttribLocation(pr, name); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, size, gl.FLOAT, false, 0, 0); return b; };
      bufs = [[attr('aA', pA, 3, 1), pA], [attr('aB', pB, 3, 1), pB], [attr('aCA', cA, 3, 1), cA], [attr('aCB', cB, 3, 1), cB]];
      attr('aR', rn, 4, 0);
      ['uT', 'uTime', 'uDist', 'uAsp', 'uSize', 'uFlash', 'uRot', 'uOff'].forEach(n => { U[n] = gl.getUniformLocation(pr, n); });
      gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); gl.clearColor(.027, .031, .043, 1);
    }
  }
  if (!gl) {
    // a canvas that already tried WebGL cannot give a 2D context, so swap in a fresh one
    const c2 = document.createElement('canvas'); c2.id = canvas.id; c2.setAttribute('aria-hidden', 'true');
    canvas.replaceWith(c2); canvas = c2; ctx2 = canvas.getContext('2d');
  }
  const upload = () => { if (gl) bufs.forEach(([b, d]) => { gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferSubData(gl.ARRAY_BUFFER, 0, d); }); };

  /* ---------- camera and transition state ---------- */
  let T = 1, tStart = 0, tDur = 1700, form = '', flash = 0, lastTs = 0, yaw = 0, mx = 0, my = 0, px = 0, py = 0;
  let cam = { dist: 2.6, ox: 0, oy: .12, spin: .4, pitch: 0 };
  const cur = { dist: 3.2, ox: 0, oy: .12, pitch: 0 };
  let W = 0, H = 0, dpr = 1, mobile = false;

  function morph(name, c, fast) {
    if (name !== form) {
      // start from wherever the points are right now, so an interrupted transition never jumps
      for (let i = 0; i < N; i++) {
        const k = tOf(i, T), j = i * 3;
        for (let d = 0; d < 3; d++) { pA[j + d] += (pB[j + d] - pA[j + d]) * k; cA[j + d] += (cB[j + d] - cA[j + d]) * k; }
      }
      seed = 4242;
      if (name.startsWith('logo:')) { const pts = shapes[name.slice(5)]; if (pts) shape(pB, cB, pts); else F.community(pB, cB); }
      else F[name](pB, cB);
      upload(); form = name;
      if (reduce) T = 1; else { T = 0; tStart = performance.now(); tDur = fast ? 1250 : 1750; }
    }
    cam = c;
    if (reduce) { Object.assign(cur, { dist: c.dist, ox: c.ox, oy: c.oy, pitch: c.pitch }); draw(0); }
  }
  function setCam(c) { cam = c; if (reduce) { Object.assign(cur, { dist: c.dist, ox: c.ox, oy: c.oy, pitch: c.pitch }); draw(0); } }
  function init(name) { seed = 7; F[name](pA, cA); F[name](pB, cB); upload(); form = name; }
  function resize(isMobile) {
    mobile = isMobile; dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.75); W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    if (gl) gl.viewport(0, 0, canvas.width, canvas.height);
  }
  function pointer(x, y) { mx = x; my = y; }
  function invalidate() { form = ''; }

  function draw(ts) {
    const dt = Math.min(.05, (ts - lastTs) / 1000 || 0); lastTs = ts;
    if (T < 1 && !reduce) { T = clamp((ts - tStart) / tDur); flash = Math.exp(-Math.pow((T - .42) / .13, 2)); } else flash *= .9;
    const k = reduce ? 1 : .055;
    px += (mx - px) * .05; py += (my - py) * .05;
    cur.dist += (cam.dist - cur.dist) * k; cur.ox += (cam.ox - cur.ox) * k; cur.oy += (cam.oy - cur.oy) * k; cur.pitch += (cam.pitch - cur.pitch) * k;
    if (!reduce) {
      if (cam.sway) { let a = yaw % TAU; if (a > Math.PI) a -= TAU; if (a < -Math.PI) a += TAU; yaw = a + (Math.sin(ts / 3800) * cam.sway - a) * .04; }
      else yaw += dt * cam.spin * (1 + flash * 6);
    }
    const ry = yaw + px * .35, rx = cur.pitch + py * .22, dist = cur.dist, asp = W / H;
    if (gl) {
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(U.uT, T); gl.uniform1f(U.uTime, ts / 1000); gl.uniform1f(U.uDist, dist); gl.uniform1f(U.uAsp, asp);
      gl.uniform1f(U.uSize, 5.2 * dpr * (H / 900) * (mobile ? 1.25 : 1)); gl.uniform1f(U.uFlash, flash);
      gl.uniform2f(U.uRot, ry, rx); gl.uniform2f(U.uOff, cur.ox, cur.oy);
      gl.drawArrays(gl.POINTS, 0, N);
    } else {
      ctx2.globalCompositeOperation = 'source-over'; ctx2.fillStyle = '#07080b'; ctx2.fillRect(0, 0, canvas.width, canvas.height); ctx2.globalCompositeOperation = 'lighter';
      const cyy = Math.cos(ry), syy = Math.sin(ry), cxx = Math.cos(rx), sxx = Math.sin(rx), sc = Math.min(1, asp * 1.15);
      for (let i = 0; i < N; i += 5) {
        const j = i * 3, tt = tOf(i, T);
        const x = pA[j] + (pB[j] - pA[j]) * tt, y = pA[j + 1] + (pB[j + 1] - pA[j + 1]) * tt, z = pA[j + 2] + (pB[j + 2] - pA[j + 2]) * tt;
        const x1 = x * cyy + z * syy, z1 = -x * syy + z * cyy, y1 = y * cxx - z1 * sxx, z2 = y * sxx + z1 * cxx, zz = dist - z2;
        if (zz < .08) continue;
        const kk = 1.9 / zz, sx = ((x1 * kk * sc / asp + cur.ox) * .5 + .5) * canvas.width, sy = (.5 - (y1 * kk * sc + cur.oy) * .5) * canvas.height;
        const f = Math.max(.12, Math.min(1, 1.5 - zz / (dist * 1.25)));
        const r = cA[j] + (cB[j] - cA[j]) * tt, g = cA[j + 1] + (cB[j + 1] - cA[j + 1]) * tt, b = cA[j + 2] + (cB[j + 2] - cA[j + 2]) * tt, s = Math.max(1, 5.2 * dpr / zz);
        ctx2.fillStyle = `rgb(${Math.min(255, r * 255 * f | 0)},${Math.min(255, g * 255 * f | 0)},${Math.min(255, b * 255 * f | 0)})`;
        ctx2.fillRect(sx, sy, s, s);
      }
    }
    return cur;
  }

  function addShape(key, pts) { shapes[key] = pts; }
  const hasShape = key => !!shapes[key];

  return { N, morph, addShape, hasShape, setCam, init, resize, pointer, invalidate, draw, get webgl() { return !!gl; } };
}
