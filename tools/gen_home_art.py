# -*- coding: utf-8 -*-
"""首頁景深場景的 SVG 圖層產生器。

台灣山村的暮夜：月亮、遠山、山腰聚落與土地公廟、近丘芒草、前景芒草叢。
每一層獨立成檔，首頁用不同的位移量疊起來做出景深。

    python3 tools/gen_home_art.py      # 輸出到 assets/home/
"""
import math
import os
import random

OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "home")
W, H = 1600, 1000

NIGHT = "#141D2B"
DUSK = "#1D2A3C"
GOLD = "#E5A33D"
EMBER = "#C2652F"
CREAM = "#F3E9D7"


def f(v):
    return f"{v:.1f}".rstrip("0").rstrip(".")


def svg(body, defs="", w=W, h=H):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" '
            f'width="{w}" height="{h}" preserveAspectRatio="xMidYMax slice">'
            f'<defs>{defs}</defs>{body}</svg>')


def save(name, content):
    with open(os.path.join(OUT, name), "w", encoding="utf-8") as fh:
        fh.write(content)
    print(f"{name:22s} {len(content) / 1024:6.1f} KB")


def ridge(rng, y0, amp, rough, peaks=(), n=7, x0=-60, x1=W + 60):
    """一維中點位移的山稜線，peaks=[(x, 高度, 寬度)] 疊上特定山峰。"""
    pts = [y0, y0]
    for level in range(n):
        new = []
        a = amp * (rough ** level)
        for i in range(len(pts) - 1):
            new += [pts[i], (pts[i] + pts[i + 1]) / 2 + rng.uniform(-a, a)]
        new.append(pts[-1])
        pts = new
    out = []
    for i, y in enumerate(pts):
        x = x0 + (x1 - x0) * i / (len(pts) - 1)
        for px, ph, pw in peaks:
            d = (x - px) / pw
            y -= ph * math.exp(-d * d * 2.2) * (1 + 0.08 * math.sin(i * 1.7))
        out.append((x, y))
    return out


def poly_path(pts, bottom=H + 40):
    d = f"M{f(pts[0][0])} {f(bottom)} " + " ".join(f"L{f(x)} {f(y)}" for x, y in pts)
    return d + f" L{f(pts[-1][0])} {f(bottom)} Z"


def y_at(pts, x):
    for (ax, ay), (bx, by) in zip(pts, pts[1:]):
        if ax <= x <= bx:
            return ay + (by - ay) * (x - ax) / (bx - ax)
    return pts[-1][1]


def blade(x, y, h, lean, w, color, op=1.0):
    """一片芒草葉：從 (x,y) 往上、帶彎的細長葉形。"""
    tx, ty = x + lean, y - h
    cx, cy = x + lean * 0.25, y - h * 0.6
    return (f'<path d="M{f(x - w)} {f(y)} Q{f(cx - w * .6)} {f(cy)} {f(tx)} {f(ty)} '
            f'Q{f(cx + w * .6)} {f(cy)} {f(x + w)} {f(y)} Z" fill="{color}"'
            + (f' opacity="{op:.2f}"' if op < 1 else "") + "/>")


def plume(rng, x, y, size, color, op):
    """芒草花穗：花莖頂端往一側垂下的一束細絲。"""
    lean = rng.uniform(.4, 1) * rng.choice((-1, 1))
    tipx, tipy = x + lean * size * .9, y - size * .2
    s = [f'<path d="M{f(x)} {f(y + size * .5)} Q{f(x + lean * size * .2)} {f(y - size * .3)} '
         f'{f(tipx)} {f(tipy)}" stroke="{color}" stroke-width="{f(size * .03)}" fill="none" opacity="{op:.2f}"/>']
    for k in range(int(10 + size / 6)):
        t = rng.uniform(.15, 1)
        bx = x + (tipx - x) * t
        by = y + size * .5 + (tipy - y - size * .5) * t
        ln = size * rng.uniform(.25, .55) * (1.2 - t * .5)
        ang = math.atan2(tipy - y, tipx - x) + rng.uniform(.3, 1.1) * (1 if lean > 0 else -1)
        ex, ey = bx + math.cos(ang) * ln, by + abs(math.sin(ang)) * ln * .9
        s.append(f'<path d="M{f(bx)} {f(by)} Q{f((bx + ex) / 2 + lean * 4)} {f(min(by, ey) - 4)} {f(ex)} {f(ey)}" '
                 f'stroke="{color}" stroke-width="{f(max(.8, size * .014))}" fill="none" '
                 f'stroke-linecap="round" opacity="{op * rng.uniform(.5, 1):.2f}"/>')
    return "".join(s)


