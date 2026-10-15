// Injected into the top frame's ISOLATED world on demand, possibly many times per page.
(function () {
  if (globalThis.MediaPage) return;

  const ID = 'data-media-utils-id';
  const TARGET = 'data-media-utils-target';
  const MAXIMIZED = 'data-media-utils-maximized';
  const SAVED_POPOVER = 'data-media-utils-popover';
  const SAVED_CONTROLS = 'data-media-utils-controls';
  const STYLE_ID = 'media-utils-style';
  const HIGHLIGHT_MS = 3000;

  const STYLE = `
    [${MAXIMIZED}] {
      position: fixed !important;
      inset: 0 !important;
      width: 100% !important;
      height: 100% !important;
      max-width: none !important;
      max-height: none !important;
      margin: 0 !important;
      border: 0 !important;
      padding: 0 !important;
      transform: none !important;
      background: #000 !important;
      object-fit: contain !important;
    }
    [${MAXIMIZED}]::backdrop { background: #000; }
  `;

  let nextId = 1;
  let highlight = null;
  let highlightTimer = 0;

  // Returns every <video> as { video, frames }, where frames is the chain of same-origin iframes from the top.
  function collect(root = document, frames = [], found = []) {
    for (const el of root.querySelectorAll('*')) {
      if (el.localName === 'video') found.push({ video: el, frames });
      if (el.shadowRoot) collect(el.shadowRoot, frames, found);
      if (el.localName === 'iframe' || el.localName === 'frame') {
        let doc = null;
        try {
          doc = el.contentDocument;
        } catch {}
        if (doc) collect(doc, [...frames, el], found);
      }
    }
    return found;
  }

  function documents(root = document, found = [root]) {
    for (const frame of root.querySelectorAll('iframe, frame')) {
      let doc = null;
      try {
        doc = frame.contentDocument;
      } catch {}
      if (doc) {
        found.push(doc);
        documents(doc, found);
      }
    }
    return found;
  }

  function topRect({ video, frames }) {
    const rect = video.getBoundingClientRect();
    let { left, top } = rect;
    for (const frame of frames) {
      const outer = frame.getBoundingClientRect();
      left += outer.left + frame.clientLeft;
      top += outer.top + frame.clientTop;
    }
    return { left, top, width: rect.width, height: rect.height };
  }

  function isPlaying(video) {
    return !video.paused && !video.ended && video.readyState > 2;
  }

  function isVisible(rect) {
    return rect.width > 0 && rect.height > 0 &&
      rect.left < innerWidth && rect.top < innerHeight && rect.left + rect.width > 0 && rect.top + rect.height > 0;
  }

  function autoPick(entries) {
    const scored = entries.map((entry) => {
      const rect = topRect(entry);
      return { entry, playing: isPlaying(entry.video), visible: isVisible(rect), area: rect.width * rect.height };
    });
    scored.sort((a, b) => (b.playing - a.playing) || (b.visible - a.visible) || (b.area - a.area));
    return scored[0]?.entry ?? null;
  }

  function pick(entries = collect()) {
    return entries.find(({ video }) => video.hasAttribute(TARGET)) ?? autoPick(entries);
  }

  function idOf(video) {
    if (!video.hasAttribute(ID)) video.setAttribute(ID, String(nextId++));
    return video.getAttribute(ID);
  }

  function list() {
    const entries = collect();
    const auto = autoPick(entries);
    return entries.map((entry) => {
      const { video } = entry;
      const rect = topRect(entry);
      return {
        id: idOf(video),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        playing: isPlaying(video),
        muted: video.muted || video.volume === 0,
        target: video.hasAttribute(TARGET),
        auto: entry === auto,
      };
    });
  }

  function setTarget(id) {
    for (const { video } of collect()) {
      video.toggleAttribute(TARGET, id != null && video.getAttribute(ID) === id);
    }
  }

  function showHighlight(id) {
    clearTimeout(highlightTimer);
    highlight?.remove();
    highlight = null;
    const entry = id == null ? null : collect().find(({ video }) => video.getAttribute(ID) === id);
    if (!entry) return;
    const rect = topRect(entry);
    highlight = document.createElement('div');
    highlight.popover = 'manual';
    highlight.style.cssText = `position: fixed; inset: auto; margin: 0; padding: 0; pointer-events: none;
      left: ${rect.left}px; top: ${rect.top}px; width: ${rect.width}px; height: ${rect.height}px;
      box-sizing: border-box; border: 4px solid #f97316; background: rgb(249 115 22 / 0.2);`;
    document.documentElement.append(highlight);
    highlight.showPopover();
    highlightTimer = setTimeout(() => showHighlight(null), HIGHLIGHT_MS);
  }

  function failure(message) {
    return { ok: false, error: message };
  }

  const NO_VIDEO = 'No video found on this page';

  async function pictureInPicture() {
    try {
      const current = documents().find((doc) => doc.pictureInPictureElement);
      if (current) {
        await current.exitPictureInPicture();
        return { ok: true };
      }
      const entry = pick();
      if (!entry) return failure(NO_VIDEO);
      entry.video.disablePictureInPicture = false;
      await entry.video.requestPictureInPicture();
      return { ok: true };
    } catch (e) {
      return failure(e.message);
    }
  }

  async function fullscreen() {
    try {
      const current = documents().find((doc) => doc.fullscreenElement);
      if (current) {
        await current.exitFullscreen();
        return { ok: true };
      }
      const entry = pick();
      if (!entry) return failure(NO_VIDEO);
      await entry.video.requestFullscreen();
      return { ok: true };
    } catch (e) {
      return failure(e.message);
    }
  }

  function onKeydown(event) {
    if (event.key !== 'Escape') return;
    event.stopPropagation();
    restore();
  }

  function restore() {
    for (const doc of documents()) {
      for (const el of doc.querySelectorAll(`[${MAXIMIZED}]`)) {
        if (el.matches(':popover-open')) el.hidePopover();
        const popover = el.getAttribute(SAVED_POPOVER);
        if (popover == null) el.removeAttribute('popover');
        else el.setAttribute('popover', popover);
        if (el.hasAttribute(SAVED_CONTROLS)) el.controls = el.getAttribute(SAVED_CONTROLS) === 'true';
        el.removeAttribute(SAVED_POPOVER);
        el.removeAttribute(SAVED_CONTROLS);
        el.removeAttribute(MAXIMIZED);
      }
      doc.removeEventListener('keydown', onKeydown, true);
    }
  }

  function maximizeElement(el) {
    const doc = el.ownerDocument;
    if (!doc.getElementById(STYLE_ID)) {
      const style = doc.createElement('style');
      style.id = STYLE_ID;
      style.textContent = STYLE;
      (doc.head ?? doc.documentElement).append(style);
    }
    if (el.hasAttribute('popover')) el.setAttribute(SAVED_POPOVER, el.getAttribute('popover'));
    el.setAttribute(MAXIMIZED, '');
    el.popover = 'manual';
    el.showPopover();
    doc.addEventListener('keydown', onKeydown, true);
  }

  function maximize() {
    try {
      if (documents().some((doc) => doc.querySelector(`[${MAXIMIZED}]`))) {
        restore();
        return { ok: true };
      }
      const entry = pick();
      if (!entry) return failure(NO_VIDEO);
      const { video, frames } = entry;
      for (const el of [...frames, video]) maximizeElement(el);
      // The site's own controls stay behind the top layer, so the browser's are the only way to operate the video.
      video.setAttribute(SAVED_CONTROLS, String(video.controls));
      video.controls = true;
      return { ok: true };
    } catch (e) {
      restore();
      return failure(e.message);
    }
  }

  globalThis.MediaPage = { list, setTarget, highlight: showHighlight, pictureInPicture, maximize, fullscreen };
})();
