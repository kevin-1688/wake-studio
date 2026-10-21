"""把匯出的網頁版放到網站的 play/wei-ni-hao-proto/，並更新 vercel.json 裡的 script 雜湊值。

用法（在這個專案的根目錄）：
    godot --headless --path . --export-release "Web" export/web/index.html
    python3 tools/publish_web.py

網站的 Content-Security-Policy 只允許指定雜湊值的行內 script。
Godot 每次匯出，index.html 裡那段行內 script 都可能不同，所以要重新計算。
"""
import base64
import hashlib
import json
import re
import shutil
from pathlib import Path

PROJECT = Path(__file__).resolve().parent.parent
SITE = PROJECT.parent.parent
SRC = PROJECT / "export" / "web"
DEST = SITE / "play" / "wei-ni-hao-proto"
GAME_SOURCE = "/play/wei-ni-hao-proto/(.*)"


def main() -> None:
    if not (SRC / "index.html").exists():
        raise SystemExit("找不到 export/web/index.html，請先匯出網頁版。")

    if DEST.exists():
        shutil.rmtree(DEST)
    shutil.copytree(SRC, DEST)

    html = (DEST / "index.html").read_text(encoding="utf-8")
    scripts = re.findall(r"<script>(.*?)</script>", html, re.S)
    hashes = [
        "'sha256-%s'" % base64.b64encode(hashlib.sha256(s.encode("utf-8")).digest()).decode()
        for s in scripts
    ]

    vercel = SITE / "vercel.json"
    cfg = json.loads(vercel.read_text(encoding="utf-8"))
    rule = next(r for r in cfg["headers"] if r["source"] == GAME_SOURCE)
    csp = next(h for h in rule["headers"] if h["key"] == "Content-Security-Policy")
    parts = [p.strip() for p in csp["value"].split(";")]
    for i, part in enumerate(parts):
        if part.startswith("script-src"):
            kept = [t for t in part.split()[1:] if not t.startswith("'sha256-")]
            parts[i] = " ".join(["script-src", *kept, *hashes])
    csp["value"] = "; ".join(parts)
    vercel.write_text(json.dumps(cfg, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"已複製到 {DEST.relative_to(SITE)}/，script 雜湊值：{' '.join(hashes)}")


if __name__ == "__main__":
    main()
