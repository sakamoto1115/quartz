import { QuartzComponent, QuartzComponentConstructor } from "./types"

// レイアウトのどこにも配置しない、サイト全体の背景専用コンポーネント。
// componentRegistry に登録するだけで css/afterDOMLoaded が全ページに配信されるため、
// JSXは何も描画せず、canvas要素自体はスクリプト側でbodyに直接生成する。
const ConstellationBackground: QuartzComponent = () => null

ConstellationBackground.css = `
#constellation-bg {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  pointer-events: none;
}
`

ConstellationBackground.afterDOMLoaded = `
function quartzConstellationSetup() {
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

  var canvas = document.getElementById("constellation-bg")
  if (!canvas) {
    canvas = document.createElement("canvas")
    canvas.id = "constellation-bg"
    canvas.setAttribute("aria-hidden", "true")
    document.body.prepend(canvas)
  }
  var ctx = canvas.getContext("2d")
  if (!ctx) return

  var width, height, dpr

  function resize() {
    dpr = window.devicePixelRatio || 1
    width = window.innerWidth
    height = window.innerHeight
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = width + "px"
    canvas.style.height = height + "px"
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }
  resize()

  var POINT_COUNT_MIN = 6
  var POINT_COUNT_MAX = 8
  var TWINKLE_DURATION = 2800
  var LINE_STAGGER = 110
  var LINE_DURATION = 300
  var LINE_FADE_DURATION = 60 // 到着してから消えるまでの、ごく短いフェード
  var TAIL_FRACTION = 0.4 // 移動する点が引く尾の長さ(区間の割合)
  var HOLD_DURATION = 2200
  var IDLE_DURATION = 4000
  var FADE_DURATION = 900
  var MAX_DOT_ALPHA = 0.28
  var MAX_LINE_ALPHA = 0.25

  function randomPoints() {
    var pts = []
    var count = POINT_COUNT_MIN + Math.floor(Math.random() * (POINT_COUNT_MAX - POINT_COUNT_MIN + 1))
    for (var i = 0; i < count; i++) {
      pts.push({
        x: Math.random() * width,
        y: Math.random() * height,
        delay: Math.random() * TWINKLE_DURATION,
        seed: Math.random() * Math.PI * 2,
      })
    }
    return pts
  }

  // 近い点から順につないでいく経路(貪欲法)。「点を伝って線が通る」動きにするため
  function buildPath(pts) {
    var remaining = pts.slice()
    var path = [remaining.shift()]
    while (remaining.length) {
      var last = path[path.length - 1]
      var bestIdx = 0
      var bestDist = Infinity
      for (var i = 0; i < remaining.length; i++) {
        var dx = remaining[i].x - last.x
        var dy = remaining[i].y - last.y
        var d = dx * dx + dy * dy
        if (d < bestDist) {
          bestDist = d
          bestIdx = i
        }
      }
      path.push(remaining.splice(bestIdx, 1)[0])
    }
    return path
  }

  var points = randomPoints()
  var path = buildPath(points)
  var rafId = null
  var startTime = null

  function currentColor() {
    var dark = document.documentElement.getAttribute("saved-theme") === "dark"
    return dark ? "235,235,236" : "43,43,43"
  }

  function frame(ts) {
    if (!startTime) startTime = ts
    var t = ts - startTime
    ctx.clearRect(0, 0, width, height)
    var rgb = currentColor()

    var lineStart = TWINKLE_DURATION
    var lastLineStart = lineStart + Math.max(0, path.length - 2) * LINE_STAGGER
    var linesDone = lastLineStart + LINE_DURATION + LINE_FADE_DURATION
    var fadeStart = linesDone + HOLD_DURATION
    var cycleEnd = fadeStart + FADE_DURATION + IDLE_DURATION

    var globalAlpha = 1
    if (t > fadeStart) {
      globalAlpha = Math.max(0, 1 - (t - fadeStart) / FADE_DURATION)
    }

    points.forEach(function (p) {
      var localT = t - p.delay
      if (localT <= 0) return
      var a = Math.min(1, localT / 400)
      if (t > lineStart) {
        a = 0.7 + 0.3 * Math.sin((t - lineStart) / 500 + p.seed)
      }
      a = Math.max(0, Math.min(1, a)) * MAX_DOT_ALPHA * globalAlpha
      if (a <= 0.02) return
      ctx.beginPath()
      ctx.fillStyle = "rgba(" + rgb + "," + a + ")"
      ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2)
      ctx.fill()
    })

    // 点と点の間を、短い尾を引く光点が移動していく(区間全体をつなぐ線は描かない)
    if (t > lineStart) {
      for (var i = 0; i < path.length - 1; i++) {
        var segStart = lineStart + i * LINE_STAGGER
        var localT = t - segStart
        if (localT < 0) break
        if (localT > LINE_DURATION + LINE_FADE_DURATION) continue

        var p1 = path[i]
        var p2 = path[i + 1]
        var segT = Math.min(1, localT / LINE_DURATION)
        var tailT = Math.max(0, segT - TAIL_FRACTION)

        var hx = p1.x + (p2.x - p1.x) * segT
        var hy = p1.y + (p2.y - p1.y) * segT
        var tx = p1.x + (p2.x - p1.x) * tailT
        var ty = p1.y + (p2.y - p1.y) * tailT

        var a2 = MAX_LINE_ALPHA
        if (localT > LINE_DURATION) {
          var fadeT = (localT - LINE_DURATION) / LINE_FADE_DURATION
          a2 = MAX_LINE_ALPHA * (1 - fadeT)
        }

        ctx.beginPath()
        ctx.strokeStyle = "rgba(" + rgb + "," + a2 + ")"
        ctx.lineWidth = 1
        ctx.moveTo(tx, ty)
        ctx.lineTo(hx, hy)
        ctx.stroke()

        ctx.beginPath()
        ctx.fillStyle = "rgba(" + rgb + "," + a2 + ")"
        ctx.arc(hx, hy, 1.4, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    if (t > cycleEnd) {
      points = randomPoints()
      path = buildPath(points)
      startTime = ts
    }

    rafId = requestAnimationFrame(frame)
  }

  rafId = requestAnimationFrame(frame)
  window.addEventListener("resize", resize)
  window.addCleanup(function () {
    if (rafId) cancelAnimationFrame(rafId)
    window.removeEventListener("resize", resize)
  })
}

document.addEventListener("nav", quartzConstellationSetup)
`

export default (() => ConstellationBackground) satisfies QuartzComponentConstructor
