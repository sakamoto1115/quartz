import { registerCondition } from "./quartz/plugins/loader/conditions"
import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"
import { componentRegistry } from "./quartz/components/registry"
import ConstellationBackground from "./quartz/components/ConstellationBackground"
import ArticleDates from "./quartz/components/ArticleDates"
import { PageTypes } from "./quartz/plugins"

registerCondition("is-index", (props) => props.fileData.slug === "index")

// 背景の点滅→線がつながるアニメーション。レイアウトの特定スロットには置かず、
// 登録するだけでcss/afterDOMLoadedが全ページに配信される仕組みを利用している
componentRegistry.register("ConstellationBackground", ConstellationBackground, "quartz.ts")

// 「最近の更新」から自動生成の404ページを除外する
// (filterは関数なのでYAMLに書けず、TSオーバーライドで渡す)
// 「最近の更新」だけは更新日の新しい順で並べる。
// 一覧全体は defaultDateType: created で作成日順にしているが、
// この欄は名前のとおり直近に手を入れたものを出したいので上書きする。
componentRegistry.setOptionOverrides("@quartz-community/recent-notes", {
  filter: (f: { slug?: string }) => f.slug !== "404",
  sort: (a: { dates?: { modified?: Date } }, b: { dates?: { modified?: Date } }) =>
    (b.dates?.modified?.getTime() ?? 0) - (a.dates?.modified?.getTime() ?? 0),
})

const config = await loadQuartzConfig()
export default config

// 作成日と更新日を分けて表示する自前のコンポーネント。
// プラグインパッケージではないのでYAMLの plugins には書けず(sourceを解決できない)、
// 読み込み済みのレイアウトへ直接差し込んでいる。
// 位置は beforeBody の「note-properties の後・tag-list の前」＝インデックス3で、
// 無効化した content-meta(priority 20)がいた場所にあたる。
const articleDates = ArticleDates()

function insertArticleDates(slots?: { beforeBody?: unknown[] }) {
  const beforeBody = slots?.beforeBody
  // 404 のように beforeBody を空にしているページタイプには入れない
  if (!beforeBody || beforeBody.length === 0) return
  beforeBody.splice(Math.min(3, beforeBody.length), 0, articleDates)
}

const loadedLayout = await loadQuartzLayout()
insertArticleDates(loadedLayout.defaults)
for (const pageTypeLayout of Object.values(loadedLayout.byPageType)) {
  insertArticleDates(pageTypeLayout)
}

// loadQuartzConfig() は内部で loadQuartzLayout() を呼び、その結果を
// PageTypeDispatcher に閉じ込めてから emitters に積む。
// ここで読み直したレイアウトは別インスタンスなので、差し込んだだけでは描画に反映されない。
// 同じ構成のディスパッチャを作り直して差し替える。
const dispatcherIndex = config.plugins.emitters.findIndex((e) => e.name === "PageTypeDispatcher")
if (dispatcherIndex >= 0) {
  config.plugins.emitters[dispatcherIndex] = PageTypes.PageTypeDispatcher({
    defaults: loadedLayout.defaults,
    byPageType: loadedLayout.byPageType,
  })
}

export const layout = loadedLayout
