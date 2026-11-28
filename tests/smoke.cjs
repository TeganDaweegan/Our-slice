const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { mkdir, readFile } = require('node:fs/promises');
const { test, before, after } = require('node:test');

const origin = 'http://127.0.0.1:8765';
const prefix = 'our-slice-preview-7-7::';
const bush = 'our-slice-bush-v2';
const build = 'our-slice-build-v1';
const economy = 'our-slice-economy-77';
const slots = 'our-slice-save-slots-v1';
const history = 'our-slice-build-history-v1';
const previous = 'our-slice-pre-restore-77';
const cafe = 'our-slice-cafe-v1';
const shore = 'our-slice-foreshore-v1';
const start = { x: 830, y: 750 };
const progress = {
  [bush]: { player: start, inventory: { Timber: 7 }, stored: { Stone: 4 }, camp: 'tent' },
  [cafe]: { scene: 'bush', cafeGames: 2, cafeBest: 1 },
  [economy]: { money: 93, panels: { door: 2 }, toolbelt: { hammer: 145 } },
};

let browser;
before(async () => {
  browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
});
after(async () => browser?.close());

function scenario(name, run, fixture = {}) {
  test(name, { timeout: 30000 }, async () => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const page = await context.newPage();
    page.setDefaultTimeout(5000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    try {
      // Keep offline gameplay independent of the public PeerJS CDN and signalling service.
      await context.route(url => url.origin !== origin, route => route.abort());
      await page.addInitScript(({ data, prefix }) => {
        if (sessionStorage.getItem('fixture-installed')) return;
        for (const [key, value] of Object.entries(data)) {
          localStorage.setItem(prefix + key, JSON.stringify(value));
        }
        sessionStorage.setItem('fixture-installed', 'yes');
      }, { data: { ...progress, ...fixture }, prefix });
      assert.equal((await page.goto(origin + '/test-7-13.html')).status(), 200);
      await page.locator('#view').waitFor();
      assert.match(await page.locator('#inventory').innerText(), /Backpack/);
      await run(page);
      assert.deepEqual(errors, [], 'Uncaught game exceptions');
    } catch (error) {
      await mkdir('test-results', { recursive: true });
      await page.screenshot({ path: 'test-results/' + name.replace(/[^a-z0-9]+/gi, '-') + '.png', fullPage: true }).catch(() => {});
      throw error;
    } finally {
      await context.close();
    }
  });
}

const tap = (page, selector) => page.locator(selector).tap();
const read = (page, key) => page.evaluate(key => JSON.parse(localStorage.getItem(key)), prefix + key);
const message = (page, expected) => page.waitForFunction(
  text => document.querySelector('#msg').textContent.includes(text), expected, { timeout: 5000 },
);
const savedPosition = (page, { minX, maxX }) => page.waitForFunction(
  ({ key, minX, maxX }) => {
    const { x } = JSON.parse(localStorage.getItem(key)).player;
    return x > minX && x < maxX;
  }, { key: prefix + bush, minX, maxX }, { timeout: 8000 },
);

async function tool(page, category, action) {
  await tap(page, '#build');
  await page.getByText(category, { exact: true }).tap();
  await tap(page, `[data-build-action="${action}"]`);
}

async function world(page, x, y, player = start) {
  const canvas = page.locator('#view');
  const box = await canvas.boundingBox();
  const cameraX = Math.max(0, Math.min(1900 - 640, player.x - 320));
  const cameraY = Math.max(0, Math.min(1450 - 450, player.y - 225));
  await canvas.tap({ position: {
    x: (x - cameraX) * box.width / 640,
    y: (y - cameraY) * box.height / 450,
  } });
}

async function placeRoom(page) {
  await tool(page, 'Structures', 'room');
  await world(page, 900, 680);
  await message(page, 'First corner marked');
  await world(page, 1060, 820);
  await message(page, 'Room placed');
}

scenario('Build rooms and doors, move and duplicate furniture, reload and undo', async page => {
  await placeRoom(page);
  await tool(page, 'Structures', 'door');
  await world(page, 900, 750);
  await message(page, 'Door added');
  await tool(page, 'Furniture', 'chair');
  await world(page, 970, 720);
  await message(page, 'Placed');
  const [, chair] = await read(page, build);
  await tool(page, 'Utilities', 'move');
  await world(page, chair.x, chair.y);
  await world(page, 1010, 730);
  await message(page, 'Furniture moved');
  await tool(page, 'Utilities', 'copy');
  await world(page, 1010, 730);
  await world(page, 990, 780);
  await message(page, 'Furniture duplicated');
  const [room, moved, duplicate] = await read(page, build);
  assert.deepEqual([room.x, room.y, room.w, room.h], [900, 680, 160, 140]);
  assert.equal(room.openings[0].side, 'left');
  assert.ok(Math.abs(room.openings[0].pos - 70) <= 2);
  assert.equal(moved.id, chair.id);
  assert.notEqual(duplicate.id, chair.id);
  assert.equal(duplicate.kind, chair.kind);
  assert.ok(duplicate.y - moved.y > 40);
  await page.reload();
  assert.deepEqual(await read(page, build), [room, moved, duplicate]);
  await tool(page, 'Utilities', 'undo');
  assert.equal((await read(page, build))[2].deleted, true);
  await page.reload();
  await tool(page, 'Utilities', 'redo');
  assert.equal((await read(page, build))[2].deleted, false);
});

