# -*- coding: utf-8 -*-
"""GEO（生成式搜尋引擎最佳化）：讓 ChatGPT、Perplexity、Google AI 摘要這類 AI 搜尋讀得懂 wake.com.tw。

從 works.html／en/works.html 的卡片讀出作品清單，產生：
  - llms.txt                 給 AI 讀的網站摘要（llmstxt.org 格式）
  - sitemap.xml              全部頁面、中英對照（hreflang）、最後修改日取自 git
  - 各頁的 JSON-LD 結構化資料（夾在 <!-- geo:jsonld --> 標記之間，可重複執行）
  - 各頁的 canonical 連結

新增作品或頁面後重跑一次：python3 tools/gen_geo.py
"""
import html
import json
import os
import re
import subprocess

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SITE = "https://wake.com.tw"
ORG_ID, PERSON_ID, SITE_ID = SITE + "/#org", SITE + "/#person", SITE + "/#website"
GITHUB = "https://github.com/kevin-1688"
EMAIL = "kevin@wake.com.tw"

# (中文頁, 英文頁, 網址路徑)
PAGES = [
    ("index.html", "en/index.html", ""),
    ("works.html", "en/works.html", "works.html"),
    ("about.html", "en/about.html", "about.html"),
    ("contact.html", "en/contact.html", "contact.html"),
    ("projects/civic-games.html", "en/projects/civic-games.html", "projects/civic-games.html"),
    ("projects/3d-product-visualization.html", "en/projects/3d-product-visualization.html", "projects/3d-product-visualization.html"),
]
PLAY = ["play/wei-ni-hao/index.html", "play/banian-yijie/index.html"]  # 由其他倉庫同步進來，不改內容，只列進 sitemap


def read(p):
    with open(os.path.join(ROOT, p), encoding="utf-8") as f:
        return f.read()


def write(p, s):
    with open(os.path.join(ROOT, p), "w", encoding="utf-8") as f:
        f.write(s)


def text(s):
    return html.unescape(re.sub(r"<[^>]+>", "", s)).strip()


def url_of(path, en=False):
    if en:
        return SITE + "/en/" + path
    return SITE + "/" + path


def lastmod(p):
    try:
        out = subprocess.run(["git", "log", "-1", "--format=%cs", "--", p], cwd=ROOT,
                             capture_output=True, text=True).stdout.strip()
        return out or None
    except OSError:
        return None


def meta(page, name):
    m = re.search(r'<meta (?:name|property)="%s" content="([^"]*)"' % re.escape(name), page)
    return html.unescape(m.group(1)) if m else ""


# ---------------------------------------------------------------- 作品清單

def parse_works(page_path, base):
    s = read(page_path)
    works = []
    f = re.search(r'<article class="feature[^"]*">(.*?)</article>', s, re.S)
    if f:
        b = f.group(1)
        no = re.search(r'<p class="meta">(.*?)</p>', b).group(1)
        works.append({
            "id": re.search(r"WAKE-\d+", no).group(0),
            "years": re.search(r"20\d\d.*$", text(no)).group(0),
            "name": text(re.search(r"<h3>(.*?)</h3>", b).group(1)),
            "kind": text(re.search(r'<p class="kind">(.*?)</p>', b).group(1)),
            "desc": text(re.search(r"<p>(.*?)</p>", b, re.S).group(1)),
            "status": "",
            "tags": [text(t) for t in re.findall(r"<span>(.*?)</span>", b)],
            "links": [(h, text(t)) for h, t in re.findall(r'<a class="btn" href="([^"]+)"[^>]*>(.*?)</a>', b)],
        })
    for b in re.findall(r'<article class="card">(.*?)</article>', s, re.S):
        no = text(re.search(r'<p class="no">(.*?)</p>', b).group(1))
        st = re.search(r'<span class="status[^"]*">(.*?)</span>', b)
        works.append({
            "id": re.search(r"WAKE-\d+", no).group(0),
            "years": no.split("/")[-1].split("／")[-1].strip(),
            "name": text(re.search(r"<h4>(.*?)</h4>", b).group(1)),
            "kind": text(re.search(r'<p class="en-name">(.*?)</p>', b).group(1)),
            "desc": text(re.search(r"<p>(.*?)</p>", b, re.S).group(1)),
            "status": text(st.group(1)) if st else "",
            "tags": [text(t) for t in re.findall(r"<span>(.*?)</span>", b)],
            "links": [(h, text(t)) for h, t in re.findall(r'<a class="link" href="([^"]+)"[^>]*>(.*?)</a>', b)],
        })
    for w in works:  # 相對網址轉成絕對網址
        w["links"] = [(h if h.startswith("http") else SITE + "/" + os.path.normpath(os.path.join(base, h)).replace("\\", "/")
                       + ("/" if h.endswith("/") else ""), t) for h, t in w["links"]]
    return works


