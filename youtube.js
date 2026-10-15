// Full page loads of Shorts are redirected by rules/shorts.json and in-page navigation by youtube-main.js.
// This script passes the setting to youtube-main.js and catches Shorts pages reached by any other route.
(function () {
  const { shortsToWatchUrl } = MediaCore;

  const ENABLED = 'data-media-utils-shorts';

  let enabled = false;

  function setEnabled(value) {
    enabled = value;
    document.documentElement.toggleAttribute(ENABLED, value);
    redirectIfShorts();
  }

  chrome.storage.sync.get({ shortsEnabled: true }).then(({ shortsEnabled }) => setEnabled(shortsEnabled));
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.shortsEnabled) setEnabled(changes.shortsEnabled.newValue !== false);
  });

  function redirectIfShorts() {
    if (!enabled) return;
    const url = shortsToWatchUrl(location.href);
    if (url) location.replace(url);
  }

  document.addEventListener('yt-navigate-finish', redirectIfShorts);
})();
