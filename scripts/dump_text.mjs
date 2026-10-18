#!/usr/bin/env node
// Collects ALL the text of every page of the built site, including every tab and every collapsed (<details>) row,
// by driving Chrome. Used for the spelling and consistency checks, because tabbed pages only put the open tab into
// their HTML. Output: { "<route>": ["text of tab 1", "text of tab 2", ...] }
//
//   node scripts/dump_text.mjs http://localhost:8766 texts.json
import { spawn } from "node:child_process";
import { readdirSync, statSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [base, outFile = "texts.json"] = process.argv.slice(2);
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
const port = 9400 + Math.floor(Math.random() * 100);
const chrome = spawn(CHROME, [`--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), "dump-"))}`, "--headless=new", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--hide-scrollbars", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let page;
for (let i = 0; i < 50 && !page; i++) {
  try {
    page = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((x) => x.type === "page");
  } catch {}
  if (!page) await sleep(200);
}
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pending = new Map();
ws.onmessage = (m) => {
  const d = JSON.parse(m.data);
  if (d.id && pending.has(d.id)) pending.get(d.id)(d);
};
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result?.result?.value;
await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });

// every text node, joined with a space (textContent would glue neighbouring elements together: "AdebayorCame on")
const TEXT = `(() => { const m = document.querySelector('main') || document.body; const w = document.createTreeWalker(m, NodeFilter.SHOW_TEXT); const out = []; for (let n = w.nextNode(); n; n = w.nextNode()) { const p = n.parentElement; if (p && ['SCRIPT', 'STYLE'].includes(p.tagName)) continue; const t = n.nodeValue.replace(/\\s+/g, ' ').trim(); if (t) out.push(t); } return out.join(' '); })()`;
const out = {};
for (const route of routes) {
  await send("Page.navigate", { url: base + route });
  await sleep(700);
  const texts = [await ev(TEXT)];
  const n = (await ev(`document.querySelectorAll('[role=tab]').length`)) ?? 0;
  // one tab group per page at most matters here: click each tab button in turn and read the text
  for (let i = 0; i < n; i++) {
    await ev(`document.querySelectorAll('[role=tab]')[${i}].click()`);
    await sleep(250);
    texts.push(await ev(TEXT));
  }
  out[route] = [...new Set(texts)];
}
writeFileSync(outFile, JSON.stringify(out));
console.log(`dumped ${routes.length} pages to ${outFile}`);
ws.close();
chrome.kill();
