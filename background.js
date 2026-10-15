importScripts('core.js');

const { clampVolume, domainKey, badgeText, tabStateKey, domainStateKey, callPage } = MediaCore;

const COMMANDS = {
  'toggle-pip': 'pictureInPicture',
  'toggle-maximize': 'maximize',
  'toggle-fullscreen': 'fullscreen',
};

chrome.action.setBadgeBackgroundColor({ color: '#f97316' });

chrome.runtime.onInstalled.addListener(syncShortsRule);
chrome.runtime.onStartup.addListener(syncShortsRule);

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.shortsEnabled) syncShortsRule();
});

async function syncShortsRule() {
  const { shortsEnabled } = await chrome.storage.sync.get({ shortsEnabled: true });
  await chrome.declarativeNetRequest.updateEnabledRulesets(
    shortsEnabled ? { enableRulesetIds: ['shorts'] } : { disableRulesetIds: ['shorts'] },
  );
}

chrome.commands.onCommand.addListener((command, tab) => {
  const action = COMMANDS[command];
  if (!action || tab?.id == null) return;
  callPage(tab.id, action)
    .then((result) => {
      if (result && !result.ok) console.warn(`Media Utils: ${action} failed:`, result.error);
    })
    .catch((e) => console.warn(`Media Utils: ${action} failed`, e));
});

const handlers = {
  start: ({ tabId, streamId, volume }) => startCapture(tabId, streamId, clampVolume(volume)),
  volume: ({ tabId, volume }) => setVolume(tabId, clampVolume(volume)),
  stop: ({ tabId }) => stopCapture(tabId),
  ended: ({ tabId }) => clearTab(tabId),
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const handler = message.target === 'offscreen' ? null : handlers[message.type];
  if (!handler) return false;
  handler(message).then(
    () => sendResponse({}),
    (e) => sendResponse({ error: String(e?.message ?? e) }),
  );
  return true;
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (!changeInfo.url && changeInfo.status !== 'loading') return;
  followNavigation(tabId, changeInfo.url)
    .catch((e) => console.warn('Media Utils: applying the remembered volume failed', e));
});

chrome.tabs.onRemoved.addListener((tabId) => {
  stopCapture(tabId).catch((e) => console.warn('Media Utils: stopping the capture failed', e));
});

async function loadTab(tabId) {
  const key = tabStateKey(tabId);
  return (await chrome.storage.session.get(key))[key] ?? null;
}

async function saveTab(tabId, volume) {
  await chrome.storage.session.set({ [tabStateKey(tabId)]: { volume } });
  await showBadge(tabId, volume);
}

// Tab-specific badges may be reset by navigation, so this is also called while the tab loads.
function showBadge(tabId, volume) {
  return chrome.action.setBadgeText({ tabId, text: volume == null ? '' : badgeText(volume) }).catch(() => {});
}

async function startCapture(tabId, streamId, volume) {
  // Saved first so that closeOffscreenIfIdle never closes the document this capture is about to use.
  await saveTab(tabId, volume);
  try {
    await ensureOffscreen();
    await sendToOffscreen({ type: 'start', tabId, streamId, volume });
  } catch (e) {
    await clearTab(tabId);
    throw e;
  }
}

async function setVolume(tabId, volume) {
  if (!(await loadTab(tabId))) return;
  await sendToOffscreen({ type: 'volume', tabId, volume });
  await saveTab(tabId, volume);
}

async function stopCapture(tabId) {
  if (!(await loadTab(tabId))) return;
  if (await chrome.offscreen.hasDocument()) await sendToOffscreen({ type: 'stop', tabId });
  await clearTab(tabId);
}

async function clearTab(tabId) {
  await chrome.storage.session.remove(tabStateKey(tabId));
  await showBadge(tabId, null);
  await closeOffscreenIfIdle();
}

async function followNavigation(tabId, newUrl) {
  const state = await loadTab(tabId);
  if (!state) return;
  const domain = newUrl && domainKey(newUrl);
  if (domain) {
    const key = domainStateKey(domain);
    const remembered = (await chrome.storage.sync.get(key))[key];
    if (remembered != null && remembered !== state.volume) {
      await setVolume(tabId, clampVolume(remembered));
      return;
    }
  }
  await showBadge(tabId, state.volume);
}

let creatingOffscreen = null;

async function ensureOffscreen() {
  if (await chrome.offscreen.hasDocument()) return;
  creatingOffscreen ??= chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: ['USER_MEDIA'],
    justification: 'Change the volume of captured tab audio',
  }).finally(() => {
    creatingOffscreen = null;
  });
  await creatingOffscreen;
}

async function closeOffscreenIfIdle() {
  const all = await chrome.storage.session.get(null);
  if (Object.keys(all).some((key) => key.startsWith(tabStateKey('')))) return;
  if (await chrome.offscreen.hasDocument()) await chrome.offscreen.closeDocument();
}

async function sendToOffscreen(message) {
  const response = await chrome.runtime.sendMessage({ target: 'offscreen', ...message });
  if (response?.error) throw new Error(response.error);
}