def grass_clump(rng, cx, base, width, height, dark, plume_c, n, plume_op=.85, plumes=5):
    out = []
    for _ in range(n):
        x = cx + rng.gauss(0, width / 3)
        h = height * rng.uniform(.45, 1)
        lean = (x - cx) * rng.uniform(.4, 1.2) + rng.uniform(-height * .25, height * .25)
        out.append(blade(x, base, h, lean, rng.uniform(2.5, 6) * height / 300, dark))
    for _ in range(plumes):
        x = cx + rng.gauss(0, width / 4)
        h = height * rng.uniform(.9, 1.35)
        tx = x + rng.uniform(-30, 30) * height / 300
        out.append(f'<path d="M{f(x)} {f(base)} Q{f((x + tx) / 2)} {f(base - h * .6)} {f(tx)} {f(base - h)}" '
                   f'stroke="{dark}" stroke-width="{f(2.2 * height / 300)}" fill="none"/>')
        out.append(plume(rng, tx, base - h, height * rng.uniform(.18, .28), plume_c, plume_op))
    return "".join(out)


# ---------------------------------------------------------------- 天空

def sky():
    rng = random.Random(11)
    stars = []
    for _ in range(220):
        x, y = rng.uniform(0, W), rng.uniform(0, H * .62) ** 1.08
        r = rng.choice((.6, .8, .9, 1.1, 1.4, 1.9))
        stars.append(f'<circle cx="{f(x)}" cy="{f(y)}" r="{r}" fill="{CREAM}" opacity="{rng.uniform(.15, .8):.2f}"/>')
    defs = (f'<linearGradient id="s" x1="0" y1="0" x2="0" y2="1">'
            f'<stop offset="0" stop-color="#070B13"/><stop offset=".45" stop-color="{NIGHT}"/>'
            f'<stop offset=".8" stop-color="#2A2633"/><stop offset="1" stop-color="#4A2E2A"/></linearGradient>'
            f'<radialGradient id="g" cx=".72" cy=".86" r=".6"><stop offset="0" stop-color="{EMBER}" stop-opacity=".45"/>'
            f'<stop offset="1" stop-color="{EMBER}" stop-opacity="0"/></radialGradient>')
    body = (f'<rect width="{W}" height="{H}" fill="url(#s)"/><rect width="{W}" height="{H}" fill="url(#g)"/>'
            + "".join(stars))
    save("sky.svg", svg(body, defs))


def moon():
    defs = (f'<radialGradient id="m" cx=".42" cy=".38" r=".7"><stop offset="0" stop-color="#F8E2B4"/>'
            f'<stop offset=".55" stop-color="{GOLD}"/><stop offset="1" stop-color="{EMBER}"/></radialGradient>'
            f'<radialGradient id="h" r=".5"><stop offset=".3" stop-color="{GOLD}" stop-opacity=".35"/>'
            f'<stop offset="1" stop-color="{GOLD}" stop-opacity="0"/></radialGradient>'
            '<filter id="t" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".018" numOctaves="4" seed="7"/>'
            '<feColorMatrix values="0 0 0 0 .45  0 0 0 0 .2  0 0 0 0 .1  0 0 0 -2.6 1.45"/></filter>'
            '<clipPath id="c"><circle cx="300" cy="300" r="170"/></clipPath>')
    body = ('<circle cx="300" cy="300" r="300" fill="url(#h)"/>'
            '<circle cx="300" cy="300" r="170" fill="url(#m)"/>'
            '<rect x="130" y="130" width="340" height="340" filter="url(#t)" clip-path="url(#c)" opacity=".55"/>')
    save("moon.svg", svg(body, defs, 600, 600).replace('preserveAspectRatio="xMidYMax slice"', ""))


