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
OUT_DIR="../content/set-topology"

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
  pdftocairo -svg "$BUILD_DIR/$name.pdf" "$OUT_DIR/$name.svg"

  echo "    -> content/set-topology/$name.svg ($(wc -c < "$OUT_DIR/$name.svg") bytes)"
done
