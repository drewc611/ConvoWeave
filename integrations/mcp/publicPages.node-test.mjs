import assert from 'node:assert/strict';
import test from 'node:test';
import { publicPage } from './publicPages.mjs';

test('public policy pages are rendered and cross-linked', () => {
  for (const path of ['/privacy', '/support', '/account-deletion']) {
    const html = publicPage(path);
    assert.equal(typeof html, 'string');
    assert.match(html, /ConvoWeave/);
    assert.match(html, /\/privacy/);
    assert.match(html, /\/support/);
    assert.match(html, /\/account-deletion/);
  }
});

test('unknown paths do not produce a public policy page', () => {
  assert.equal(publicPage('/not-a-page'), null);
});
