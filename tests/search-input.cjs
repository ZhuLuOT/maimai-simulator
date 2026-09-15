const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { createRequire } = require('node:module');
const runtime = createRequire('C:/Users/ADMIN/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/browser-runtime.js');
const { chromium } = runtime('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  try {
    const page = await browser.newPage({ viewport: { width: 505, height: 698 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addLocatorHandler(page.locator('[data-action="meal-later"]'),async()=>{await page.locator('[data-action="meal-later"]').click();});
 await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    await page.locator('input[name="talent"]').first().check();
    await page.getByRole('button', { name: '开始春季生活' }).click();
    await page.locator('[data-action="intro-skip"]').click();
    await page.getByRole('button', { name: '名牌与解锁进度' }).click();
    await page.locator('[data-action="collection-tab"][data-value="region"]').click();
    const input = page.getByRole('textbox', { name: '搜索收藏品' });
    await input.focus();
    await input.evaluate(el => {
      window.inputBlurs = 0;
      window.searchNode = el;
      el.addEventListener('blur', () => window.inputBlurs++);
    });
    await input.pressSequentially('abc123XYZ789');
    assert.equal(await input.inputValue(), 'abc123XYZ789');
    assert.equal(await page.evaluate(() => window.inputBlurs), 0, 'typing must not blur the input');
    assert.ok(await input.evaluate(el => el === window.searchNode && document.activeElement === el));
    await input.press('ArrowLeft');
    await input.press('ArrowLeft');
    await input.press('Backspace');
    await input.pressSequentially('0');
    assert.equal(await input.inputValue(), 'abc123XYZ089');
    assert.equal(await input.evaluate(el => el.selectionStart), 10);
    await input.press('ControlOrMeta+A');
    await input.pressSequentially('2026');
    assert.equal(await input.inputValue(), '2026');
    await input.press('ControlOrMeta+A');
    await input.press('Backspace');

    // Exercise Chromium's real composition path instead of fill(), which skips IME.
    const cdp = await page.context().newCDPSession(page);
    const count = await page.locator('.collection-item').count();
    for (const text of ['p', 'pr', 'pro', 'pro1']) {
      await cdp.send('Input.imeSetComposition', { text, selectionStart: text.length, selectionEnd: text.length });
      assert.equal(await input.inputValue(), text);
      assert.equal(await page.locator('.collection-item').count(), count, 'do not search uncommitted composition');
      assert.equal(await page.evaluate(() => window.inputBlurs), 0);
    }
    await cdp.send('Input.insertText', { text: '星空' });
    assert.equal(await input.inputValue(), '星空');
    assert.equal(await page.locator('.collection-item').count(), 0);
    await input.pressSequentially('abc123');
    assert.equal(await input.inputValue(), '星空abc123');
    await input.press('ControlOrMeta+A');
    await input.press('Backspace');
    await cdp.send('Input.imeSetComposition', { text: 'quxiao', selectionStart: 6, selectionEnd: 6 });
    await cdp.send('Input.imeSetComposition', { text: '', selectionStart: 0, selectionEnd: 0 });
    assert.equal(await input.inputValue(), '');
    assert.equal(await page.locator('.collection-item').count(), count);
    assert.equal(await page.evaluate(() => window.inputBlurs), 0);

    await input.pressSequentially('123');
    await page.locator('[data-action="collection-tab"][data-value="title"]').click();
    assert.equal(await input.inputValue(), '', 'tab changes still reset the query');
    await input.pressSequentially('1000');
    assert.ok(await page.locator('.collection-item').count() > 0);
    assert.deepEqual(errors, []);
    console.log('PASS: typing, caret edits, selection replacement, IME commit/cancel, focus stability and tab reset (505px).');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
