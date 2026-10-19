/**
 * Copy the website tools into the extension so they run offline.
 * Tracker and ad scripts are removed. The live site files are not modified.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';

const here = path.dirname(fileURLToPath(import.meta.url));
const extensionRoot = path.resolve(here, '..');
const siteRoot = path.resolve(extensionRoot, '..');
const siteOut = path.join(extensionRoot, 'public', 'site');
const vendorOut = path.join(extensionRoot, 'public', 'vendor');

const catalog = JSON.parse(fs.readFileSync(path.join(siteRoot, 'tools.json'), 'utf8'));

function stripTrackers(html) {
  return html
    .replace(/<!-- ANALYTICS:[\s\S]*?-->/g, '')
    .replace(/<!-- CONSENT:[\s\S]*?-->/g, '')
    .replace(/<!-- AD-SCRIPT -->/g, '')
    .replace(/<script\b[^>]*>\s*window\.goatcounter[\s\S]*?<\/script>/gi, '')
    .replace(/<script\b[^>]*\bsrc="[^"]*(?:googlesyndication|goatcounter|gc\.zgo\.at|google-analytics|googletagmanager)[^"]*"[^>]*>\s*<\/script>/gi, '');
}

function banner(tool) {
  const url = tool.url || `https://greaterworldmedia.tech/${tool.id}/`;
  return `<p class="gwb-ext-banner noprint" style="margin:0;padding:10px 16px;background:#15123a;color:#fff;text-align:center;font:600 15px system-ui,sans-serif">Running inside GWB Tools. <a href="${url}" style="color:#fff;font-weight:800" target="_blank" rel="noopener">Open the full website version</a></p>`;
}

fs.rmSync(siteOut, { recursive: true, force: true });
fs.mkdirSync(siteOut, { recursive: true });
fs.rmSync(vendorOut, { recursive: true, force: true });
fs.mkdirSync(vendorOut, { recursive: true });

for (const file of ['style.css', 'safe.js', 'helper.js']) {
  fs.copyFileSync(path.join(siteRoot, file), path.join(siteOut, file));
}
fs.cpSync(path.join(siteRoot, 'vendor'), path.join(siteOut, 'vendor'), { recursive: true });
for (const file of ['qrcode.js', 'jspdf.umd.min.js', 'xlsx.mini.min.js', 'pdf-lib.min.js']) {
  fs.copyFileSync(path.join(siteRoot, 'vendor', file), path.join(vendorOut, file));
}

const bridge = `/* Extension-only: line items passed in ?gwbitems= when Pro prefills an invoice. */
(function () {
  var raw = new URLSearchParams(location.search).get('gwbitems');
  if (!raw || typeof addRow !== 'function') return;
  var items;
  try { items = JSON.parse(raw); } catch (e) { return; }
  if (!Array.isArray(items)) return;
  var table = document.getElementById('items');
  if (!table) return;
  Array.prototype.slice.call(table.rows, 1).forEach(function (row) { row.remove(); });
  items.forEach(function (item) { addRow(String(item.d || 'Item'), Number(item.q) || 1, Number(item.p) || 0); });
})();
`;

for (const tool of catalog.tools) {
  const from = path.join(siteRoot, tool.id);
  const to = path.join(siteOut, tool.id);
  fs.cpSync(from, to, { recursive: true });
  const htmlPath = path.join(to, 'index.html');
  if (!fs.existsSync(htmlPath)) continue;
  let html = stripTrackers(fs.readFileSync(htmlPath, 'utf8'));
  html = html.replace(/<body>/i, `<body>${banner(tool)}`);
  if (tool.id === 'invoice') {
    fs.writeFileSync(path.join(to, 'gwb-bridge.js'), bridge);
    html = html.replace(/<\/body>/i, '<script src="gwb-bridge.js"></script></body>');
  }
  fs.writeFileSync(htmlPath, html);
}

await esbuild.build({
  entryPoints: [path.join(extensionRoot, 'src', 'injected', 'main.ts')],
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: 'es2022',
  outfile: path.join(extensionRoot, 'public', 'injected', 'read-page.js'),
  legalComments: 'none',
});

console.log(`Vendored ${catalog.tools.length} tools into public/site`);