GAME_WORDS = ("GAME", "PUZZLE", "SIMULATOR", "SATIRE", "ADVENTURE", "遊戲")


def is_game(w_en):
    return any(k in (w_en["name"] + " " + w_en["kind"] + " " + " ".join(w_en["tags"])).upper() for k in GAME_WORDS)


def work_ld(w, w_en, lang):
    game = is_game(w_en)
    links = [h for h, _ in w["links"]]
    play = next((h for h in links if "/play/" in h or "vercel.app" in h or "luku" in h), None)
    d = {
        "@type": "VideoGame" if game else "CreativeWork",
        "identifier": w["id"],
        "name": w["name"],
        "alternateName": w_en["name"] if lang == "zh" and w_en["name"] not in w["name"] else None,
        "description": w["desc"],
        "url": links[0] if links else None,
        "creator": {"@id": PERSON_ID},
        "dateCreated": re.search(r"20\d\d", w["years"]).group(0) if re.search(r"20\d\d", w["years"]) else None,
        "keywords": ", ".join(w["tags"]) or None,
        "inLanguage": "zh-Hant" if lang == "zh" else "en",
    }
    if game:
        d["genre"] = w["kind"]
        if play:
            d["gamePlatform"] = "Web browser"
            d["playMode"] = "SinglePlayer"
    return {k: v for k, v in d.items() if v}


# ---------------------------------------------------------------- JSON-LD

def org_ld(lang):
    zh = lang == "zh"
    return {
        "@type": "Organization",
        "@id": ORG_ID,
        "name": "WAKE Studio",
        "alternateName": ["WAKE", "WAKE 工作室"],
        "url": SITE + "/",
        "logo": SITE + "/assets/og-image.jpg",
        "email": EMAIL,
        "foundingDate": "2026",
        "founder": {"@id": PERSON_ID},
        "address": {"@type": "PostalAddress", "addressCountry": "TW"},
        "areaServed": "TW",
        "sameAs": [GITHUB],
        "description": ("台灣的一人獨立遊戲與視覺設計工作室，由張凱翔主理：敘事遊戲與公民議題遊戲、3D 產品視覺、網頁產品。"
                        if zh else
                        "A one-person independent game and visual design studio in Taiwan led by Kevin Chang: narrative and civic games, 3D product visualization, and web products."),
    }


def person_ld(lang):
    zh = lang == "zh"
    return {
        "@type": "Person",
        "@id": PERSON_ID,
        "name": "張凱翔" if zh else "Kevin Chang",
        "alternateName": "Kevin Chang" if zh else "張凱翔",
        "url": SITE + ("/about.html" if zh else "/en/about.html"),
        "image": SITE + "/assets/founder-sketch.jpg",
        "jobTitle": "WAKE Studio 主理人、獨立遊戲開發者" if zh else "Founder of WAKE Studio, independent game developer",
        "worksFor": {"@id": ORG_ID},
        "nationality": "TW",
        "email": EMAIL,
        "sameAs": [GITHUB],
        "knowsAbout": ["Game development", "Narrative design", "Godot", "Unreal Engine 5", "Unity", "Blender",
                       "3D product visualization", "Web development", "Taiwanese history"],
    }


