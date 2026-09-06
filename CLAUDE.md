# CLAUDE.md

このファイルは、このリポジトリでコードを扱う際にClaude Code (claude.ai/code) が参照するガイダンスです。

## このリポジトリについて

これは [Quartz v5](https://quartz.jzhao.xyz/)(markdownノートを「デジタルガーデン」として公開する静的サイトジェネレーター)の個人用フォークです。実際に公開されるコンテンツは `content/` にあり、`quartz/` 以下はジェネレーター本体(ほぼ upstream 由来のフレームワークコード)です。サイトは `public/` にビルドされ、GitHub → Cloudflare 経由でデプロイされます(詳細は「デプロイ」節を参照)。

- `content/` — このサイトのmarkdownソース(現状は `index.md`、`Hello.md` のみの最小構成)。公開ページを追加・変更する際はここを編集する。
- `docs/` — Quartz自体のドキュメントコンテンツ(`npm run docs` で別のドキュメントサイトとしてビルドされる。個人サイトの一部ではない)。
- `quartz/` — Quartz v5ジェネレーター本体のソース(CLI、ビルドパイプライン、プラグイン、コンポーネント)。

## コマンド

```bash
npm install                    # 依存関係のインストール
npx quartz plugin install      # quartz.config.yaml で参照されているコミュニティプラグインのインストール/同期
npm run check                  # tsc --noEmit + prettier --check(コミット前に実行)
npm run format                 # prettier --write
npm test                       # tsx --test を実行(全ての *.test.ts)
npx quartz build --serve       # ライブリロード付きのローカル開発サーバー(public/ にビルドし配信+監視)
npx quartz build               # public/ への一回限りの本番ビルド
npm run docs                   # Quartz自体のドキュメント(docs/)を `-d docs` 出力でビルド
```

単一のテストファイルを実行するには `tsx --test path/to/file.test.ts` を直接使う(テストはすべてNode標準の `node:test` を使用し、`quartz/plugins/loader/config-loader.test.ts` のようにソースと同じ場所に `*.test.ts` として配置されている)。

その他のCLIエントリーポイント(`npx quartz <cmd>`、`quartz/bootstrap-cli.mjs` で定義):

- `create` — 新しいQuartzコンテンツフォルダをスキャフォールド(コンテンツが既に存在するここでは不要)
- `sync` — ローカルのコンテンツ変更を設定済みのQuartzフォークへcommit/pull/push
- `upgrade` — Quartzコア本体を最新版へアップグレード
- `plugin add/remove/list/enable/disable/config/prune` — `quartz.config.yaml` のコミュニティプラグイン管理

Node >=22 が必須(CLI起動時にチェックされる)。`.node-version` は `v22.16.0` を固定。`.npmrc` は `legacy-peer-deps=true` を設定している。

## アーキテクチャ

### 設定の読み込み

`quartz.ts` がQuartzコードが実際にimportする設定エントリーポイントであり、`quartz/plugins/loader/config-loader.ts` の `loadQuartzConfig()` / `loadQuartzLayout()` を呼び出す。これらは `quartz.config.yaml` を読み込む(存在しない場合は `quartz.config.default.yaml` にフォールバック — このリポジトリは現状デフォルトファイルのみでオーバーライドは無い)。YAMLには2つのトップレベルセクションがある:

- `configuration` — サイト全体の設定(タイトル、テーマの色/フォント、analytics、`baseUrl`、`ignorePatterns`、locale)。
- `plugins` — `{ source, enabled, order, options, layout }` のエントリーの順序付きリスト。

高度なケースでは、`quartz.ts` から `loadQuartzConfig()` に設定オーバーライドのオブジェクトを渡すこともできる。

### プラグインシステム

プラグインは2種類に分かれる:

- **内部プラグイン** — `quartz/plugins/{transformers,filters,emitters,pageTypes}` 以下に直接バンドルされている。
- **コミュニティプラグイン** — `quartz.config.yaml` の `source` で参照される独立したパッケージ。npmパッケージ名(例: `@quartz-community/search`、既に `package.json` の依存関係に記載済み)か、`github:org/repo` 形式のソースで `npx quartz plugin install` により `.quartz/plugins/` にインストールされるかのいずれか。このリポジトリのデフォルト設定は `@quartz-community/*` のnpmパッケージのみを使用しているため、`quartz.config.yaml` をgitソースのプラグインでカスタマイズしない限り `plugin install` はほぼ何もしない。

各プラグインは以下の4種類のいずれかとして自身を宣言する(`quartz/plugins/types.ts`):

- **Transformers(変換)** — パース済みコンテンツをmapする(例: frontmatterのパース、説明文の生成)。
- **Filters(フィルタ)** — コンテンツを除外する(例: draft記事)。
- **Emitters(出力)** — コンテンツを出力ファイルへreduceする(例: RSS、タグページ)。
- **Page Types(ページタイプ)** — ページカテゴリごとのレンダリング方法を定義し、任意でページの「フレーム」/テンプレート(`default`、`minimal` など — 設定内の `layout.byPageType.<type>.template` を参照)を選択できる。

`order` はプラグインのカテゴリ内での実行順序を制御する。プラグインのマニフェスト(`package.json` の `"quartz"` フィールド由来)は他のプラグインソースへの `dependencies` を宣言でき、`config-loader.ts` は設定読み込み時に順序の妥当性検証と循環依存の検出を行う。

### ビルドパイプライン

`quartz/build.ts` が以下を統括する: コンテンツファイルのglob → `parseMarkdown`(ワーカープール経由、`quartz/worker.ts` + `quartz/processors/parse.ts`)→ `filterContent` → `emitContent`、そして出力ディレクトリ(デフォルト `public/`)へ書き込む。`quartz build --serve --watch`(`--serve` のデフォルト動作)は `chokidar` によるウォッチャーを起動し続け、差分ビルドを行いながらWebSocket経由でブラウザへライブリロードを送信する。

### レイアウトとコンポーネント

`FullPageLayout`(`quartz/cfg.ts`)は Preact コンポーネント(`quartz/components/`)を `head`、`header`、`beforeBody`、`pageBody`、`afterBody`、`left`、`right`、`footer` という名前付きスロットに構成する。`quartz.config.yaml` に `layout` ブロックを持つプラグインは、`priority`(ツールバーグループやモバイル専用要素向けの任意の `group`/`display` も含む)を指定してスロットに配置される。設定内の `layout.byPageType` は、ページタイプ(content/folder/tag/canvas/bases/404)ごとにスロットの内容やページフレームを上書きできる。

## デプロイ

CI(`.github/workflows/ci.yaml`)は `v5` へのすべてのpush/PRで実行される: `npm install` → `npx quartz plugin install` → `npm run check` → `npm test` → `npx quartz build --bundleInfo -d docs`。

`deploy-v5.yaml` は `public/` をビルドし、`v5` へのpush時に **Cloudflare Pages** へデプロイする。これとは別に、`wrangler.jsonc`(プロジェクト名 `notes`、`assets.directory: public`)が **Cloudflare Workers static assets** によるデプロイを代替/新方式として設定している — こちらはまだCIワークフローに組み込まれていないため、これ経由で公開する場合はローカルで `npx quartz build` の後に `npx wrangler deploy` を実行する(またはワークフローにステップを追加する)必要がある。
