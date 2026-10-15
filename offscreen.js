const pipelines = new Map();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.target !== 'offscreen') return false;
  handle(message).then(() => sendResponse({}), (e) => sendResponse({ error: String(e?.message ?? e) }));
  return true;
});

async function handle({ type, tabId, streamId, volume }) {
  if (type === 'start') await start(tabId, streamId, volume);
  else if (type === 'volume') setVolume(tabId, volume);
  else if (type === 'stop') stop(tabId);
}

async function start(tabId, streamId, volume) {
  stop(tabId);
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: streamId } },
  });
  const context = new AudioContext();
  const gain = context.createGain();
  gain.gain.value = volume / 100;
  context.createMediaStreamSource(stream).connect(gain).connect(context.destination);
  await context.resume();
  const pipeline = { stream, context, gain };
  pipelines.set(tabId, pipeline);
  for (const track of stream.getAudioTracks()) {
    track.addEventListener('ended', () => {
      if (pipelines.get(tabId) !== pipeline) return;
      stop(tabId);
      chrome.runtime.sendMessage({ type: 'ended', tabId });
    });
  }
}

function setVolume(tabId, volume) {
  const pipeline = pipelines.get(tabId);
  if (pipeline) pipeline.gain.gain.value = volume / 100;
}

function stop(tabId) {
  const pipeline = pipelines.get(tabId);
  if (!pipeline) return;
  pipelines.delete(tabId);
  for (const track of pipeline.stream.getTracks()) track.stop();
  pipeline.context.close();
}
