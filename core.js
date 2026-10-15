(function (root) {
  const VOLUME_MIN = 0;
  const VOLUME_MAX = 200;
  const VOLUME_DEFAULT = 100;

  function clampVolume(value) {
    const n = Math.round(Number(value));
    if (!Number.isFinite(n)) return VOLUME_DEFAULT;
    return Math.min(VOLUME_MAX, Math.max(VOLUME_MIN, n));
  }

  function domainKey(url) {
    try {
      const { protocol, hostname } = new URL(url);
      return protocol === 'http:' || protocol === 'https:' ? hostname : null;
    } catch {
      return null;
    }
  }

  function badgeText(volume) {
    return String(clampVolume(volume));
  }

  const SHORTS_PATH = /^\/shorts\/([\w-]+)/;
  const YOUTUBE_HOST = /^((?:www|m)\.)?youtube\.com$/;

  function shortsToWatchUrl(url) {
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      return null;
    }
    const match = SHORTS_PATH.exec(parsed.pathname);
    if (!match || !YOUTUBE_HOST.test(parsed.hostname)) return null;
    return `https://${parsed.hostname}/watch?v=${match[1]}`;
  }

  const tabStateKey = (tabId) => `tab:${tabId}`;
  const domainStateKey = (domain) => `domain:${domain}`;

  // Calls MediaPage[action] in the tab's top frame; MediaPage reaches same-origin frames by itself.
  function callPage(tabId, action, ...args) {
    const target = { tabId };
    return chrome.scripting.executeScript({ target, files: ['media.js'] })
      .then(() => chrome.scripting.executeScript({ target, func: (name, params) => MediaPage[name](...params), args: [action, args] }))
      .then(([injection]) => injection?.result);
  }

  const api = {
    VOLUME_MIN, VOLUME_MAX, VOLUME_DEFAULT,
    clampVolume, domainKey, badgeText, shortsToWatchUrl, tabStateKey, domainStateKey, callPage,
  };
  root.MediaCore = api;
  if (typeof module !== 'undefined') module.exports = api;
})(globalThis);
