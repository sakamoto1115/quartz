#!/usr/bin/env bash
# figures/*.tex を SVG にコンパイルして content/ 以下へ配置する。
#
#   bash figures/build.sh              # 全ての .tex をビルド
#   bash figures/build.sh <name>.tex   # 1つだけビルド
#
# 生成物(SVG)はコミットする。CI(GitHub Actions)やCloudflare側には
# TeX Liveが無いので、ビルド済みのSVGがリポジトリに無いと図が欠ける。
#
# 必要なもの: TeX Live (uplatex, dvipdfmx) と pdftocairo(poppler)。
# dvisvgm は使わない。Ghostscript 10.1以上とは互換性が無く、
# TeX Live同梱の pdftocairo で代替できるため。

set -euo pipefail

cd "$(dirname "$0")"
BUILD_DIR=".build"
OUT_DIR="../content/figures"

# SVGの表示サイズの倍率。
# TeXのptがCSSピクセルに換算されると、図中の文字が本文よりかなり小さく出るので
# 全体を一律で拡大する。viewBox はそのままに width/height だけを掛けるので、
# 文字・線・間隔が同じ比率で拡大され、図どうしの見た目の縮尺も揃う。
SCALE=1.33

mkdir -p "$BUILD_DIR"

targets=("$@")
if [ ${#targets[@]} -eq 0 ]; then
  targets=(*.tex)
fi

for tex in "${targets[@]}"; do
  name="$(basename "$tex" .tex)"
  echo "==> $name"

  # 中間ファイルは .build/ に隔離する(-output-directory)
  uplatex -interaction=nonstopmode -halt-on-error \
          -output-directory="$BUILD_DIR" "$name.tex" > "$BUILD_DIR/$name.build.log" 2>&1 || {
    echo "    uplatex 失敗:"; grep -A3 '^! ' "$BUILD_DIR/$name.build.log" | head -20; exit 1;
  }

  dvipdfmx -q -o "$BUILD_DIR/$name.pdf" "$BUILD_DIR/$name.dvi"
  pdftocairo -svg "$BUILD_DIR/$name.pdf" "$BUILD_DIR/$name.svg"

  # width/height を SCALE 倍にする(viewBox は触らないので中身ごと拡大される)
  awk -v s="$SCALE" '
    !done && match($0, /width="[0-9.]+pt" height="[0-9.]+pt"/) {
      hdr = substr($0, RSTART, RLENGTH)
      split(hdr, a, "\"")
      $0 = substr($0, 1, RSTART - 1) \
           sprintf("width=\"%.2fpt\" height=\"%.2fpt\"", (a[2] + 0) * s, (a[4] + 0) * s) \
           substr($0, RSTART + RLENGTH)
      done = 1
    }
    { print }
  ' "$BUILD_DIR/$name.svg" > "$OUT_DIR/$name.svg"

  echo "    -> content/figures/$name.svg ($(wc -c < "$OUT_DIR/$name.svg") bytes, x$SCALE)"
done
