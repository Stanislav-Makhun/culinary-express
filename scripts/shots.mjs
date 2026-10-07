// Screenshots routes at the given widths and reports console errors.
// Usage: node scripts/shots.mjs <outDir> <width,width> <route> [route...]
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { resolve } from 'node:path';
const [,, out, widths, ...routes] = process.argv;
const file = 'file://' + resolve('dist/local-preview.html');
const proxy = process.env.HTTPS_PROXY ? (() => { const u = new URL(process.env.HTTPS_PROXY); return { server: `${u.protocol}//${u.host}`, username: decodeURIComponent(u.username), password: decodeURIComponent(u.password) }; })() : undefined;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', proxy });
const errors = [];
for (const w of widths.split(',').map(Number)) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 }, deviceScaleFactor: 1, ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`[${w}] ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`[${w}] ${e.message}`));
  await page.goto(file);
  await page.waitForTimeout(1200);
  for (const r of routes) {
    await page.evaluate((h) => { location.hash = h; }, r);
    await page.waitForTimeout(500);
    const name = `${out}/${w}-${r.replace(/[^a-z0-9]+/gi, '_') || 'root'}.png`;
    await page.screenshot({ path: name, fullPage: true });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (overflow > 0) errors.push(`[${w}] ${r} horizontal overflow ${overflow}px`);
  }
  await ctx.close();
}
await browser.close();
console.log(errors.length ? errors.join('\n') : 'no errors');
