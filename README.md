# Everyday Apps Studio

iOS個人開発者「Everyday Apps Studio」の公式ポータルサイトです。アプリ紹介、アプリ別プライバシーポリシー、アプリ別利用規約、お問い合わせ窓口を、GitHub Pagesで無料公開するための静的サイトとして構成しています。

HTML / CSS / JavaScriptのみを使用し、ビルドやサーバー処理は不要です。

## GitHub Pagesで公開する

1. GitHubで新しいリポジトリを作成します。
2. このフォルダ内のファイルをリポジトリのルートへ配置し、`main` ブランチへpushします。
3. GitHubのリポジトリで **Settings → Pages** を開きます。
4. **Build and deployment** のSourceで **Deploy from a branch** を選択します。
5. Branchを **main**、Folderを **/ (root)** にして保存します。
6. 数分後に表示される公開URLへアクセスします。

プロジェクトサイトの場合、URLは通常 `https://ユーザー名.github.io/リポジトリ名/` です。このサイトは、リポジトリ名を含むサブディレクトリ配信でも内部リンクが動作するように構成しています。

App Store ConnectのプライバシーポリシーURLには、一覧ページではなく対象アプリの個別URLを登録してください。例：

```text
https://ユーザー名.github.io/リポジトリ名/privacy/fuufu-todo/
```

## ローカルで確認する

プロジェクトのルートで簡易HTTPサーバーを起動します。

```bash
python3 -m http.server 8000
```

ブラウザで `http://localhost:8000/` を開いてください。

## アプリを追加する

1. `assets/js/app-data.js` の `window.EVERYDAY_APPS` にアプリ情報を1件追加します。
2. 次の3ファイルを既存アプリのファイルから複製します。
   - `apps/新しいslug/index.html`
   - `privacy/新しいslug/index.html`
   - `terms/新しいslug/index.html`
3. 各HTMLの `data-slug`、`title`、`description` を新しいアプリに合わせて変更します。

一覧カード、アプリ詳細、プライバシーポリシー一覧、利用規約一覧は、`app-data.js` の内容から自動的に追加されます。slugには半角英小文字・数字・ハイフンを使用してください。

アイコン画像を使う場合は `assets/images/` に配置し、`assets/js/main.js` の `appIcon()` と `assets/css/style.css` を調整します。現在は画像なしでも成立する文字プレースホルダーを使用しています。

## プライバシーポリシーを修正する

共通の仮文面は `assets/js/main.js` の `privacySections()` にあります。アプリ名、開発者名、メールアドレス、最終更新日は `assets/js/app-data.js` の値が自動的に反映されます。

アプリごとに取得情報や利用サービスが異なる場合は、`privacySections()` 内で `app.slug` による条件分岐を追加してください。

## 利用規約を修正する

共通の仮文面は `assets/js/main.js` の `termsSections()` にあります。アプリ固有の条件を記載する場合は、同関数内で `app.slug` による条件分岐を追加してください。

## メールアドレスを変更する

`assets/js/app-data.js` の次の1行を変更します。お問い合わせページ、プライバシーポリシー、利用規約のメールリンクへ一括反映されます。

```js
email: "support@example.com",
```

## 公開前の確認

- `assets/js/app-data.js` の開発者名、メールアドレス、最終更新日を正式な内容へ変更する
- 各アプリのステータス、説明、対応機能を確認する
- 実際に取得する情報、広告SDK、分析SDK、課金、通知の仕様をプライバシーポリシーへ反映する
- App Store上の課金・サブスクリプション条件と利用規約を一致させる
- 公開URLですべてのページとメールリンクを確認する

> [!IMPORTANT]
> このサイトに含まれるプライバシーポリシーおよび利用規約は、公開準備用の仮文面であり、法的助言ではありません。実際のアプリの仕様、利用するSDK・外部サービス、対象地域の法令に合わせて修正し、必要に応じて弁護士などの専門家による確認を受けてください。

## 主なURL

| 内容 | パス |
| --- | --- |
| トップ | `/` |
| アプリ一覧 | `/apps/` |
| プライバシーポリシー一覧 | `/privacy/` |
| 利用規約一覧 | `/terms/` |
| お問い合わせ | `/contact/` |
| アプリ詳細 | `/apps/{slug}/` |
| アプリ別プライバシーポリシー | `/privacy/{slug}/` |
| アプリ別利用規約 | `/terms/{slug}/` |