# ---------------------------------------------------------------- 山

def far():
    rng = random.Random(3)
    back = ridge(rng, 560, 70, .55, peaks=[(560, 300, 210), (330, 120, 160), (980, 140, 260)])
    front = ridge(rng, 650, 50, .55, peaks=[(1250, 150, 300), (180, 90, 200)])
    defs = ('<linearGradient id="a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2B3C55"/>'
            f'<stop offset="1" stop-color="{DUSK}"/></linearGradient>'
            '<linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22324A"/>'
            '<stop offset="1" stop-color="#18233A"/></linearGradient>'
            '<linearGradient id="mist" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8FA0B8" stop-opacity="0"/>'
            '<stop offset=".6" stop-color="#8FA0B8" stop-opacity=".16"/><stop offset="1" stop-color="#8FA0B8" stop-opacity="0"/></linearGradient>')
    sx, sy = min(back, key=lambda p: p[1])
    body = (f'<path d="{poly_path(back)}" fill="url(#a)" opacity=".85"/>'
            f'<rect y="560" width="{W}" height="200" fill="url(#mist)"/>'
            f'<path d="{poly_path(front)}" fill="url(#b)"/>'
            f'<circle cx="{f(sx)}" cy="{f(sy - 6)}" r="2.6" fill="{GOLD}" opacity=".9"/>'
            f'<rect y="640" width="{W}" height="200" fill="url(#mist)"/>')
    save("far.svg", svg(body, defs))


def house(x, y, w, h, roof, wall, lit, rng, glow=True):
    """1950 年代農村瓦厝：矮牆、雙坡瓦頂、暖色窗。"""
    rh = h * .55
    s = [f'<rect x="{f(x)}" y="{f(y - h)}" width="{f(w)}" height="{f(h)}" fill="{wall}"/>',
         f'<path d="M{f(x - w * .08)} {f(y - h)} L{f(x + w * .12)} {f(y - h - rh)} L{f(x + w * .88)} {f(y - h - rh)} '
         f'L{f(x + w * 1.08)} {f(y - h)} Z" fill="{roof}"/>']
    for k in range(rng.randint(1, 3)):
        wx = x + w * (.15 + .7 * (k + .5) / 3) - 6
        if lit and rng.random() < .75:
            if glow:
                s.append(f'<circle cx="{f(wx + 6)}" cy="{f(y - h * .55)}" r="22" fill="url(#lamp)"/>')
            s.append(f'<rect x="{f(wx)}" y="{f(y - h * .7)}" width="12" height="13" fill="{GOLD}"/>')
            s.append(f'<path d="M{f(wx + 6)} {f(y - h * .7)} v13 M{f(wx)} {f(y - h * .7 + 6.5)} h12" stroke="#5A3A1A" stroke-width="1.4"/>')
        else:
            s.append(f'<rect x="{f(wx)}" y="{f(y - h * .7)}" width="12" height="13" fill="#0B1019"/>')
    return "".join(s)


