<p align="right"><a href="README.md">English</a> / <strong>日本語</strong></p>

<h1 align="center">🎚️ Media Utils</h1>

<p align="center">
  <strong>Chrome でタブごとにマスターボリュームを設定し、ページ上の動画を操作する</strong><br/>
  Picture-in-Picture、タブ内最大化、全画面はツールバーの popup とキーボードショートカットから使え、YouTube Shorts は通常の動画として開く。
</p>

Media Utils は plain JavaScript で書いた Manifest V3 の Chrome 拡張機能である。ビルドは不要で、リポジトリのディレクトリがそのまま拡張機能になる。

## Why Media Utils?

- **タブ単位の音量、100% 超えも可能** — タブの音声をゲイン段に通すので、システムの音量やほかのタブに触れずに、うるさいタブだけを下げたり、小さいタブを 200% まで上げたりできる
- **どのプレイヤーも同じ操作** — Picture-in-Picture、タブ内最大化、全画面は、サイトのプレイヤーに専用のボタンがあってもなくても、どのサイトでも同じように使える
- **Shorts を通常のプレイヤーで** — Shorts のリンクは通常の視聴ページで開くので、シークバー、再生速度、シアターモードが使える

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

## 📖 Usage

### マスターボリューム

popup の「Master volume」をオンにするとタブの音声のキャプチャが始まり、スライダーで音量を 0% から 200% の範囲で設定できる。キャプチャ中は拡張機能のアイコンに `150` のような音量のバッジが付き、Chrome がタブにキャプチャ中の表示を出す。「Reset」は音量を 100% に戻すだけで、キャプチャは止めない。スイッチをオフにするとキャプチャが止まり、タブは本来の音声に戻る。

音量はタブごとに持つ。タブが別のページへ移っても、別のサイトへ移っても続き、スイッチをオフにするかタブを閉じると解除される。

「Remember for *サイト*」にチェックを入れると、`www.youtube.com` のようなホスト名ごとに現在の音量を保存し、以後のスライダー操作で更新する。保存した音量は次の 2 つの場面で使う。

- キャプチャ中のタブが保存のあるサイトへ移ると、その音量に切り替わる
- 保存のあるサイトで popup を開くと、スライダーが保存した音量から始まり、「Master volume」をオンにするとその音量でキャプチャが始まる

Chrome は拡張機能のアイコンを押した後でないとタブのキャプチャを始めないので、ページを開いただけでは保存した音量は適用されない。保存した音量は Chrome の同期で保存される。

### Picture-in-Picture、タブ内最大化、全画面

| 操作 | popup のボタン | 既定のショートカット |
| --- | --- | --- |
| Picture-in-Picture | 「Picture-in-Picture」 | Alt+Shift+P |
| タブ内最大化 | 「Maximize in tab」 | Alt+Shift+M |
| 全画面 | 「Fullscreen」 | Alt+Shift+F |

どの操作も切り替え式で、もう一度実行するか、すでにその状態の動画があるときに実行すると解除する。

「Maximize in tab」は、全画面にせずに、タブの中でページ全体を覆うように動画を表示する。最大化中の動画にはブラウザー標準のコントロールが付き、Esc かもう一度の操作でページ上の元の位置に戻る。

「Fullscreen」は、サイトのプレイヤーの枠を含めずに動画要素そのものを全画面にする。

ショートカットは、popup の「Change shortcuts」か `chrome://extensions/shortcuts` で変更できる。

### 対象の動画

操作はページ上の動画 1 つに対して行う。既定 (Auto) では、再生中の動画、画面に見えている動画、最も大きい動画の順に選ぶ。

ページに動画が 2 つ以上あると、popup の「Target video」に `#2  640×360  paused (muted)` のように、ページ上の大きさと再生状態つきで一覧が出る。項目にカーソルを乗せると、ページ上の該当する動画に数秒間枠が付く。項目を選ぶとその動画がボタンとショートカットの対象になり、「Auto」を選ぶと自動の選択に戻る。選択はタブが別のページへ移ると解除される。

動画は、ページ本体、open な shadow root、ページと同じ origin のフレームの中から探す。

### YouTube Shorts

popup の「Open YouTube Shorts as regular videos」にチェックが入っていると (既定)、`https://www.youtube.com/shorts/VIDEO_ID` のような Shorts の URL を `https://www.youtube.com/watch?v=VIDEO_ID` として開く。アドレスバーから開いた場合、ほかのサイトのリンクから開いた場合、YouTube 内のリンクから開いた場合のどれにも適用される。

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

| File | Role |
| --- | --- |
| `manifest.json` | 拡張機能の manifest |
| `core.js` | 音量の値、storage のキー、Shorts の URL 変換、ページ内の関数の呼び出し。background、popup、YouTube 用 content script、テストで共有する |
| `background.js` | タブごとのキャプチャ状態を管理し、保存した音量の適用、バッジの表示、ショートカットの実行、Shorts のルールの切り替えを行う |
| `offscreen.html`、`offscreen.js` | タブの音声をキャプチャし、ゲインを変える |
| `popup.html`、`popup.css`、`popup.js` | ツールバーの popup |
| `media.js` | 動画の列挙、選択、操作のためにページへ注入するスクリプト |
| `youtube-main.js` | ページ本来の JavaScript 環境で動き、YouTube のページ内遷移の行き先を Shorts から視聴ページに差し替える content script |
| `youtube.js` | Shorts の設定を `youtube-main.js` に渡し、ほかの経路で開いた Shorts のページをリダイレクトする content script |
| `rules/shorts.json` | Shorts の URL から視聴ページの URL へのリダイレクトルール |
| `icons/` | 拡張機能のアイコン |
| `test/` | `core.js` の単体テスト |

テストは Node.js 18 以降で実行する。

```bash
node --test
```

編集後は `chrome://extensions/` で拡張機能のカードにある再読み込みボタンを押し、確認に使うページも再読み込みする。
