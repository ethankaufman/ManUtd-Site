#!/usr/bin/env node
// Visits every page of the built site (the out/ folder, served locally) at desktop and phone widths and reports
// layout problems: horizontal page overflow, text that is cut off, things sticking out of their boxes, broken images
// and console errors. Talks to Chrome directly (no packages).
//
//   node scripts/audit_pages.mjs http://localhost:8766 report.json
import { spawn } from "node:child_process";
import { readdirSync, statSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [base, outFile = "audit.json"] = process.argv.slice(2);
if (!base) {
  console.error("usage: node scripts/audit_pages.mjs <base url> [report.json]");
  process.exit(1);
}
const ROOT = new URL("../out", import.meta.url).pathname;
const routes = [];
(function walk(dir, rel) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, rel + f + "/");
    else if (f === "index.html") routes.push("/" + rel);
  }
})(ROOT, "");
routes.sort();

const CHROME = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const port = 9800 + Math.floor(Math.random() * 100);
const chrome = spawn(CHROME, [`--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), "audit-"))}`, "--headless=new", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--hide-scrollbars", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// runs inside the page
const CHECK = `(() => {
  const out = { overflowX: 0, sticking: [], clipped: [], broken: [], small: [] };
  const vw = window.innerWidth;
  out.overflowX = Math.max(0, document.documentElement.scrollWidth - vw);
  const label = (e) => (e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.split(' ').slice(0, 3).join('.') : '') + ' "' + (e.textContent || '').trim().slice(0, 40) + '"');
  const inScroller = (e) => { for (let p = e.parentElement; p; p = p.parentElement) { const o = getComputedStyle(p).overflowX; if (o === 'auto' || o === 'scroll') return true; } return false; };
  for (const e of document.querySelectorAll('body *')) {
    const r = e.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    const cs = getComputedStyle(e);
    if (cs.position === 'fixed') continue;
    if (r.right > vw + 1 && !inScroller(e) && !e.closest('canvas')) out.sticking.push(label(e) + ' right=' + Math.round(r.right));
    // text that is cut off: a box that clips its own content and the content is wider/taller than the box
    if ((cs.overflowX === 'hidden' || cs.overflow === 'hidden' || cs.textOverflow === 'ellipsis') && e.scrollWidth > e.clientWidth + 1 && e.children.length < 6 && (e.textContent || '').trim()) out.clipped.push(label(e) + ' ' + e.scrollWidth + '>' + e.clientWidth);
    if (e.tagName === 'IMG' && e.complete && e.naturalWidth === 0) out.broken.push(e.getAttribute('src'));
    if (cs.fontSize && parseFloat(cs.fontSize) < 10 && (e.textContent || '').trim() && e.children.length === 0) out.small.push(label(e) + ' ' + cs.fontSize);
  }
  for (const k of ['sticking', 'clipped', 'broken', 'small']) out[k] = [...new Set(out[k])].slice(0, 12);
  return out;
})()`;

const page = await (async () => {
  for (let i = 0; i < 50; i++) {
    try {
      const t = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
      const p = t.find((x) => x.type === "page");
      if (p) return p;
    } catch {}
    await sleep(200);
  }
  throw new Error("Chrome did not start");
})();
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pending = new Map();
const consoleErrors = [];
ws.onmessage = (m) => {
  const d = JSON.parse(m.data);
  if (d.id && pending.has(d.id)) pending.get(d.id)(d);
  else if (d.method === "Runtime.exceptionThrown") consoleErrors.push(d.params.exceptionDetails.text + " " + (d.params.exceptionDetails.exception?.description ?? "").slice(0, 150));
  else if (d.method === "Runtime.consoleAPICalled" && d.params.type === "error") consoleErrors.push(d.params.args.map((a) => a.value ?? a.description ?? "").join(" ").slice(0, 200));
  else if (d.method === "Network.responseReceived" && d.params.response.status >= 400) consoleErrors.push(`HTTP ${d.params.response.status} ${d.params.response.url}`);
};
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
await send("Runtime.enable");
await send("Network.enable");

const results = [];
for (const [width, height, mobile] of [[1280, 900, false], [390, 800, true]]) {
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile });
  for (const route of routes) {
    consoleErrors.length = 0;
    await send("Page.navigate", { url: base + route });
    await sleep(900);
    // scroll through the page so lazy images load
    await send("Runtime.evaluate", { expression: `(async()=>{const h=document.body.scrollHeight;for(let y=0;y<h;y+=700){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,60));}window.scrollTo(0,0);})()`, awaitPromise: true });
    await sleep(500);
    const r = await send("Runtime.evaluate", { expression: CHECK, returnByValue: true });
    const v = r.result?.result?.value;
    results.push({ route, width, ...v, errors: [...new Set(consoleErrors)].slice(0, 6) });
    const bad = v && (v.overflowX || v.sticking.length || v.clipped.length || v.broken.length || consoleErrors.length);
    if (bad) console.log(`${width} ${route}  overflowX=${v.overflowX} sticking=${v.sticking.length} clipped=${v.clipped.length} broken=${v.broken.length} errors=${consoleErrors.length}`);
  }
}
writeFileSync(outFile, JSON.stringify(results, null, 1));
console.log(`checked ${routes.length} pages x 2 widths; report in ${outFile}`);
ws.close();
chrome.kill();
