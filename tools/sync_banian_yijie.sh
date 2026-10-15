#!/bin/bash
# 把《八年一節》網頁版（私人倉庫 kevin-1688/-banian-yijie）同步到 play/banian-yijie/。
# 用法：tools/sync_banian_yijie.sh <八年一節倉庫路徑>
# 遊戲本體以那個倉庫為準，這裡只是發布用的複本；遊戲改了就重跑一次。
set -euo pipefail
SRC="${1:?用法：tools/sync_banian_yijie.sh <八年一節倉庫路徑>}"
DST="$(cd "$(dirname "$0")/.." && pwd)/play/banian-yijie"
mkdir -p "$DST/audio"
cp "$SRC/game.js" "$DST/game.js"
cp "$SRC"/godot/assets/audio/*.wav "$DST/audio/"
# 音檔改放 audio/；頁尾加回到案例頁的連結；補上分享用的 og 標籤
sed -e 's|<html lang="zh-Hant">|<html lang="zh-Hant" data-audio-base="audio/">|' \
    -e 's|</footer>| <a href="../../projects/civic-games.html" style="color:inherit">← WAKE 公民議題遊戲</a></footer>|' \
    -e 's|</title>|</title>\
<meta property="og:title" content="八年一節｜台中市政諷刺模擬遊戲｜WAKE">\
<meta property="og:description" content="八年預算，你會把錢花在購物節，還是垃圾山、廚餘湖與捷運藍線？">\
<meta property="og:image" content="https://wake.com.tw/assets/og-image.jpg">\
<meta property="og:url" content="https://wake.com.tw/play/banian-yijie/">|' \
    "$SRC/index.html" > "$DST/index.html"
echo "已同步到 $DST"