def shrine(x, y, s):
    """土地公廟：燕尾屋脊、紅柱、一對紅燈籠。"""
    ink = "#0D131D"
    parts = [f'<rect x="{f(x - 34 * s)}" y="{f(y - 46 * s)}" width="{f(68 * s)}" height="{f(46 * s)}" fill="{ink}"/>',
             f'<rect x="{f(x - 14 * s)}" y="{f(y - 34 * s)}" width="{f(28 * s)}" height="{f(34 * s)}" fill="#3A1712"/>',
             f'<circle cx="{f(x)}" cy="{f(y - 18 * s)}" r="{f(7 * s)}" fill="{GOLD}" opacity=".85"/>',
             f'<path d="M{f(x - 52 * s)} {f(y - 44 * s)} Q{f(x - 30 * s)} {f(y - 56 * s)} {f(x - 26 * s)} {f(y - 70 * s)} '
             f'L{f(x + 26 * s)} {f(y - 70 * s)} Q{f(x + 30 * s)} {f(y - 56 * s)} {f(x + 52 * s)} {f(y - 44 * s)} Z" fill="{ink}"/>',
             # 燕尾
             f'<path d="M{f(x - 30 * s)} {f(y - 68 * s)} Q{f(x - 42 * s)} {f(y - 70 * s)} {f(x - 50 * s)} {f(y - 86 * s)} '
             f'Q{f(x - 40 * s)} {f(y - 76 * s)} {f(x - 24 * s)} {f(y - 74 * s)} Z" fill="{ink}"/>',
             f'<path d="M{f(x + 30 * s)} {f(y - 68 * s)} Q{f(x + 42 * s)} {f(y - 70 * s)} {f(x + 50 * s)} {f(y - 86 * s)} '
             f'Q{f(x + 40 * s)} {f(y - 76 * s)} {f(x + 24 * s)} {f(y - 74 * s)} Z" fill="{ink}"/>',
             f'<rect x="{f(x - 26 * s)}" y="{f(y - 76 * s)}" width="{f(52 * s)}" height="{f(6 * s)}" fill="{ink}"/>']
    for dx in (-44, 44):
        lx, ly = x + dx * s, y - 36 * s
        parts += [f'<circle cx="{f(lx)}" cy="{f(ly)}" r="{f(30 * s)}" fill="url(#red)"/>',
                  f'<line x1="{f(lx)}" y1="{f(ly - 16 * s)}" x2="{f(lx)}" y2="{f(ly - 8 * s)}" stroke="{ink}" stroke-width="{f(1.5 * s)}"/>',
                  f'<ellipse cx="{f(lx)}" cy="{f(ly)}" rx="{f(7 * s)}" ry="{f(9 * s)}" fill="#D9452B"/>',
                  f'<ellipse cx="{f(lx)}" cy="{f(ly)}" rx="{f(3.5 * s)}" ry="{f(6 * s)}" fill="#F7A35C" opacity=".8"/>']
    return "".join(parts)


def palm(x, y, h, lean, color):
    """檳榔樹：細長樹幹、頂端一撮羽葉。"""
    tx, ty = x + lean, y - h
    s = [f'<path d="M{f(x)} {f(y)} Q{f(x + lean * .2)} {f(y - h * .5)} {f(tx)} {f(ty)}" stroke="{color}" stroke-width="4" fill="none"/>']
    for a in range(-150, -20, 18):
        r = math.radians(a)
        ln = 48 + 14 * math.sin(a)
        ex, ey = tx + math.cos(r) * ln, ty + math.sin(r) * ln * .55 + ln * .45
        s.append(f'<path d="M{f(tx)} {f(ty)} Q{f(tx + math.cos(r) * ln * .6)} {f(ty + math.sin(r) * ln * .6 - 10)} {f(ex)} {f(ey)}" '
                 f'stroke="{color}" stroke-width="3" fill="none" stroke-linecap="round"/>')
    return "".join(s)


def village():
    """山腰聚落：中景山坡、瓦厝、檳榔樹、土地公廟（大字會疊在這層前面）。"""
    rng = random.Random(21)
    hill = ridge(rng, 610, 36, .5, peaks=[(1050, 110, 380), (280, 60, 260)])
    ink, roof, wall = "#101826", "#0B111B", "#172131"
    defs = (f'<radialGradient id="lamp" r=".5"><stop offset="0" stop-color="{GOLD}" stop-opacity=".55"/>'
            f'<stop offset="1" stop-color="{GOLD}" stop-opacity="0"/></radialGradient>'
            '<radialGradient id="red" r=".5"><stop offset="0" stop-color="#E0573A" stop-opacity=".65"/>'
            '<stop offset="1" stop-color="#E0573A" stop-opacity="0"/></radialGradient>'
            f'<linearGradient id="hf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#18222F"/>'
            f'<stop offset="1" stop-color="{ink}"/></linearGradient>')
    trees = []
    for i in range(140):  # 稜線上的樹冠
        x = rng.uniform(-40, W + 40)
        yy = y_at(hill, x)
        r = rng.uniform(10, 26)
        trees.append(f'<circle cx="{f(x)}" cy="{f(yy + r * .3)}" r="{f(r)}" fill="#141E2B"/>')
    houses = []
    for x, w, h in [(640, 150, 56), (820, 190, 64), (1010, 120, 50), (1290, 160, 58), (1460, 120, 48), (420, 140, 52)]:
        houses.append(house(x, y_at(hill, x + w / 2) + 34, w, h, roof, wall, True, rng))
    palms = "".join(palm(x, y_at(hill, x) + 30, rng.uniform(150, 210), rng.uniform(-18, 18), "#0F1724")
                    for x in (620, 1180, 1215, 1500, 395))
    sx = 1150
    body = ("".join(trees) + f'<path d="{poly_path(hill)}" fill="url(#hf)"/>' + palms + "".join(houses)
            + shrine(sx, y_at(hill, sx) + 40, 1.9))
    save("village.svg", svg(body, defs))


