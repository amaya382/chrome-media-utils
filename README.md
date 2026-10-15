<p align="right"><strong>English</strong> / <a href="README_ja.md">日本語</a></p>

<h1 align="center">🎚️ Media Utils</h1>

<p align="center">
  <strong>Set a master volume for each tab, and control any video on a page in Chrome.</strong><br/>
  Picture-in-Picture, maximize in tab, and fullscreen are on the toolbar popup and keyboard shortcuts, and YouTube Shorts open as regular videos.
</p>

Media Utils is a Manifest V3 Chrome extension written in plain JavaScript. There is no build step: the repository directory is the extension.

## Why Media Utils?

- **Volume per tab, beyond 100%** — the extension routes the tab's audio through a gain stage, so one loud tab can be turned down and a quiet one boosted up to 200% without touching the system volume or other tabs
- **One way to control every player** — Picture-in-Picture, maximize in tab, and fullscreen work the same on every site, whether or not the site's player has its own buttons for them
- **Shorts in the regular player** — a Shorts link opens the regular watch page, which has a seek bar, playback speed, and the theater mode

## 🚀 Quick Start

**Requirements:** desktop Chrome 116 or later.

1. Clone this repository

   ```bash
   git clone https://github.com/amaya382/chrome-media-utils.git
   ```

2. Open `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the cloned directory

Play a video on any site, click the Media Utils icon in the toolbar, and turn on "Master volume". Move the slider to change the volume of that tab only.

To update, run `git pull` and click the reload button on the extension's card in `chrome://extensions/`.

## 📖 Usage

### Master volume

Turning on "Master volume" in the popup starts capturing the tab's audio, and the slider then sets its volume from 0% to 200%. While the capture runs, the extension icon shows the volume as a badge, such as `150`, and Chrome shows its capture indicator on the tab. "Reset" returns the volume to 100% and keeps the capture running. Turning the switch off stops the capture and returns the tab to its own audio.

The volume belongs to the tab. It stays while the tab moves between pages, even to other sites, and ends when the switch is turned off or the tab is closed.

Checking "Remember for *site*" saves the current volume for the site's host name, such as `www.youtube.com`, and later slider changes update it. The saved volume is used in two ways:

- When a captured tab moves to a site with a saved volume, the volume changes to it
- When the popup is opened on such a site, the slider starts at the saved volume, and turning on "Master volume" starts from it

Chrome starts a tab capture only after the extension is clicked, so opening a page alone does not apply its saved volume. Saved volumes are stored with Chrome sync.

### Picture-in-Picture, maximize in tab, and fullscreen

| Action | Popup button | Default shortcut |
| --- | --- | --- |
| Picture-in-Picture | "Picture-in-Picture" | Alt+Shift+P |
| Maximize in tab | "Maximize in tab" | Alt+Shift+M |
| Fullscreen | "Fullscreen" | Alt+Shift+F |

Each action toggles: running it again, or running it while any video is already in that state, turns the state off.

"Maximize in tab" shows the video over the whole page inside the tab, without entering fullscreen. The video gets the browser's own controls while it is maximized, and Esc or the action again returns it to its place on the page.

"Fullscreen" makes the video element itself fullscreen, without the site's player around it.

To change the shortcuts, click "Change shortcuts" in the popup, or open `chrome://extensions/shortcuts`.

### Target video

The actions work on one video of the page. By default (Auto), the extension picks a playing video first, then a video in view, then the largest one.

When the page has two or more videos, the popup lists them under "Target video" with their size on the page and whether they are playing, such as `#2  640×360  paused (muted)`. Pointing at an item outlines that video on the page for a few seconds. Choosing an item makes that video the target of the buttons and the shortcuts; choosing "Auto" goes back to the automatic choice. The choice ends when the tab moves to another page.

The extension finds videos in the page, in open shadow roots, and in frames from the same origin as the page.

### YouTube Shorts

With "Open YouTube Shorts as regular videos" checked in the popup (the default), a Shorts URL such as `https://www.youtube.com/shorts/VIDEO_ID` opens as `https://www.youtube.com/watch?v=VIDEO_ID`. This applies to Shorts opened from the address bar, from links on other sites, and from links inside YouTube.

## 🔒 Permissions

- `tabCapture` — capture the audio of a tab to change its volume
- `offscreen` — play the captured audio from a hidden extension page
- `activeTab` and `scripting` — find and control videos in the tab where the popup or a shortcut was used
- `declarativeNetRequestWithHostAccess` — redirect Shorts URLs to the watch page
- `storage` — remember the volume of each tab while the browser runs, and the saved volumes and the Shorts setting with Chrome sync
- Access to `youtube.com` — open Shorts as regular videos

## 🔧 Troubleshooting

### Fullscreen fills only the tab

While a tab's audio is captured, Chrome keeps fullscreen inside the tab. Turn off "Master volume" to use the normal fullscreen.

### The saved volume is not applied

Chrome lets an extension start a tab capture only after the extension is used on the tab. Open the popup and turn on "Master volume".

### "Master volume" cannot be turned on

Chrome does not capture `chrome://` pages or the Chrome Web Store. Turning on the switch shows the error from Chrome below the controls.

### A video is not found

Videos inside frames from another site, such as a YouTube player embedded in a blog, cannot be reached from the page. Open the video on its own site.

## 🧪 Development

| File | Role |
| --- | --- |
| `manifest.json` | Extension manifest |
| `core.js` | Volume values, storage keys, Shorts URL conversion, and calls into the page. Shared by the background, the popup, the YouTube content script, and the tests |
| `background.js` | Tracks the capture of each tab, applies saved volumes, shows the badge, runs the shortcuts, and switches the Shorts rule |
| `offscreen.html`, `offscreen.js` | Captures tab audio and changes its gain |
| `popup.html`, `popup.css`, `popup.js` | Toolbar popup |
| `media.js` | Script injected into pages to list, pick, and control videos |
| `youtube-main.js` | Content script in the page's own JavaScript context that changes YouTube's in-page navigation to Shorts into navigation to the watch page |
| `youtube.js` | Content script that passes the Shorts setting to `youtube-main.js` and redirects Shorts pages reached by other routes |
| `rules/shorts.json` | Redirect rule from Shorts URLs to watch URLs |
| `icons/` | Extension icons |
| `test/` | Unit tests for `core.js` |

Run the tests with Node.js 18 or later:

```bash
node --test
```

After editing, click the reload button on the extension's card in `chrome://extensions/`, then reload the page you test on.
