import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"

// @quartz-community/content-meta の置き換え。
// あちらは created / modified のうち defaultDateType で指定した片方しか出せないので、
// 作成日と更新日を分けて表示するために自前で用意している。
//
// 読了時間は content-meta が同梱している reading-time パッケージの実装を移植したもの
// (トップレベルの依存に無いため)。CJKは1文字=1語、それ以外は単語境界で数える。

interface Options {
  showReadingTime: boolean
  createdLabel: string
  modifiedLabel: string
}

const defaultOptions: Options = {
  showReadingTime: true,
  createdLabel: "作成",
  modifiedLabel: "更新",
}

function isCJK(c: string): boolean {
  if (!c) return false
  const code = c.charCodeAt(0)
  return (
    (code >= 0x3040 && code <= 0x30ff) || // ひらがな・カタカナ
    (code >= 0x3400 && code <= 0x4dbf) || // CJK拡張A
    (code >= 0x4e00 && code <= 0x9fff) || // CJK統合漢字
    (code >= 0xf900 && code <= 0xfaff) // CJK互換漢字
  )
}

function isWordBound(c: string): boolean {
  return c === undefined || " \n\r\t".includes(c)
}

function countWords(text: string): number {
  let words = 0
  let start = 0
  let end = text.length - 1
  while (isWordBound(text[start])) start++
  while (end >= 0 && isWordBound(text[end])) end--

  const t = `${text}\n`
  for (let i = start; i <= end; i++) {
    if (isCJK(t[i]) || (!isWordBound(t[i]) && (isWordBound(t[i + 1]) || isCJK(t[i + 1])))) {
      words++
    }
  }
  return words
}

function formatDate(d: Date, locale: string): string {
  return d.toLocaleDateString(locale, { year: "numeric", month: "short", day: "2-digit" })
}

export default ((userOpts?: Partial<Options>) => {
  const opts = { ...defaultOptions, ...userOpts }

  const ArticleDates: QuartzComponent = ({ cfg, fileData, displayClass }: QuartzComponentProps) => {
    const dates = fileData.dates
    if (!dates) return null

    const locale = cfg.locale ?? "en-US"
    const created = dates.created
    const modified = dates.modified

    // 作成と更新が同日なら、更新側は出さずに1つだけ出す
    const sameDay =
      created && modified && formatDate(created, locale) === formatDate(modified, locale)

    const segments: preact.JSX.Element[] = []

    if (created) {
      segments.push(
        <span class="date-item">
          <span class="date-label">{opts.createdLabel}</span>
          <time datetime={created.toISOString()}>{formatDate(created, locale)}</time>
        </span>,
      )
    }

    if (modified && !sameDay) {
      segments.push(
        <span class="date-item">
          <span class="date-label">{opts.modifiedLabel}</span>
          <time datetime={modified.toISOString()}>{formatDate(modified, locale)}</time>
        </span>,
      )
    }

    if (opts.showReadingTime && fileData.text) {
      const minutes = countWords(fileData.text) / 200
      segments.push(<span class="date-item">{Math.ceil(minutes.toFixed(2) as any)} min read</span>)
    }

    if (segments.length === 0) return null

    // 項目の間に中黒を挟む。flexのgapだけに頼ると、折り返したときや
    // 読み上げ・テキスト選択時に区切りが分からなくなるため
    const withSeparators = segments.flatMap((seg, i) =>
      i === 0
        ? [seg]
        : [
            <span class="date-sep" aria-hidden="true">
              ·
            </span>,
            seg,
          ],
    )

    return <p class={classNames(displayClass, "content-meta", "article-dates")}>{withSeparators}</p>
  }

  ArticleDates.css = `
.article-dates {
  margin-top: 0;
  /* --gray(#b8b8b8)は地のグラデーションに対して薄すぎるので一段濃い色にする */
  color: var(--darkgray);
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.2rem 0.55rem;
}

.article-dates .date-item {
  display: inline-flex;
  align-items: baseline;
  gap: 0.4em;
  white-space: nowrap;
}

.article-dates .date-sep {
  opacity: 0.5;
  user-select: none;
}

.article-dates .date-label {
  font-size: 0.85em;
  /* ラベルだけ更に薄くすると読みにくいので、濃さは本体と揃えて字送りで差をつける */
  letter-spacing: 0.04em;
}
`

  return ArticleDates
}) satisfies QuartzComponentConstructor<Partial<Options> | undefined>