def near():
    """近丘：深色山坡、芒草花穗、電火柱與電線（遮住大字的下半）。"""
    rng = random.Random(5)
    hill = ridge(rng, 840, 40, .5, peaks=[(300, 70, 380), (1350, 60, 300)])
    ink = "#0A0F17"
    defs = (f'<linearGradient id="nf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#101A1C"/>'
            f'<stop offset=".5" stop-color="{ink}"/></linearGradient>')
    grass = []
    for i in range(46):
        x = rng.uniform(-40, W + 40)
        grass.append(grass_clump(rng, x, y_at(hill, x) + 18, 60, rng.uniform(80, 150), ink,
                                 "#CFC2A8", 14, plume_op=.55, plumes=rng.randint(1, 3)))
    # 電火柱：兩支，電線垂曲穿過畫面
    poles = []
    pxs = [(230, 260), (1460, 230)]
    tops = []
    for px, ph in pxs:
        by = y_at(hill, px) + 10
        top = by - ph
        tops.append((px, top))
        poles.append(f'<path d="M{f(px)} {f(by)} L{f(px)} {f(top)}" stroke="{ink}" stroke-width="7"/>'
                     f'<path d="M{f(px - 34)} {f(top + 16)} h68 M{f(px - 24)} {f(top + 34)} h48" stroke="{ink}" stroke-width="5"/>')
    wires = []
    (ax, ay), (bx, by) = tops
    for k, dy in enumerate((16, 16, 34)):
        off = (-30, 30, 0)[k]
        x1, y1, x2, y2 = ax + off, ay + dy, bx + off, by + dy
        wires.append(f'<path d="M{f(-40)} {f(y1 + 70)} Q{f((x1 - 40) / 2)} {f(y1 + 80)} {f(x1)} {f(y1)} '
                     f'Q{f((x1 + x2) / 2)} {f(max(y1, y2) + 120)} {f(x2)} {f(y2)} '
                     f'Q{f((x2 + W + 40) / 2)} {f(y2 + 70)} {f(W + 40)} {f(y2 + 60)}" stroke="{ink}" stroke-width="2" fill="none" opacity=".9"/>')
    body = "".join(wires) + f'<path d="{poly_path(hill)}" fill="url(#nf)"/>' + "".join(poles) + "".join(grass)
    save("near.svg", svg(body, defs))


