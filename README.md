# Everyday Apps Studio

iOS個人開発者「NANDAKAN」の公式ポータルサイトです。アプリ紹介、アプリ別プライバシーポリシー、アプリ別利用規約、サポート、データ削除案内、お問い合わせ窓口を、GitHub Pagesで公開するための静的サイトとして構成しています。

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
2. 次の4ファイルを既存アプリのファイルから複製します。
   - `apps/新しいslug/index.html`
   - `privacy/新しいslug/index.html`
   - `terms/新しいslug/index.html`
   - `support/新しいslug/index.html`
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
email: "nandakan.studio@gmail.com",
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
| サポート一覧 | `/support/` |
| アプリ詳細 | `/apps/{slug}/` |
| アプリ別プライバシーポリシー | `/privacy/{slug}/` |
| アプリ別利用規約 | `/terms/{slug}/` |
| アプリ別サポート | `/support/{slug}/` |
| 夫婦稟議のデータ削除案内 | `/account-deletion/fuufu-ringi/` |

## 夫婦稟議をApp Store Connectへ登録する際のURL

公開ドメインを `https://example.com` とした場合は、次を登録します。

| App Store Connectの項目 | URL |
| --- | --- |
| プライバシーポリシーURL | `https://example.com/privacy/fuufu-ringi/` |
| サポートURL | `https://example.com/support/fuufu-ringi/` |
| マーケティングURL | `https://example.com/apps/fuufu-ringi/` |
| ユーザーのプライバシー選択URL（任意） | `https://example.com/account-deletion/fuufu-ringi/` |

`app-ads.txt` は公開ドメイン直下の `https://example.com/app-ads.txt` で取得できる必要があります。

> [!WARNING]
> Webのデータ削除案内だけでは、Appleのアプリ内アカウント削除要件を満たしません。夫婦稟議のリリース版では、アプリ内から削除を開始できる機能を実装し、サイトの説明と実際の挙動を一致させてください。

## ウェブサイトのアクセス解析（GA4）

- 本サイトの測定IDは `assets/js/analytics.js` の `MEASUREMENT_ID` で管理します。
- 初回は許可・拒否を同じ大きさのボタンで提示します。許可前や拒否時はGoogleタグを読み込まず、解析イベントも送信しません。画面左下の設定ボタンから選択を変更できます。
- 選択はブラウザのローカルストレージに180日間保存します。許可の取り消し時は解析を無効化し、本サイトのパスに設定したGA Cookieを削除して再読み込みします。
- `page_view` と、公開済みApp Store IDの許可リストに一致する `app_store_click` を明示的に送ります。後者には `app_slug` と `app_store_id` が含まれます。新しい公開アプリの計測を追加する際は `knownApps` を更新してください。
- ページURLのクエリ・フラグメント、参照元のパスとクエリ、フォーム入力値は含めません。UTMキャンペーン値も送信しないため、流入元の分析は参照元サイトなどをもとに行います。広告機能・Googleシグナルは無効です。
- **GA4管理画面側で拡張計測機能をOFFに維持してください。** 自動フォーム計測・自動外部リンク計測・サイト内検索などを有効にすると、この実装の範囲外のデータが収集される可能性があります。新しいGoogleタグやGTMを併設しないでください。
- サイト向けの説明は `/privacy/#website-analytics` にあります。アプリ内のデータ処理の説明とは別です。
- 通常のHTMLページを追加する際は `assets/css/analytics.css` と `assets/js/analytics.js` を正しい相対パスで参照し、スクリプトには `defer` を付けてください。Google所有権確認ファイルは変更しません。

テスト（依存パッケージ不要、Node.js 18以降）:

```bash
node --test tests/*.test.js
```

公開後はブラウザのネットワークで、未選択・拒否時にGoogle解析の通信がないこと、許可時に正しい測定IDとクエリを除いたURLでページビューが送られること、設定変更とCookie削除が反映されることを確認します。GA4のリアルタイムでも受信を確認してください。ブロッカーや拒否した訪問は計測されないため、実際の全訪問数とは一致しません。
