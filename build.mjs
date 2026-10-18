import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import JavaScriptObfuscator from 'javascript-obfuscator';

const root = path.dirname(fileURLToPath(import.meta.url));
const dist = process.env.ZUCKS_BUILD_DIR
  ? path.resolve(root, process.env.ZUCKS_BUILD_DIR)
  : path.join(root, 'dist');
const assets = path.join(dist, 'assets');

await rm(dist, { recursive: true, force: true });
await mkdir(assets, { recursive: true });

const script = await build({
  absWorkingDir: root,
  entryPoints: ['js/app.js'],
  bundle: true,
  minify: true,
  sourcemap: false,
  legalComments: 'none',
  write: false,
  target: ['es2020'],
  format: 'iife',
});
const obfuscated = JavaScriptObfuscator.obfuscate(script.outputFiles[0].text, {
  // --- layout ---
  compact: true,
  simplify: true,

  // --- control flow ---
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.5,

  // --- dead code injection (adds fake unreachable paths) ---
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.3,

  // --- identifier renaming ---
  identifierNamesGenerator: 'hexadecimal',
  renameGlobals: false,
  renameProperties: false,          // keep DOM APIs intact

  // --- string obfuscation ---
  splitStrings: true,
  splitStringsChunkLength: 5,
  stringArray: true,
  stringArrayEncoding: ['base64', 'rc4'],
  stringArrayThreshold: 0.85,
  stringArrayWrappersCount: 3,
  stringArrayWrappersChainedCalls: true,
  stringArrayWrappersParametersMaxCount: 5,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayIndexesType: ['hexadecimal-number', 'hexadecimal-numeric-string'],

  // --- number & object obfuscation ---
  numbersToExpressions: true,
  transformObjectKeys: true,
  unicodeEscapeSequence: false,      // keep file size reasonable

  // --- anti-debugging ---
  disableConsoleOutput: true,        // silences console.log / warn / error
  debugProtection: true,             // makes DevTools extremely slow to open
  debugProtectionInterval: 4000,     // re-triggers the trap every 4 seconds
  selfDefending: true,               // code breaks if reformatted/prettified

  // --- source map ---
  sourceMap: false,
});
await writeFile(path.join(assets, 'site.js'), obfuscated.getObfuscatedCode(), 'utf8');

await build({
  absWorkingDir: root,
  entryPoints: ['style.css'],
  bundle: true,
  minify: true,
  sourcemap: false,
  legalComments: 'none',
  loader: { '.jpg': 'file' },
  assetNames: 'images/[name]-[hash]',
  outfile: path.join(dist, 'style.css'),
});

let html = await readFile(path.join(root, 'index.html'), 'utf8');
html = html.replace('<script type="module" src="js/app.js"></script>', '<script defer src="assets/site.js"></script>');
await writeFile(path.join(dist, 'index.html'), html, 'utf8');
await cp(path.join(root, 'images'), path.join(dist, 'images'), { recursive: true });

console.log(`Production site built in ${dist}`);
console.log('Original js/ source files and source maps are not copied to dist.');
