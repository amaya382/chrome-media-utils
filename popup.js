const { VOLUME_DEFAULT, clampVolume, domainKey, tabStateKey, domainStateKey, callPage } = MediaCore;

const $ = (id) => document.getElementById(id);
const captureInput = $('capture');
const volumeInput = $('volume');
const volumeValue = $('volume-value');
const resetButton = $('reset');
const rememberInput = $('remember');
const shortsInput = $('shorts');
const status = $('status');

let tab;
let domain;

function showStatus(message, isError = false) {
  status.textContent = message ?? '';
  status.classList.toggle('error', isError);
}

function showVolume(volume) {
  volumeInput.value = volume;
  volumeValue.textContent = `${volume}%`;
}

function setCapturing(capturing) {
  captureInput.checked = capturing;
  volumeInput.disabled = !capturing;
  resetButton.disabled = !capturing;
}

async function send(message) {
  const response = await chrome.runtime.sendMessage(message);
  if (response?.error) throw new Error(response.error);
}

async function rememberVolume() {
  if (!domain || !rememberInput.checked) return;
  await chrome.storage.sync.set({ [domainStateKey(domain)]: clampVolume(volumeInput.value) });
}

captureInput.addEventListener('change', async () => {
  const capturing = captureInput.checked;
  setCapturing(capturing);
  showStatus();
  try {
    if (capturing) {
      const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tab.id });
      await send({ type: 'start', tabId: tab.id, streamId, volume: clampVolume(volumeInput.value) });
    } else {
      await send({ type: 'stop', tabId: tab.id });
    }
  } catch (e) {
    setCapturing(!capturing);
    showStatus(e.message, true);
  }
});

volumeInput.addEventListener('input', () => {
  const volume = clampVolume(volumeInput.value);
  showVolume(volume);
  send({ type: 'volume', tabId: tab.id, volume }).catch((e) => showStatus(e.message, true));
});

// storage.sync limits writes per minute, so the domain is saved only when the slider is released.
volumeInput.addEventListener('change', () => {
  rememberVolume().catch((e) => showStatus(e.message, true));
});

resetButton.addEventListener('click', () => {
  showVolume(VOLUME_DEFAULT);
  send({ type: 'volume', tabId: tab.id, volume: VOLUME_DEFAULT })
    .then(rememberVolume)
    .catch((e) => showStatus(e.message, true));
});

rememberInput.addEventListener('change', () => {
  const saved = rememberInput.checked
    ? rememberVolume()
    : chrome.storage.sync.remove(domainStateKey(domain));
  saved.catch((e) => showStatus(e.message, true));
});

shortsInput.addEventListener('change', () => {
  chrome.storage.sync.set({ shortsEnabled: shortsInput.checked });
});

$('shortcuts').addEventListener('click', (event) => {
  event.preventDefault();
  chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
});

for (const button of document.querySelectorAll('[data-action]')) {
  button.addEventListener('click', async () => {
    showStatus();
    try {
      const result = await callPage(tab.id, button.dataset.action);
      if (result && !result.ok) showStatus(result.error, true);
    } catch (e) {
      showStatus(e.message, true);
    }
  });
}

function describe(video, index) {
  const state = video.playing ? 'playing' : 'paused';
  return `#${index + 1}  ${video.width}×${video.height}  ${state}${video.muted ? ' (muted)' : ''}`;
}

function targetOption(value, text, checked) {
  const label = document.createElement('label');
  const input = document.createElement('input');
  input.type = 'radio';
  input.name = 'target';
  input.value = value;
  input.checked = checked;
  label.append(input, text);
  input.addEventListener('change', () => {
    callPage(tab.id, 'setTarget', value || null).catch((e) => showStatus(e.message, true));
  });
  if (value) {
    label.addEventListener('mouseenter', () => callPage(tab.id, 'highlight', value).catch(() => {}));
    label.addEventListener('mouseleave', () => callPage(tab.id, 'highlight', null).catch(() => {}));
  }
  return label;
}

async function showTargets() {
  const videos = await callPage(tab.id, 'list').catch(() => null);
  if (!videos || videos.length < 2) return;
  const anyTarget = videos.some((video) => video.target);
  const auto = videos.find((video) => video.auto);
  const autoText = auto ? `Auto (#${videos.indexOf(auto) + 1})` : 'Auto';
  $('target-list').append(
    targetOption('', autoText, !anyTarget),
    ...videos.map((video, index) => targetOption(video.id, describe(video, index), video.target)),
  );
  $('targets').hidden = false;
}

async function init() {
  [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  domain = domainKey(tab.url);

  const tabKey = tabStateKey(tab.id);
  const rememberedKey = domain && domainStateKey(domain);
  const [session, synced] = await Promise.all([
    chrome.storage.session.get(tabKey),
    chrome.storage.sync.get({ shortsEnabled: true, ...(rememberedKey && { [rememberedKey]: null }) }),
  ]);
  const tabState = session[tabKey];
  const remembered = rememberedKey ? synced[rememberedKey] : null;

  setCapturing(Boolean(tabState));
  showVolume(clampVolume(tabState?.volume ?? remembered ?? VOLUME_DEFAULT));
  rememberInput.checked = remembered != null;
  rememberInput.disabled = !domain;
  if (domain) $('remember-label').textContent = `Remember for ${domain}`;
  shortsInput.checked = synced.shortsEnabled;

  await showTargets();
}

init().catch((e) => showStatus(e.message, true));
