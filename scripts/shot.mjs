#!/usr/bin/env node
// A tiny screenshot tool for checking pages that need clicking (no packages needed: it talks to Chrome directly).
//
//   node scripts/shot.mjs <url> <out.png> [width=1280] [height=1400] [js to run in the page before the shot]
//
// Example: node scripts/shot.mjs http://localhost:8766/history/ /tmp/h.png 1280 1400 "[...document.querySelectorAll('[role=tab]')].find(b=>b.textContent.includes('Finals')).click()"
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [url, out, width = "1280", height = "1400", js = ""] = process.argv.slice(2);
if (!url || !out) {
  console.error("usage: node scripts/shot.mjs <url> <out.png> [width] [height] [js]");
  process.exit(1);
}
const CHROME = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const port = 9300 + Math.floor(Math.random() * 500);
const profile = mkdtempSync(join(tmpdir(), "shot-"));
const chrome = spawn(CHROME, [`--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "--headless=new", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--hide-scrollbars", `--window-size=${width},${height}`, "about:blank"], { stdio: "ignore" });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function targets() {
  for (let i = 0; i < 50; i++) {
    try {
      const t = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
      const page = t.find((x) => x.type === "page");
      if (page) return page;
    } catch {}
    await sleep(200);
  }
  throw new Error("Chrome did not start");
}

try {
  const page = await targets();
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0;
  const pending = new Map();
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pending.has(d.id)) pending.get(d.id)(d);
  };
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });

  await send("Emulation.setDeviceMetricsOverride", { width: +width, height: +height, deviceScaleFactor: 1, mobile: +width < 600 });
  await send("Page.navigate", { url });
  await sleep(2500);
  if (js) {
    const r = await send("Runtime.evaluate", { expression: js, awaitPromise: true, returnByValue: true });
    if (r.result?.exceptionDetails) console.error("page error:", JSON.stringify(r.result.exceptionDetails).slice(0, 300));
    await sleep(800);
  }
  const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  writeFileSync(out, Buffer.from(shot.result.data, "base64"));
  console.log("saved", out);
  ws.close();
} finally {
  chrome.kill();
}
