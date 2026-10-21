"""把 Noto Sans TC 裁成只含遊戲裡用到的字。

用法：python3 tools/subset_font.py 路徑/NotoSansTC[wght].ttf
在專案根目錄執行。輸出到 assets/fonts/NotoSansTC-Subset.ttf。
"""
import glob
import sys

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

OUT = "assets/fonts/NotoSansTC-Subset.ttf"
EXTRA = "，。、；：？！「」『』（）—…・｜／＋－→←↑↓★☆①②③④⑤⑥⑦⑧　％"


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    chars = set(EXTRA) | {chr(c) for c in range(32, 127)}
    for path in glob.glob("scripts/*.gd"):
        with open(path, encoding="utf-8") as f:
            chars |= set(f.read())
    chars -= set("\n\r\t")

    font = TTFont(sys.argv[1])
    if "fvar" in font:
        font = instancer.instantiateVariableFont(font, {"wght": 500})
    options = subset.Options()
    options.layout_features = ["*"]
    options.name_IDs = ["*"]
    options.notdef_outline = True
    subsetter = subset.Subsetter(options)
    subsetter.populate(text="".join(sorted(chars)))
    subsetter.subset(font)
    font.save(OUT)

    cmap = font.getBestCmap()
    missing = sorted(c for c in chars if ord(c) not in cmap and c != " ")
    print(f"{len(chars)} 個字 → {OUT}")
    if missing:
        print("字型裡沒有：", "".join(missing))


if __name__ == "__main__":
    main()
