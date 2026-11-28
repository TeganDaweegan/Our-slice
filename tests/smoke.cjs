const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    const response = await page.goto('http://127.0.0.1:8765/test-7-13.html', { waitUntil: 'load' });
    assert.equal(response.status(), 200, 'Test page should load');
    await page.locator('canvas').first().waitFor({ state: 'visible' });
    assert.equal(await page.locator('#build').count(), 1, 'Build control exists');
    assert.equal(await page.locator('#backup').count(), 1, 'Backup control exists');
    await page.waitForTimeout(750);
    assert.deepEqual(errors, [], 'No uncaught JavaScript exceptions on startup');
    // Verify browser storage persists through a reload without modifying game saves.
    await page.evaluate(() => localStorage.setItem('our-slice-ci-sentinel', 'persisted'));
    await page.reload({ waitUntil: 'load' });
    assert.equal(await page.evaluate(() => localStorage.getItem('our-slice-ci-sentinel')), 'persisted');
    await page.evaluate(() => localStorage.removeItem('our-slice-ci-sentinel'));
    await page.waitForTimeout(350);
    assert.deepEqual(errors, [], 'No uncaught JavaScript exceptions after reload');
    console.log('PASS: mobile viewport, game canvas, controls, reload, browser storage, no page errors');
  } catch (error) {
    fs.mkdirSync('test-results', { recursive: true });
    await page.screenshot({ path: 'test-results/smoke-failure.png', fullPage: true }).catch(() => {});
    console.error(error);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