def website_ld(lang):
    return {"@type": "WebSite", "@id": SITE_ID, "url": SITE + "/", "name": "WAKE Studio",
            "inLanguage": ["zh-Hant", "en"], "publisher": {"@id": ORG_ID}}


def page_ld(path, lang, page, works_zh, works_en):
    url = url_of(path, lang == "en")
    title = re.search(r"<title>(.*?)</title>", page).group(1)
    desc = meta(page, "description")
    inl = "zh-Hant" if lang == "zh" else "en"
    graph = [org_ld(lang), person_ld(lang), website_ld(lang)]
    base = {"url": url, "name": html.unescape(title), "description": desc, "inLanguage": inl,
            "isPartOf": {"@id": SITE_ID}}
    if path == "":
        graph.append({"@type": "WebPage", **base, "about": {"@id": ORG_ID}})
    elif path == "about.html":
        graph.append({"@type": "ProfilePage", **base, "mainEntity": {"@id": PERSON_ID}})
    elif path == "contact.html":
        graph.append({"@type": "ContactPage", **base, "about": {"@id": ORG_ID}})
    elif path == "works.html":
        works = works_zh if lang == "zh" else works_en
        items = [{"@type": "ListItem", "position": i + 1, "item": work_ld(w, works_en[i], lang)}
                 for i, w in enumerate(works)]
        graph.append({"@type": "CollectionPage", **base, "about": {"@id": ORG_ID},
                      "mainEntity": {"@type": "ItemList", "numberOfItems": len(items), "itemListElement": items}})
    else:  # 案例頁
        h1 = text(re.search(r"<h1>(.*?)</h1>", page, re.S).group(1))
        art = {"@type": "Article", **base, "headline": h1, "author": {"@id": PERSON_ID},
               "publisher": {"@id": ORG_ID}, "image": SITE + "/assets/og-image.jpg",
               "mainEntityOfPage": url}
        if "assets/caster/assembly.mp4" in page:
            art["image"] = SITE + "/assets/caster/assembly.jpg"
            art["video"] = {
                "@type": "VideoObject",
                "name": "萬向輪總成：組裝與爆炸動畫" if lang == "zh" else "Caster wheel assembly: assemble and exploded-view animation",
                "description": ("Blender 渲染的萬向輪總成，21 個零件依序拆開再裝回。" if lang == "zh" else
                                "Blender render of a 21-part caster wheel assembly taking apart and going back together."),
                "thumbnailUrl": SITE + "/assets/caster/assembly.jpg",
                "contentUrl": SITE + "/assets/caster/assembly.mp4",
                "uploadDate": "2026-10-16",
                "duration": "PT6S",
            }
        graph.append(art)
    return {"@context": "https://schema.org", "@graph": graph}


def inject(path_file, ld, canonical):
    s = read(path_file)
    block = ('<!-- geo:jsonld -->\n<script type="application/ld+json">\n'
             + json.dumps(ld, ensure_ascii=False, indent=1).replace("</", "<\\/")
             + "\n</script>\n<!-- /geo:jsonld -->")
    if "<!-- geo:jsonld -->" in s:
        s = re.sub(r"<!-- geo:jsonld -->.*?<!-- /geo:jsonld -->", lambda _: block, s, flags=re.S)
    else:
        s = s.replace("</head>", block + "\n</head>", 1)
    if 'rel="canonical"' not in s:
        s = s.replace("</head>", '<link rel="canonical" href="%s">\n</head>' % canonical, 1)
    write(path_file, s)


# ---------------------------------------------------------------- llms.txt

