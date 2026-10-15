<p align="right"><strong>English</strong> / <a href="README_ja.md">日本語</a></p>

<h1 align="center">🎚️ Media Utils Chrome Extension</h1>

<p align="center"><strong>Take control of the sound and video in every tab.</strong></p>

Media Utils is a Manifest V3 Chrome extension written in plain JavaScript. There is no build step: the repository directory is the extension.

## ✨ Features

- **Per-tab master volume** — turn one loud tab down or boost a quiet one up to 200% without touching the system volume or other tabs, with the current level shown as a badge on the toolbar icon
- **Volume remembered per site** — save a volume for a site, synced with Chrome sync, and a captured tab switches to it whenever it moves to that site
- **Picture-in-Picture, maximize in tab, and fullscreen** — control any video the same way on every site from the toolbar popup or a keyboard shortcut, whether or not the site's player has its own buttons; maximize fills the tab without going fullscreen
- **Target video choice** — the extension picks the video you are most likely watching, and on pages with several videos you can choose which one the controls act on
- **Shorts as regular videos** — YouTube Shorts open on the regular watch page, with its seek bar, playback speed, and theater mode

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

Run the tests with Node.js 18 or later:

```bash
node --test
```

After editing, click the reload button on the extension's card in `chrome://extensions/`, then reload the page you test on.
