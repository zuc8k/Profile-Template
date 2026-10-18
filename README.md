# Zucks — Community Builder

A single-page portfolio in the style of ra3d.me: one body of points that rearranges
into every scene, no page scroll — scenes are states, changed by click, key or swipe.

## Build and run

```bash
npm install
npm run build            # bundles and obfuscates browser JavaScript into dist/
python serve.py           # http://127.0.0.1:8765 (serves dist/ when present)
```

The production build omits the original `js/` modules and source maps from the
served `dist/` directory, and bundles/minifies CSS. This only makes browser code
harder to read; anything sent to a browser can still be downloaded and studied.

Any static server with SPA rewrites works (`npx serve -s`, nginx `try_files`, etc.).
ES modules need HTTP — opening `index.html` via `file://` will not work.

The local server listens only on `127.0.0.1:8765`; public traffic is proxied by a
dedicated nginx virtual host for `zucks.ddns.net`.



## Template-En

![Zucks English Template](./Template/zucks-en.webp)

## The transitions

- **Point cloud** (`js/cloud.js`): 20,000 points (8,000 on mobile) in WebGL.
  Each scene morphs the same points into a new formation — halo, lattice, rings,
  grow, connect, wave, ad, duo, ring. Points fly along arcs (`sin(t·π)` offset),
  staggered per-point by a seeded random, with a gold flash mid-transition and a
  camera that spins/sways per scene. Falls back to a thinned 2D canvas without WebGL.
- **Scenes** (`js/app.js`): `.sc` sections swap with `.on` / `.out` classes; text
  staggers in via `--d` delay steps; headings reveal through masked lines (`.m > span`).
- **Input**: click rail/next/prev, arrow keys, PgUp/PgDn, Enter, wheel flick
  (1.1 s lock), horizontal swipe, mobile bar + sheet menu.
- **Extras**: EN/AR with full RTL, custom cursor with labels, magnetic buttons,
  200k counter, clean URLs (`/what-i-do`, `/vetox` ...) with `history.pushState`,
  `prefers-reduced-motion` respected, intro skipped on repeat visits.

## Customize

- **Text**: edit `data-t` strings in `index.html` (English) and `js/i18n.js` (Arabic + extras).
- **Formations**: `formFor(i)` in `js/app.js` maps scene index → formation name;
  new formations are just functions in `F` inside `js/cloud.js`.
- **Logo point-clouds**: drop `arabic-discord.webp`, `probot.svg`, `vetox.webp`,
  `rize.svg` into `assets/img/` and the experience scene morphs into the real logos
  (sampled pixel-by-pixel at load). Missing files fall back to built-in formations.
- **Live Discord counts**: serve `/live/discord.json` (`{ "members": N, "online": N, "avatar": "hash" }`)
  and scene 3 + the avatar update automatically.
- **Colors**: `--bg`, `--gold`, `--tint`, `--ink` in `style.css`.

Fonts: Geist (MIT, jsDelivr), Bricolage Grotesque + IBM Plex Sans Arabic (OFL, Google Fonts).
