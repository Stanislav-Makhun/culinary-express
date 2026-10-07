// Usage: node scripts/shot-file.mjs <file-or-url> <out.png> [width] [height]
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const [,, target, out, w = '800', h = '800'] = process.argv;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }).catch(() => chromium.launch());
const page = await browser.newPage({ viewport: { width: +w, height: +h } });
await page.goto(target.startsWith('http') ? target : 'file://' + target);
await page.waitForTimeout(600);
await page.screenshot({ path: out, fullPage: false });
await browser.close();
