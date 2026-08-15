import { registerCondition } from "./quartz/plugins/loader/conditions"
import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"

registerCondition("is-index", (props) => props.fileData.slug === "index")

const config = await loadQuartzConfig()
export default config
export const layout = await loadQuartzLayout()
