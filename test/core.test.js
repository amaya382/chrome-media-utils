const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../core.js');

test('clampVolume keeps values within range', () => {
  assert.equal(core.clampVolume(150), 150);
  assert.equal(core.clampVolume(-10), 0);
  assert.equal(core.clampVolume(500), 200);
  assert.equal(core.clampVolume('42.6'), 43);
});

test('clampVolume falls back to the default for non-numbers', () => {
  assert.equal(core.clampVolume('abc'), 100);
  assert.equal(core.clampVolume(undefined), 100);
});

test('domainKey returns the hostname of web pages', () => {
  assert.equal(core.domainKey('https://www.example.com/path?q=1'), 'www.example.com');
  assert.equal(core.domainKey('http://localhost:8080/'), 'localhost');
});

test('domainKey rejects non-web URLs', () => {
  assert.equal(core.domainKey('chrome://extensions/'), null);
  assert.equal(core.domainKey('file:///tmp/a.mp4'), null);
  assert.equal(core.domainKey('not a url'), null);
  assert.equal(core.domainKey(undefined), null);
});

test('badgeText shows the clamped percentage', () => {
  assert.equal(core.badgeText(150), '150');
  assert.equal(core.badgeText(999), '200');
});

test('shortsToWatchUrl converts Shorts URLs', () => {
  assert.equal(core.shortsToWatchUrl('https://www.youtube.com/shorts/abc_DEF-123'), 'https://www.youtube.com/watch?v=abc_DEF-123');
  assert.equal(core.shortsToWatchUrl('https://youtube.com/shorts/abc?feature=share'), 'https://youtube.com/watch?v=abc');
  assert.equal(core.shortsToWatchUrl('https://m.youtube.com/shorts/abc/'), 'https://m.youtube.com/watch?v=abc');
});

test('shortsToWatchUrl ignores other URLs', () => {
  assert.equal(core.shortsToWatchUrl('https://www.youtube.com/watch?v=abc'), null);
  assert.equal(core.shortsToWatchUrl('https://www.youtube.com/@channel/shorts'), null);
  assert.equal(core.shortsToWatchUrl('https://example.com/shorts/abc'), null);
  assert.equal(core.shortsToWatchUrl('https://music.youtube.com/shorts/abc'), null);
  assert.equal(core.shortsToWatchUrl('not a url'), null);
});