def foreground(name, side, seed):
    """前景芒草叢：很近、很暗、會被 CSS 模糊（景深）並緩慢搖擺。"""
    rng = random.Random(seed)
    w, h = 700, 900
    clumps = []
    for i in range(4):
        cx = (90 + i * 90) if side == "left" else (w - 90 - i * 90)
        clumps.append(grass_clump(rng, cx + rng.uniform(-40, 40), h + 20, 160, rng.uniform(520, 780) - i * 80,
                                  "#06090F", "#E6DAC2", 34, plume_op=.75, plumes=3))
    body = "".join(clumps)
    save(name, f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">{body}</svg>')


# ---------------------------------------------------------------- 作品框插畫

def slide_bobang():
    """BÔ BÂNG：1950 年代街屋亭仔腳、路燈、雨。"""
    rng = random.Random(31)
    defs = (f'<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0B1019"/>'
            f'<stop offset="1" stop-color="{DUSK}"/></linearGradient>'
            f'<radialGradient id="cone" cx=".5" cy="0" r="1"><stop offset="0" stop-color="{GOLD}" stop-opacity=".5"/>'
            f'<stop offset="1" stop-color="{GOLD}" stop-opacity="0"/></radialGradient>'
            f'<radialGradient id="lamp" r=".5"><stop offset="0" stop-color="{GOLD}" stop-opacity=".6"/>'
            f'<stop offset="1" stop-color="{GOLD}" stop-opacity="0"/></radialGradient>')
    ink, brick = "#0C121C", "#2A1A16"
    s = [f'<rect width="{W}" height="{H}" fill="url(#bg)"/>']
    base = 820
    x = -40
    while x < W:  # 一排兩層街屋，一樓拱廊
        bw = rng.uniform(220, 300)
        bh = rng.uniform(420, 520)
        s.append(f'<rect x="{f(x)}" y="{f(base - bh)}" width="{f(bw - 6)}" height="{f(bh)}" fill="{brick if rng.random() < .5 else ink}"/>')
        s.append(f'<rect x="{f(x - 6)}" y="{f(base - bh - 22)}" width="{f(bw + 6)}" height="22" fill="{ink}"/>')
        for k in range(2):  # 二樓窗
            wx = x + bw * (.2 + .4 * k)
            lit = rng.random() < .35
            s.append(f'<rect x="{f(wx)}" y="{f(base - bh + 60)}" width="{f(bw * .22)}" height="90" fill="{GOLD if lit else "#070A10"}" opacity="{.85 if lit else 1}"/>')
            for b in range(4):
                s.append(f'<line x1="{f(wx + bw * .22 * (b + 1) / 5)}" y1="{f(base - bh + 60)}" x2="{f(wx + bw * .22 * (b + 1) / 5)}" y2="{f(base - bh + 150)}" stroke="{ink}" stroke-width="3"/>')
        # 亭仔腳拱
        ax0, aw = x + 14, bw - 34
        s.append(f'<path d="M{f(ax0)} {f(base)} V{f(base - 150)} Q{f(ax0 + aw / 2)} {f(base - 230)} {f(ax0 + aw)} {f(base - 150)} V{f(base)} Z" fill="#05080D"/>')
        x += bw
    lx = 1060
    s.append(f'<path d="M{f(lx - 260)} {f(base + 120)} L{f(lx - 20)} 380 L{f(lx + 20)} 380 L{f(lx + 300)} {f(base + 120)} Z" fill="url(#cone)"/>')
    s.append(f'<circle cx="{lx}" cy="372" r="70" fill="url(#lamp)"/>')
    s.append(f'<path d="M{lx + 60} {base + 40} V380 Q{lx + 60} 350 {lx + 20} 352 H{lx - 10}" stroke="{ink}" stroke-width="9" fill="none"/>')
    s.append(f'<path d="M{lx - 26} 368 h44 l-8 -16 h-28 Z" fill="{ink}"/><rect x="{lx - 10}" y="368" width="12" height="9" fill="{CREAM}"/>')
    s.append(f'<rect y="{base}" width="{W}" height="{H - base}" fill="#0A0E15"/>')
    s.append(f'<ellipse cx="{lx}" cy="{base + 70}" rx="260" ry="30" fill="{GOLD}" opacity=".12"/>')
    # 撐傘的人
    px = lx - 40
    s.append(f'<path d="M{px - 16} {base + 70} L{px - 12} {base - 10} Q{px} {base - 30} {px + 12} {base - 10} L{px + 16} {base + 70} Z" fill="#04060A"/>'
             f'<circle cx="{px}" cy="{base - 38}" r="13" fill="#04060A"/>'
             f'<path d="M{px - 62} {base - 50} Q{px} {base - 110} {px + 62} {base - 50} Z" fill="#04060A"/>'
             f'<line x1="{px}" y1="{base - 82}" x2="{px + 4}" y2="{base - 10}" stroke="#04060A" stroke-width="3"/>')
    for _ in range(260):  # 雨
        x0, y0 = rng.uniform(0, W), rng.uniform(0, H)
        ln = rng.uniform(14, 34)
        s.append(f'<line x1="{f(x0)}" y1="{f(y0)}" x2="{f(x0 - ln * .18)}" y2="{f(y0 + ln)}" stroke="{CREAM}" stroke-width="1" opacity="{rng.uniform(.08, .3):.2f}"/>')
    save("slide-bobang.svg", f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" preserveAspectRatio="xMidYMid slice"><defs>{defs}</defs>{"".join(s)}</svg>')


def slide_civic():
    """公民議題三部曲：老公寓鐵窗，三扇亮著不同顏色的窗。"""
    rng = random.Random(41)
    ink, wall = "#0C121C", "#1A2433"
    defs = (f'<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070B13"/>'
            f'<stop offset="1" stop-color="#22283A"/></linearGradient>')
    glows = {(1, 1): "#5AA9E6", (3, 3): GOLD, (2, 5): "#E0573A"}
    for k, c in enumerate(glows.values()):
        defs += (f'<radialGradient id="w{k}" r=".5"><stop offset="0" stop-color="{c}" stop-opacity=".55"/>'
                 f'<stop offset="1" stop-color="{c}" stop-opacity="0"/></radialGradient>')
    s = [f'<rect width="{W}" height="{H}" fill="url(#bg)"/>',
         f'<circle cx="1380" cy="170" r="70" fill="{CREAM}" opacity=".9"/>',
         f'<rect x="160" y="120" width="1080" height="{H}" fill="{wall}"/>',
         f'<rect x="140" y="100" width="1120" height="26" fill="{ink}"/>']
    cols, rows = 6, 5
    for r in range(rows):
        for c in range(cols):
            x, y = 210 + c * 172, 170 + r * 170
            key = (r, c)
            if key in glows:
                k = list(glows).index(key)
                col = glows[key]
                s.append(f'<circle cx="{x + 55}" cy="{y + 50}" r="150" fill="url(#w{k})"/>')
                s.append(f'<rect x="{x}" y="{y}" width="110" height="100" fill="{col}" opacity=".9"/>')
            else:
                s.append(f'<rect x="{x}" y="{y}" width="110" height="100" fill="#0A0F18"/>')
            # 鐵窗
            s.append(f'<rect x="{x - 10}" y="{y - 10}" width="130" height="120" fill="none" stroke="#2C3648" stroke-width="4"/>')
            for b in range(1, 6):
                s.append(f'<line x1="{x - 10 + b * 130 / 6:.1f}" y1="{y - 10}" x2="{x - 10 + b * 130 / 6:.1f}" y2="{y + 110}" stroke="#2C3648" stroke-width="3"/>')
            s.append(f'<path d="M{x - 10} {y + 50} q32 -24 65 0 t65 0" stroke="#2C3648" stroke-width="3" fill="none"/>')
            if rng.random() < .3:  # 冷氣機
                s.append(f'<rect x="{x + 118}" y="{y + 64}" width="40" height="30" fill="#232D3E"/>')
    s.append(f'<rect y="900" width="{W}" height="100" fill="#06090F"/>')
    save("slide-civic.svg", f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" preserveAspectRatio="xMidYMid slice"><defs>{defs}</defs>{"".join(s)}</svg>')


def closing():
    """結尾：只剩稜線和芒草的剪影。"""
    rng = random.Random(9)
    back = ridge(rng, 300, 40, .55, peaks=[(560, 160, 200), (1200, 90, 260)], x0=-60, x1=W + 60)
    front = ridge(rng, 380, 26, .5, peaks=[(300, 50, 300)])
    body = (f'<path d="{poly_path(back, 520)}" fill="#1A2638"/>'
            f'<path d="{poly_path(front, 520)}" fill="#0E1520"/>')
    for i in range(30):
        x = rng.uniform(0, W)
        body += grass_clump(rng, x, y_at(front, x) + 30, 50, rng.uniform(60, 110), "#0E1520", "#CFC2A8", 10, .5, 1)
    save("closing.svg", f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} 520" width="{W}" height="520" preserveAspectRatio="xMidYMax slice">{body}</svg>')


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    sky(); moon(); far(); village(); near()
    foreground("fg-left.svg", "left", 101)
    foreground("fg-right.svg", "right", 202)
    slide_bobang(); slide_civic(); closing()
