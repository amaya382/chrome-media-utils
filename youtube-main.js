// Runs in the page's MAIN world because the endpoint of a yt-navigate event is a page object the ISOLATED world cannot read.
(function () {
  const ENABLED = 'data-media-utils-shorts';
  const SHORTS_PATH = /^\/shorts\/([\w-]+)/;

  function shortsVideoId(endpoint) {
    if (!endpoint) return null;
    const url = endpoint.commandMetadata?.webCommandMetadata?.url ?? '';
    return endpoint.reelWatchEndpoint?.videoId ?? SHORTS_PATH.exec(url)?.[1] ?? null;
  }

  // Same shape as the watch endpoints YouTube builds for its own links.
  function watchEndpoint(videoId) {
    return {
      watchEndpoint: { videoId },
      commandMetadata: { webCommandMetadata: { url: `/watch?v=${videoId}`, webPageType: 'WEB_PAGE_TYPE_WATCH', rootVe: 3832 } },
    };
  }

  // YouTube's components fire yt-navigate for in-page navigation; swapping the endpoint keeps the navigation in-page.
  window.addEventListener('yt-navigate', (event) => {
    if (!document.documentElement.hasAttribute(ENABLED)) return;
    const videoId = shortsVideoId(event.detail?.endpoint);
    if (!videoId) return;
    event.stopImmediatePropagation();
    event.composedPath()[0].dispatchEvent(new CustomEvent('yt-navigate', {
      bubbles: true,
      composed: true,
      detail: { ...event.detail, endpoint: watchEndpoint(videoId) },
    }));
  }, true);
})();
