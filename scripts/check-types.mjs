// Checks step visibility per dispatch type, Save draft and Reset demo.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { resolve } from 'node:path';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto('file://' + resolve('dist/local-preview.html') + '#/dashboard');
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForTimeout(600);
await page.getByRole('button', { name: 'Create Dispatch' }).first().click();
const labels = async () => (await page.locator('.route-steps .stop-label').allTextContents()).join(' | ');
const out = {};
for (const t of ['Catered Delivery', 'Onsite Booking', 'Catered Event']) {
  await page.locator('.type-card', { hasText: t }).click();
  await page.fill('#f-name', 'Type test');
  await page.fill('#f-loc', 'Somewhere 1');
  await page.getByRole('button', { name: 'Save draft' }).click();
  await page.waitForTimeout(200);
  out[t] = await labels();
}
await page.getByRole('button', { name: 'Save & exit' }).click();
await page.waitForTimeout(300);
out.dashboardCount = await page.locator('.dcard').count();
await page.locator('.demo-pill').click();
await page.getByRole('button', { name: /Reset demo/ }).click();
await page.getByRole('button', { name: 'Yes, reset' }).click();
await page.waitForTimeout(300);
out.afterReset = await page.locator('.dcard').count();
await page.reload();
await page.waitForTimeout(500);
out.afterReload = await page.locator('.dcard').count();
console.log(JSON.stringify(out, null, 1), errors.length ? errors : 'no errors');
await browser.close();
