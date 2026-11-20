import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const rules = (await readFile(new URL('../_redirects', import.meta.url), 'utf8'))
  .split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#'))
  .map(line => line.split(/\s+/));
test('only the legacy Dean Cercone URLs force redirect to the canonical HTML article', () => {
  assert.deepEqual(rules, [
    ['/deancercone', '/pages/deancercone', '301!'],
    ['/deancercone/', '/pages/deancercone', '301!'],
  ]);
});
test('canonical HTML destination exists and retains the shared article reader hook', async () => {
  const html = await readFile(new URL('../pages/deancercone.html', import.meta.url), 'utf8');
  assert.match(html, /Dean Cercone/i);
  assert.match(html, /navbar-component\.js/);
  const navbar = await readFile(new URL('../navbar-component.js', import.meta.url), 'utf8');
  assert.match(navbar, /import\('\/article-listener-init\.js'\)/);
});