scenario('Tap movement stops at a solid wall and walks through a door', async page => {
  await placeRoom(page);
  await world(page, 980, 750);
  await savedPosition(page, { minX: 875, maxX: 901 });
  const position = (await read(page, bush)).player;
  assert.ok(position.x <= 900);
  await tool(page, 'Structures', 'door');
  await world(page, 900, 750, position);
  await message(page, 'Door added');
  await world(page, 980, 750, position);
  await savedPosition(page, { minX: 930, maxX: 990 }).catch(async error => {
    throw new Error('Player after tapping through door: ' + JSON.stringify((await read(page, bush)).player) +
      '. Door: ' + JSON.stringify((await read(page, build))[0].openings), { cause: error });
  });
});

const room = { id: 'fixture-room', kind: 'room', x: 900, y: 680, w: 160, h: 140, at: 1 };
const savedChapter = {
  name: 'First chapter',
  data: {
    format: 'our-slice-backup', version: 1,
    bush: { player: start, inventory: { Timber: 2 }, stored: { Stone: 8 }, camp: 'swag' },
    cafe: { scene: 'bush' }, foreshore: {}, build: [room],
    economy77: { money: 20 }, buildHistory: { undo: [], redo: [] },
  },
};

async function confirmRestore(page) {
  page.once('dialog', dialog => dialog.accept());
  await tap(page, '[data-load="1"]');
}

scenario('Save, reload, restore a chapter and round-trip an exported backup', async page => {
  await tap(page, '#backup');
  page.once('dialog', dialog => dialog.accept('Second chapter'));
  await tap(page, '#slot-create');
  await message(page, 'Chapter saved');
  await page.getByText('Backup files and transfer', { exact: true }).tap();
  const download = page.waitForEvent('download');
  await tap(page, '#export-backup');
  const backupBytes = await readFile(await (await download).path());
  const backup = JSON.parse(backupBytes);
  assert.equal(backup.format, 'our-slice-backup');
  assert.deepEqual(backup.build, [room]);

  const chapters = await read(page, slots);
  assert.equal(chapters[0].name, 'Second chapter');
  assert.deepEqual(chapters[0].data.bush.inventory, progress[bush].inventory);
  assert.deepEqual(chapters[0].data.build, [room]);
  assert.equal(chapters[0].data.economy77.money, 93);
  await page.reload();
  await tap(page, '#backup');
  await confirmRestore(page);
  await message(page, 'Loaded First chapter');
  assert.deepEqual((await read(page, bush)).inventory, savedChapter.data.bush.inventory);
  assert.deepEqual((await read(page, bush)).stored, savedChapter.data.bush.stored);
  assert.equal((await read(page, economy)).money, 20);
  assert.deepEqual(await read(page, build), [room]);
  assert.deepEqual(await read(page, slots), chapters);
  const before = (await read(page, previous)).entries;
  assert.equal(JSON.parse(before[economy]).money, 93);
  assert.deepEqual(JSON.parse(before[build]), [room]);

  await tap(page, '#backup');
  await page.getByText('Backup files and transfer', { exact: true }).tap();
  await page.locator('#import-backup').setInputFiles({
    name: 'synthetic-backup.json', mimeType: 'application/json', buffer: backupBytes,
  });
  page.once('dialog', dialog => dialog.accept());
  await tap(page, '#restore-backup');
  await message(page, 'Loaded Imported backup');
  assert.deepEqual((await read(page, bush)).inventory, progress[bush].inventory);
  assert.deepEqual((await read(page, bush)).stored, progress[bush].stored);
  assert.equal((await read(page, economy)).money, 93);
  assert.deepEqual(await read(page, build), [room]);
  assert.deepEqual(await read(page, slots), chapters);
}, { [slots]: [savedChapter], [build]: [room] });

scenario('Furniture placed after older removals survives reload', async page => {
  await tool(page, 'Furniture', 'chair');
  await world(page, 980, 750);
  await message(page, 'Placed');
  await page.reload();
  await tap(page, '#backup');
  assert.match(await page.locator('.story-note').first().innerText(), /Active property: 1 building object/);
  await tap(page, '#locate-build77');
  await message(page, 'Showing your saved chair');
}, {
  [build]: Array.from({ length: 40 }, (_, i) => ({
    id: 'removed-' + i, kind: 'chair', x: 980, y: 750, at: 1, deleted: true,
  })),
});

scenario('A failed chapter restore rolls back active progress and keeps autosaving', async page => {
  await tap(page, '#backup');
  page.once('dialog', dialog => dialog.accept('Current chapter'));
  await tap(page, '#slot-create');
  await message(page, 'Chapter saved');
  const keys = [bush, cafe, shore, build, economy, history, previous, slots];
  const before = await Promise.all(keys.map(key => read(page, key)));
  await page.evaluate(key => {
    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) {
      if (name === key) {
        Storage.prototype.setItem = setItem;
        throw new DOMException('Simulated inability to write', 'QuotaExceededError');
      }
      return setItem.call(this, name, value);
    };
  }, prefix + economy);
  await confirmRestore(page);
  await message(page, 'Could not open this chapter');
  assert.deepEqual(await Promise.all(keys.map(key => read(page, key))), before);
  await page.getByRole('button', { name: 'Close', exact: true }).tap();
  await world(page, 880, 750);
  await savedPosition(page, { minX: 855, maxX: 890 });
}, { [slots]: [savedChapter], [build]: [room] });
