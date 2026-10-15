<p align="right"><a href="README.md">English</a> / <strong>日本語</strong></p>

<h1 align="center">🎚️ Media Utils Chrome Extension</h1>

<p align="center"><strong>すべてのタブの音と動画を思いどおりに</strong></p>

Media Utils は plain JavaScript で書いた Manifest V3 の Chrome 拡張機能である。ビルドは不要で、リポジトリのディレクトリがそのまま拡張機能になる。

## ✨ Features

- **タブごとのマスターボリューム** — システムの音量やほかのタブに触れずに、うるさいタブだけを下げたり、小さいタブを 200% まで上げたりできる。現在の音量はツールバーのアイコンにバッジで出る
- **サイトごとの音量の記憶** — サイトごとに音量を保存でき、保存は Chrome の同期で共有される。キャプチャ中のタブがそのサイトへ移ると、保存した音量に切り替わる
- **Picture-in-Picture、タブ内最大化、全画面** — サイトのプレイヤーに専用のボタンがあってもなくても、どのサイトの動画もツールバーの popup やキーボードショートカットから同じように操作できる。タブ内最大化では、全画面にせずにタブ全体に動画を広げる
- **対象の動画の選択** — いま見ている可能性が高い動画を自動で選び、動画が複数あるページでは操作する動画を自分で選べる
- **Shorts を通常の動画として開く** — YouTube Shorts を通常の視聴ページで開くので、シークバー、再生速度、シアターモードが使える

## 🚀 Quick Start

**前提**：デスクトップ版の Chrome 116 以降

1. このリポジトリを clone する

   ```bash
   git clone https://github.com/amaya382/chrome-media-utils.git
   ```

2. `chrome://extensions/` を開く
3. 「デベロッパー モード」をオンにする
4. 「パッケージ化されていない拡張機能を読み込む」を押し、clone したディレクトリを選ぶ

適当なサイトで動画を再生し、ツールバーの Media Utils のアイコンを押して「Master volume」をオンにする。スライダーを動かすと、そのタブの音量だけが変わる。

更新するときは `git pull` を実行し、`chrome://extensions/` で拡張機能のカードにある再読み込みボタンを押す。

## 🔒 Permissions

- `tabCapture`：音量を変えるためにタブの音声をキャプチャする
- `offscreen`：キャプチャした音声を、見えない拡張機能のページから再生する
- `activeTab` と `scripting`：popup やショートカットを使ったタブで、動画を探して操作する
- `declarativeNetRequestWithHostAccess`：Shorts の URL を視聴ページへリダイレクトする
- `storage`：ブラウザーの起動中にタブごとの音量を、Chrome の同期でサイトごとの音量と Shorts の設定を覚えておく
- `youtube.com` へのアクセス：Shorts を通常の動画として開く

## 🔧 Troubleshooting

### 全画面がタブの中にしか広がらない

タブの音声をキャプチャしている間、Chrome は全画面をタブの中に留める。通常の全画面にするには「Master volume」をオフにする。

### 保存した音量が適用されない

Chrome は、拡張機能がそのタブで使われた後でないとタブのキャプチャを始めさせない。popup を開いて「Master volume」をオンにする。

### 「Master volume」をオンにできない

Chrome は `chrome://` のページと Chrome ウェブストアをキャプチャしない。スイッチをオンにすると、Chrome が返したエラーがコントロールの下に表示される。

### 動画が見つからない

ブログに埋め込まれた YouTube のプレイヤーのように、別のサイトのフレームにある動画にはページから手が届かない。動画を元のサイトで開く。

## 🧪 Development

テストは Node.js 18 以降で実行する。

```bash
node --test
```

編集後は `chrome://extensions/` で拡張機能のカードにある再読み込みボタンを押し、確認に使うページも再読み込みする。
