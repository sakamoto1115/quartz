---
title: ユークリッド空間から一般の位相へ
tags:
  - 位相空間論
noCite:
  - matsuzaka1968
  - uchida1986
---

## ユークリッド空間における写像の連続性

$\mathbb{R}$ （実数全体の集合） から $\mathbb{R}$ への写像 $f$ が点 $a$ で**連続**であるとは、

任意の正の数 $\varepsilon$ に対して、

$$
  | x - a | < \delta \Rightarrow | f(x) - f(a) | < \varepsilon \tag{1}
$$

となるような正の数 $\delta$ をいつでもとってこれますよ、という話だった。（$\varepsilon$ - $\delta$ 論法）

これを $m$ 次元と $n$ 次元のユークリッド空間で考えると、

式$(1)$の絶対値の部分がそれぞれの空間での距離 $d^{(m)} (x, a)$ と $d^{(n)} (f(x), f(a))$ に置き換わって

$$
  d^{(m)} (x, a) < \delta \Rightarrow d^{(n)} (f(x), f(a)) < \varepsilon \tag{2}
$$

という条件になる。

## 開集合による言い換え

一般の集合でも「連続」を考えるために、距離 $d^{(m)}, d^{(n)}$ が現れないような表現に変えていきたい。

まず「 $d^{(m)} (x, a) < \delta$ 」は「点 $a$ からの距離が $\delta$ 未満の点 $x$ について」と翻訳できる。

**開球体** $B^{(m)} (a; \delta)$ という概念を導入する。
ただの、 $m$ 次元空間の点 $a$ を中心とした半径 $\delta$ の球体（表面は含まない）のこと。

これで、

$$
  \begin{aligned}
    & \text{式}(2) \\
    & \Leftrightarrow \\
    & x \in B^{(m)} (a; \delta) \Rightarrow f(x) \in B^{(n)} (f(a); \varepsilon) \\
    & \Leftrightarrow \\
    & B^{(m)} (a; \delta) \subset f^{-1} \left( B^{(n)} (f(a); \varepsilon) \right) \tag{3}
  \end{aligned}
$$

と言い換えができる。

さらに、**開集合**という概念を導入する。
集合 $O$ が $\mathbb{R}^n$ の開集合というのは、任意の $a \in O$ に対して、
点 $a$ の十分近くの点がちゃんと $O$ に含まれていることが保証されている集合、というイメージ。

> [!note]- ユークリッド空間の開集合
>
> <div class="figure-row">
> <div>
>
> まず、点 $a \in O$ が**内点**であるとは、
> 「 $ B^{(n)} (a; \varepsilon) \subset O $ 」となるような正の数 $\varepsilon$ がとってこれること。
>
> $O$ の内点全体の集合を $O$ の**内部**といい、 $O^i$ と表す。
>
> $O$ が**開集合**であるとは、 $O = O^i$ をみたすことである。
>
> </div>
> <figure class="tikz-figure figure-row-aside">
>   <img src="./from-euclidean-to-topology-interior-point.svg" alt="集合 O の内部にある点 a と、a を中心とする開球体" />
> </figure>
> </div>

$\mathbb{R}^n$ の開集合は実は $B^{(n)} (a; \varepsilon)$ の集まりから構成できる。（開球体の集合は開集合系の基底になっている。）

おかげで、式 $(3)$ はさらに同値変形できて、

**「点 $a$ を含む任意の開集合 $O \subset \mathbb{R}^m$ に対して、逆像 $f^{-1} (O)$ も $\mathbb{R}^n$ の開集合になる」**

と言える。（詳細は割愛）
「写像 $f \colon \mathbb{R}^m \to \mathbb{R}^n$ が点 $a$ で連続である」をうまく言い換えて、距離が表に出てこない表現にすることができた。

## 位相の公理

ユークリッド空間における開集合がもつ性質をピックアップして、逆に公理としてあげれば、距離のかわりに開集合系を用意することで一般の集合でも「連続」が表現できる。

空でない集合 $S$ の部分集合系 $\mathfrak{O} \subset \mathfrak{P}(S)$ が次の3つの条件を満たすときに、
$\mathfrak{O}$ は $S$ の位相（の1つ）であるという。

> [!abstract] 位相の公理
>
> $\mathrm{(Oi)} \ S \in \mathfrak{O}$ かつ $\emptyset \in \mathfrak{O}$
>
> $\mathrm{(Oii)} \ O_1, O_2 \in \mathfrak{O}$ ならば $O_1 \cap O_2 \in \mathfrak{O}$
>
> $\mathrm{(Oiii)} \ \mathfrak{O}$ の元からなる任意の集合族 $(O_\lambda)_{\lambda \in \Lambda}$ について、$\displaystyle\bigcup_{\lambda \in \Lambda} O_\lambda \in \mathfrak{O}$

結局、これで一般の位相空間 $(X_1, \mathfrak{O}_1), (X_2, \mathfrak{O}_2)$ の間の写像 $f \colon X_1 \to X_2$ の連続性は、
**「任意の $O \in \mathfrak{O}_2$ に対して、逆像 $f^{-1} (O)$ が常に $\mathfrak{O}_1$ の元になる」**
と定められる。

## まとめ

<figure class="tikz-figure">
  <img src="./from-euclidean-to-topology-summary.svg" alt="ε-δ論法から出発して、開集合による言い換えを経て、位相の公理から位相空間での連続性に至る流れ" />
</figure>