def llms(works_zh, works_en):
    out = ["# WAKE Studio", "",
           "> 台灣的一人獨立遊戲與視覺設計工作室，由張凱翔（Kevin Chang）主理。做敘事遊戲與公民議題遊戲，"
           "也接 3D 產品視覺與網頁委託。主案是以 1950 年代白色恐怖為背景的《BÔ BÂNG》。",
           "> A one-person independent game and visual design studio in Taiwan, run by Kevin Chang (張凱翔). "
           "It makes narrative and civic-issue games and takes 3D product visualization and web commissions. "
           "The flagship project is BÔ BÂNG, set during Taiwan's White Terror in the 1950s.", "",
           "- 網站有中文（預設）與英文兩個版本；英文版在 /en/。",
           "- 聯絡 Contact: %s" % EMAIL,
           "- GitHub: %s" % GITHUB, "",
           "## 主要頁面 Main pages", ""]
    for zh, en, path in PAGES:
        p = read(zh)
        title = html.unescape(re.search(r"<title>(.*?)</title>", p).group(1))
        out.append("- [%s](%s): %s（English: %s）" % (title, url_of(path), meta(p, "description"), url_of(path, True)))
    out += ["", "## 作品 Works", ""]
    for w, we in zip(works_zh, works_en):
        name = w["name"] if we["name"] in w["name"] else "%s %s" % (w["name"], we["name"])
        link = w["links"][0][0] if w["links"] else url_of("works.html")
        status = ("，" + w["status"]) if w["status"] else ""
        out.append("- [%s](%s): %s，%s%s。%s" % (name, link, w["id"], w["years"], status, w["desc"]))
    out += ["", "## 可以直接玩的遊戲 Playable in the browser", ""]
    for w, we in zip(works_zh, works_en):
        play = [h for h, _ in w["links"] if "/play/" in h or ("vercel.app" in h and is_game(we) and "bubang" not in h)]
        if play and is_game(we):
            out.append("- %s（%s）: %s" % (w["name"], we["name"], play[0]))
    return "\n".join(out) + "\n"


# ---------------------------------------------------------------- sitemap

def sitemap():
    out = ['<?xml version="1.0" encoding="UTF-8"?>',
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">']
    prio = {"": "1.0", "works.html": "0.9"}
    for zh, en, path in PAGES:
        for f, is_en in ((zh, False), (en, True)):
            lm = lastmod(f)
            out.append("  <url>")
            out.append("    <loc>%s</loc>" % url_of(path, is_en))
            if lm:
                out.append("    <lastmod>%s</lastmod>" % lm)
            out.append('    <xhtml:link rel="alternate" hreflang="zh-Hant" href="%s"/>' % url_of(path))
            out.append('    <xhtml:link rel="alternate" hreflang="en" href="%s"/>' % url_of(path, True))
            out.append('    <xhtml:link rel="alternate" hreflang="x-default" href="%s"/>' % url_of(path))
            out.append("    <priority>%s</priority>" % (prio.get(path, "0.8") if not is_en else "0.7"))
            out.append("  </url>")
    for f in PLAY:
        lm = lastmod(f)
        out.append("  <url>")
        out.append("    <loc>%s/%s</loc>" % (SITE, os.path.dirname(f) + "/"))
        if lm:
            out.append("    <lastmod>%s</lastmod>" % lm)
        out.append("    <priority>0.7</priority>")
        out.append("  </url>")
    out.append("</urlset>")
    return "\n".join(out) + "\n"


if __name__ == "__main__":
    works_zh = parse_works("works.html", "")
    works_en = parse_works("en/works.html", "en")
    assert len(works_zh) == len(works_en), "中英文作品數量不一致"
    for a, b in zip(works_zh, works_en):
        assert a["id"] == b["id"], (a["id"], b["id"])
    for zh, en, path in PAGES:
        inject(zh, page_ld(path, "zh", read(zh), works_zh, works_en), url_of(path))
        inject(en, page_ld(path, "en", read(en), works_zh, works_en), url_of(path, True))
    write("llms.txt", llms(works_zh, works_en))
    write("sitemap.xml", sitemap())
    print("works:", len(works_zh), "| pages:", len(PAGES) * 2, "| llms.txt & sitemap.xml written")
