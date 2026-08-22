import { registerCondition } from "./quartz/plugins/loader/conditions"
import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"
import { componentRegistry } from "./quartz/components/registry"
import ConstellationBackground from "./quartz/components/ConstellationBackground"

registerCondition("is-index", (props) => props.fileData.slug === "index")

// 背景の点滅→線がつながるアニメーション。レイアウトの特定スロットには置かず、
// 登録するだけでcss/afterDOMLoadedが全ページに配信される仕組みを利用している
componentRegistry.register("ConstellationBackground", ConstellationBackground, "quartz.ts")

// 「最近の更新」から自動生成の404ページを除外する
// (filterは関数なのでYAMLに書けず、TSオーバーライドで渡す)
componentRegistry.setOptionOverrides("@quartz-community/recent-notes", {
  filter: (f: { slug?: string }) => f.slug !== "404",
})

const config = await loadQuartzConfig()
export default config
export const layout = await loadQuartzLayout()
