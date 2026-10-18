"""
Design-intent drawing sheet for the FF hall double-height media wall (MW-01).
Every dimension mirrors Fur.tvFeatureWall in houseScene.js (Oct 2026, v3:
gold reveals, golden-ratio squares, console-only LED).  Output: an A1 SVG and
an HTML wrapper that Chrome prints to PDF.

    python scripts/media_wall_drawing.py
    chrome --headless --print-to-pdf=drawings/media-wall/MW-01.pdf drawings/media-wall/MW-01.html
"""
import os

# ---------------------------------------------------------------- model ---
W = 2221                    # wall width (x 6020..8241)
H = 3353                    # floor-to-floor: SF FFL = the 11' datum
TOP = 2 * H - 150           # FF floor -> SF soffit = 6556
PB, REV, PIL, PD = 208, 25, 233, 25     # pilaster body, reveal, zone, projection
PLINTH, CROWN = 150, 120
MOD, GAP = 298, 75
P = MOD + GAP
GRID = 4 * MOD + 3 * GAP                # 1417
G0 = (W - GRID) / 2                     # 402
G1 = G0 + GRID
ZROW0 = H - GAP / 2 - 3 * MOD - 2 * GAP  # 2271.5
INS = 57                                # inner square inset (golden ratio)
TVF0, TVF1 = 830, 1760                  # TV frame
RULE = (TVF1 + ZROW0) / 2               # 2015.75
TVW, TVH, TVC = 1220, 686, 1270
CW, CD, CZ0, CZ1 = 1600, 356, 305, 610  # console
C0 = W / 2 - CW / 2
def brk(k): return ZROW0 + k * P - GAP / 2
PIL_PANELS = [(260, RULE - 40), (RULE + 40, brk(3) - 38),
              (brk(3) + 38, brk(7) - 38), (brk(7) + 38, TOP - CROWN - 110)]

# ---------------------------------------------------------------- svg -----
out = []
def add(s): out.append(s)
def fmt(v): return ('%.0f' % v) if abs(v - round(v)) < 0.05 else ('%.1f' % v)
def line(x1, y1, x2, y2, w=0.18, dash=None, col='#111'):
    d = ' stroke-dasharray="%s"' % dash if dash else ''
    add('<line x1="%.3f" y1="%.3f" x2="%.3f" y2="%.3f" stroke="%s" stroke-width="%.3f"%s/>' % (x1, y1, x2, y2, col, w, d))
def rect(x, y, w, h, sw=0.18, fill='none', col='#111', dash=None):
    d = ' stroke-dasharray="%s"' % dash if dash else ''
    add('<rect x="%.3f" y="%.3f" width="%.3f" height="%.3f" fill="%s" stroke="%s" stroke-width="%.3f"%s/>' % (x, y, w, h, fill, col, sw, d))
def text(x, y, s, size=2.4, anchor='start', rot=0, weight='normal', col='#111', style='normal'):
    tr = ' transform="rotate(%g %.3f %.3f)"' % (rot, x, y) if rot else ''
    s = s.replace('&', '&amp;').replace('<', '&lt;')
    add('<text x="%.3f" y="%.3f" font-size="%.2f" text-anchor="%s" font-weight="%s" font-style="%s" fill="%s"%s>%s</text>' % (x, y, size, anchor, weight, style, col, tr, s))
def tick(x, y):
    line(x - 0.9, y + 0.9, x + 0.9, y - 0.9, 0.3)
def dimH(x1, x2, y, ref=None, label=None, size=2.2, above=True):
    if ref is not None:
        for x in (x1, x2): line(x, ref, x, y + (1.2 if y > ref else -1.2), 0.1, col='#555')
    line(x1 - 1.2, y, x2 + 1.2, y, 0.13)
    tick(x1, y); tick(x2, y)
    lab = label if label is not None else ''
    text((x1 + x2) / 2, y - 0.8 if above else y + 2.8, lab, size, 'middle')
def dimV(y1, y2, x, ref=None, label=None, size=2.2, left=True):
    if ref is not None:
        for y in (y1, y2): line(ref, y, x + (1.2 if x > ref else -1.2), y, 0.1, col='#555')
    line(x, y1 - 1.2, x, y2 + 1.2, 0.13)
    tick(x, y1); tick(x, y2)
    text(x - 0.8 if left else x + 2.6, (y1 + y2) / 2, label or '', size, 'middle', -90)
_clip = [0]
def hatch(x, y, w, h, step=1.6, col='#777', sw=0.08):
    _clip[0] += 1
    cid = _clip[0]
    add('<clipPath id="c%d"><rect x="%.3f" y="%.3f" width="%.3f" height="%.3f"/></clipPath><g clip-path="url(#c%d)">' % (cid, x, y, w, h, cid))
    k = -h
    while k < w:
        line(x + k, y + h, x + k + h, y, sw, col=col)
        k += step
    add('</g>')
    rect(x, y, w, h, 0.25)

GOLD, NAVY, NAVY2, WAL, TVF = '#d6b25e', '#e4e9f1', '#cfd7e4', '#ead8c4', '#6b6e73'

# ================================================================ sheet ===
SW_, SH_ = 841, 594
add('<rect x="0" y="0" width="841" height="594" fill="#fff"/>')
rect(10, 10, 821, 574, 0.5)

# ---------------------------------------------------------- 1 ELEVATION --
SC = 25.0
OX, OY = 62, 330                     # wall bottom-left on paper
def E(u, z): return OX + u / SC, OY - z / SC
def er(u0, z0, u1, z1, sw=0.15, fill='none', dash=None):
    x0, y1 = E(u0, z0); x1, y0 = E(u1, z1)
    rect(x0, y0, x1 - x0, y1 - y0, sw, fill, dash=dash)
def emould(u0, z0, u1, z1, w, sw=0.12):
    er(u0, z0, u1, z1, sw); er(u0 + w, z0 + w, u1 - w, z1 - w, 0.08)

text(OX, 30, '1   FRONT ELEVATION', 4.2, weight='bold')
text(OX, 35, 'Scale 1:25 @ A1  ·  looking north from the FF hall', 2.4, col='#444')
# context: floor, soffit, flanking wall
fx0, fy = E(-900, 0); fx1, _ = E(W + 250, 0)
line(fx0, fy, fx1, fy, 0.5)
_, sy = E(0, TOP); line(fx0, sy, fx1, sy, 0.5)
hatch(fx0, sy - 6, fx1 - fx0, 6)                       # roof slab over the void
hatch(fx0, fy, fx1 - fx0, 6)                           # FF slab
text(fx1 + 1, fy + 3.5, 'FF FFL ±0', 2.3)
text(fx1 + 1, sy - 1.5, 'SF SOFFIT +6556', 2.3)
_, dy = E(0, H); line(fx0, dy, fx1, dy, 0.2, '3 1.2 0.6 1.2', '#336')
text(fx1 + 1, dy - 0.8, 'SF FFL +3353', 2.3, col='#336'); text(fx1 + 1, dy + 2.6, "11' datum, no slab", 1.9, col='#336')
for u in (-900, W + 60):
    x, _ = E(u, 0); text(x + 0.5, OY - 120, 'white wall / window beyond', 1.9, col='#777', rot=-90) if False else None
# painted field
er(0, 0, W, TOP, 0.35, NAVY)
# plinth + crown
er(0, 0, W, PLINTH, 0.18, NAVY2); x0, y = E(0, PLINTH - 30); x1, _ = E(W, 0); line(x0, y, x1, y, 0.08)
er(0, TOP - CROWN, W, TOP, 0.18, NAVY2)
for z in (TOP - 80, TOP - 40):
    x0, y = E(0, z); line(x0, y, x1, y, 0.08)
er(0, TOP - 92, W, TOP - 80, 0.1, GOLD)
# pilasters, reveals, panels
for s in (0, 1):
    p0 = W - PB if s else 0
    er(p0, PLINTH, p0 + PB, TOP - CROWN, 0.25, NAVY2)
    r0 = W - PIL if s else PB
    er(r0, PLINTH, r0 + REV, TOP - CROWN, 0.12, '#9aa6b8')
    er(r0 + 7.5, PLINTH, r0 + 17.5, TOP - CROWN, 0.06, GOLD)
    for za, zb in PIL_PANELS:
        emould(p0 + 34, za, p0 + PB - 34, zb, 20)
# squares
for r in range(11):
    za = ZROW0 + r * P
    for c in range(4):
        ua = G0 + c * P
        emould(ua, za, ua + MOD, za + MOD, 20)
        emould(ua + INS, za + INS, ua + MOD - INS, za + MOD - INS, 14)
# TV zone
emould(G0, TVF0, G1, TVF1, 20)
er(G0, RULE - 6, G1, RULE + 6, 0.08, GOLD)
er(W / 2 - TVW / 2, TVC - TVH / 2, W / 2 + TVW / 2, TVC + TVH / 2, 0.3, TVF)
# console
er(C0, CZ0, C0 + CW, CZ1, 0.3, WAL)
for u in (C0 + 500, C0 + CW - 500):
    x, y0 = E(u, CZ0 + 20); _, y1 = E(u, CZ1 - 26); line(x, y0, x, y1, 0.12)
u = C0 + 502 + 6
while u + 14 <= C0 + CW - 508:
    x, y0 = E(u + 7, CZ0 + 24); _, y1 = E(u + 7, CZ1 - 30); line(x, y0, x, y1, 0.05, col='#8a6a4a'); u += 22
er(C0, CZ0 - 8, C0 + CW, CZ0, 0.06, GOLD)
x0, y = E(C0 + 60, CZ0 - 40); x1, _ = E(C0 + CW - 60, 0); line(x0, y, x1, y, 0.25, '1 0.6', '#e0a000')
x0, y = E(C0 + 40, CZ1 + 60); x1, _ = E(C0 + CW - 40, 0); line(x0, y, x1, y, 0.25, '1 0.6', '#e0a000')
# centre line + section marks
xc, _ = E(W / 2, 0)
line(xc, sy - 10, xc, fy + 10, 0.1, '4 1 0.8 1', '#a00')
for yy, lab in ((sy - 12, 'A'), (fy + 14, 'A')):
    add('<circle cx="%.2f" cy="%.2f" r="2.6" fill="#fff" stroke="#a00" stroke-width="0.25"/>' % (xc, yy))
    text(xc, yy + 0.9, lab, 2.6, 'middle', col='#a00', weight='bold')
_, yb = E(0, 1200)
xa, _ = E(-700, 0); xb, _ = E(W + 700, 0)
line(xa, yb, xa + 8, yb, 0.3, col='#a00'); line(xb - 8, yb, xb, yb, 0.3, col='#a00')
text(xa, yb - 1, 'B', 2.6, col='#a00', weight='bold'); text(xb, yb - 1, 'B', 2.6, 'end', col='#a00', weight='bold')
# horizontal dims
xs = [0, PB, PIL, G0, G1, W - PIL, W - PB, W]
yd = fy + 9
for a, b in zip(xs, xs[1:]):
    xa, _ = E(a, 0); xb, _ = E(b, 0)
    dimH(xa, xb, yd, fy, fmt(b - a), 1.9)
xa, _ = E(0, 0); xb, _ = E(W, 0); dimH(xa, xb, yd + 7, fy, '2221 (7\'-3½")', 2.3)
xs = [G0]
for c in range(4):
    xs += [G0 + c * P + MOD] + ([G0 + (c + 1) * P] if c < 3 else [])
yt = sy - 22
for a, b in zip(xs, xs[1:]):
    xa, _ = E(a, 0); xb, _ = E(b, 0)
    dimH(xa, xb, yt, None, fmt(b - a), 1.8)
xa, _ = E(G0, 0); xb, _ = E(G1, 0); dimH(xa, xb, yt - 6, None, '1417  grid = TV frame width', 2.0)
# level markers, right
LEVELS = [(PLINTH, 'top of plinth +150'), (CZ0, 'console underside +305'), (CZ1, 'console top +610'),
          (TVF0, 'TV frame +830'), (TVC - TVH / 2, 'TV bottom +927'), (TVC, 'TV centre +1270 (50")'),
          (TVC + TVH / 2, 'TV top +1613'), (TVF1, 'TV frame +1760'), (RULE, 'gold rule +2016'),
          (ZROW0, 'grid bottom +2272'), (ZROW0 + 10 * P + MOD, 'grid top +6300'),
          (TOP - CROWN, 'crown underside +6436')]
xr, _ = E(W, 0)
for i, (z, lab) in enumerate(LEVELS):
    _, y = E(0, z)
    ly = y if z > 2500 else OY - 12 - i * 11.5 if False else y
    line(xr + 1, y, xr + 9, y, 0.1, col='#555')
    text(xr + 10, y + 0.8, lab, 1.9)
# vertical dims, left
xl, _ = E(0, 0)
_, y0 = E(0, ZROW0); _, y1 = E(0, ZROW0 + 10 * P + MOD)
dimV(y1, y0, xl - 8, xl, '11 rows: 298 + 75 gap (373 c/c)', 1.9)
_, y0 = E(0, 0); _, y1 = E(0, TOP)
dimV(y1, y0, xl - 16, xl, '6556 FF floor → SF soffit (21\'-6")', 2.2)
_, y0 = E(0, brk(3)); line(xl - 4, y0, xl, y0, 0.1)
text(xl - 4.5, y0 - 1, 'gap centred on datum', 1.7, 'end', col='#336')

# ---------------------------------------------------------- 2 SECTION A-A --
SX, SY = 262, 330                    # wall face (plaster finish face) at FF floor
def Sv(d, z): return SX - d / SC, SY - z / SC     # d = depth into room
text(205, 30, '2   SECTION A–A', 4.2, weight='bold')
text(205, 35, 'Scale 1:25 · through wall centreline', 2.4, col='#444')
x, ytop = Sv(0, TOP); _, ybot = Sv(0, 0)
hatch(SX + 0.8, ytop, 230 / SC, ybot - ytop)                # 230 masonry
rect(SX, ytop, 0.8, ybot - ytop, 0.12, '#bbb')             # 20 finish coat
hatch(SX - 900 / SC, ytop - 6, 900 / SC + 0.8 + 230 / SC, 6)
hatch(SX - 900 / SC, ybot, 900 / SC + 0.8 + 230 / SC, 6)
def sr(d0, z0, d1, z1, sw=0.15, fill='none'):
    xa, ya = Sv(d1, z1); xb, yb = Sv(d0, z0); rect(xa, ya, xb - xa, yb - ya, sw, fill)
sr(0, 0, 24, PLINTH, 0.2, NAVY2)
sr(0, TOP - CROWN, 20, TOP, 0.15, NAVY2); sr(0, TOP - 80, 40, TOP, 0.15, NAVY2); sr(0, TOP - 40, 58, TOP, 0.15, NAVY2)
sr(0, CZ0, CD, CZ1, 0.3, WAL)
sr(22, CZ1, 34, CZ1 + 30, 0.1, WAL)
sr(0, TVC - TVH / 2, 61, TVC + TVH / 2, 0.3, TVF)
for z in (TVF0, TVF1 - 20):
    sr(0, z, 12, z + 20, 0.08, NAVY2)
sr(0, RULE - 6, 4, RULE + 6, 0.06, GOLD)
for r in range(11):
    za = ZROW0 + r * P
    sr(0, za, 12, za + 20, 0.05, NAVY2); sr(0, za + MOD - 20, 12, za + MOD, 0.05, NAVY2)
xa, ya = Sv(0, 1270); xb, yb = Sv(0, CZ1 - 40)
line(xa + 0.4, ya, xb + 0.4, yb, 0.35, '1.2 0.6', '#c00')
text(SX + 12, (ya + yb) / 2, '25 Ø PVC conduit chased in', 1.8, rot=-90, col='#c00')
text(SX + 15, (ya + yb) / 2, 'plaster: TV power + HDMI', 1.8, rot=-90, col='#c00')
_, yv = Sv(0, H); line(SX - 900 / SC, yv, SX + 10, yv, 0.2, '3 1.2 0.6 1.2', '#336')
text(SX - 900 / SC, yv - 1, 'SF FFL +3353 (slab edge 2.6 m away)', 1.7, col='#336')
xd0, _ = Sv(0, 0); xd1, _ = Sv(CD, 0); _, yc = Sv(0, CZ0)
dimH(xd1, xd0, yc + 4, None, '356', 1.8, above=False)
text(SX + 10, ytop + 10, '230 masonry', 1.9); text(SX + 10, ytop + 13, '+ 20 finish coat', 1.9)
text(SX - 900 / SC, ybot + 10, 'FF slab', 1.9); text(SX - 900 / SC, ytop - 8, 'roof slab', 1.9)

# ---------------------------------------------------------- 3 PLAN B-B ----
PS = 10.0
PX, PY = 52, 420                     # wall finish face at x=0
def Pp(u, d): return PX + u / PS, PY + d / PS        # d into room (down)
text(PX, 372, '3   PLAN B–B  (cut at +1200)', 4.2, weight='bold')
text(PX, 377, 'Scale 1:10', 2.4, col='#444')
x0, y0 = Pp(-300, -250); x1, _ = Pp(W + 300, 0)
hatch(x0, y0, x1 - x0, 230 / PS)
x0, y0 = Pp(-300, -20); rect(x0, y0, x1 - x0, 2, 0.12, '#ddd')
def pr(u0, d0, u1, d1, sw=0.2, fill='none', dash=None):
    xa, ya = Pp(u0, d0); xb, yb = Pp(u1, d1); rect(xa, ya, xb - xa, yb - ya, sw, fill, dash=dash)
for s in (0, 1):
    p0 = W - PB if s else 0
    pr(p0, 0, p0 + PB, PD, 0.3, NAVY2)
    pr(p0 + 34, PD, p0 + 54, PD + 12, 0.1, NAVY2); pr(p0 + PB - 54, PD, p0 + PB - 34, PD + 12, 0.1, NAVY2)
    r0 = W - PIL if s else PB
    pr(r0, 0, r0 + REV, 2, 0.08, '#9aa6b8'); pr(r0 + 7.5, 2, r0 + 17.5, 8, 0.1, GOLD)
pr(G0, 0, G0 + 20, 12, 0.1, NAVY2); pr(G1 - 20, 0, G1, 12, 0.1, NAVY2)
pr(W / 2 - 300, 0, W / 2 + 300, 30, 0.12)
pr(W / 2 - TVW / 2 - 5, 30, W / 2 + TVW / 2 + 5, 61, 0.3, TVF)
pr(C0, 0, C0 + CW, CD, 0.2, 'none', '1.5 0.8')
text(PX + W / 2 / PS, PY + CD / PS + 4, 'console below (dashed): 1600 × 356, wall-hung', 2.0, 'middle')
xs = [0, PB, PIL, G0, W / 2 - TVW / 2, W / 2 + TVW / 2, G1, W - PIL, W - PB, W]
for a, b in zip(xs, xs[1:]):
    xa, _ = Pp(a, 0); xb, _ = Pp(b, 0)
    dimH(xa, xb, PY - 27, PY - 23, fmt(b - a), 1.8)
text(PX + W / PS + 4, PY + 1, 'pilaster 25 proud', 1.9); text(PX + W / PS + 4, PY + 4, 'TV 61 off wall', 1.9)

# ---------------------------------------------------------- DETAILS -------
DX = 318
text(DX, 30, 'DETAILS', 4.2, weight='bold')
# D1 moulding profiles 4:1
def prof(x, y, steps, s, name):
    # steps: [(inset, width, proud)], drawn as a section, wall at bottom
    prev = 0
    tot = steps[0][1]
    line(x - 4, y, x + tot * s + 4, y, 0.4)
    hatch(x - 4, y, tot * s + 8, 3, 1.0)
    for i, w, pr_ in steps:
        rect(x + i * s, y - pr_ * s, w * s, (pr_ - prev) * s, 0.25, NAVY2)
        prev = pr_
    dimH(x, x + tot * s, y + 7, y + 3, str(tot), 2.0, above=False)
    dimV(y - steps[-1][2] * s, y, x + tot * s + 6, x + tot * s, str(steps[-1][2]), 2.0, left=False)
    dimV(y - steps[0][2] * s, y, x - 6, x, str(steps[0][2]), 2.0)
    text(x + tot * s / 2, y - steps[-1][2] * s - 4, name, 2.3, 'middle', weight='bold')
text(DX, 42, 'D1  PU moulding profiles  (4:1)', 3.0, weight='bold')
prof(DX + 10, 100, [(0, 20, 6), (5, 10, 12)], 4, 'M1  20 × 12  (outer lines)')
prof(DX + 130, 100, [(0, 14, 5), (4, 6, 9)], 4, 'M2  14 × 9  (inner squares)')
text(DX, 116, 'Two-step polyurethane panel moulding, mitred corners, PU adhesive + pins,', 2.0)
text(DX, 119.5, 'painted in situ with the wall colour (satin) — tone-on-tone, no contrast colour.', 2.0)

# D2 square module 1:5
S5 = 5.0
text(DX, 130, 'D2  Square module  (1:5)', 3.0, weight='bold')
mx, my = DX + 18, 200
def m(u, z): return mx + u / S5, my - z / S5
x0, y0 = m(0, MOD)
rect(x0 - 8, y0 - 8, MOD / S5 + 16 + 15, MOD / S5 + 16, 0.1, NAVY)
for (a, w) in ((0, 20), (INS, 14)):
    xa, ya = m(a, MOD - a); xb, yb = m(MOD - a, a)
    rect(xa, ya, xb - xa, yb - ya, 0.25)
    rect(xa + w / S5, ya + w / S5, xb - xa - 2 * w / S5, yb - ya - 2 * w / S5, 0.12)
xn, _ = m(MOD + GAP, 0); rect(xn, y0, 8, MOD / S5, 0.25)
xa, _ = m(0, 0); xb, _ = m(MOD, 0); dimH(xa, xb, my + 6, my, '298', 2.0, above=False)
xg, _ = m(MOD, 0); dimH(xg, xn, my + 6, my, '75', 2.0, above=False)
xa, _ = m(INS, 0); xb, _ = m(MOD - INS, 0); dimH(xa, xb, y0 - 3, None, '184', 2.0)
_, ya = m(0, MOD); _, yb = m(0, MOD - INS); dimV(ya, yb, x0 - 4, None, '57', 2.0)
text(DX, 214, 'Inner square = outer ÷ 1.618 (golden ratio). The 37 mm band between the', 2.0)
text(DX, 217.5, 'lines is half the 75 mm gap between squares: a 2 : 1 rhythm across the wall.', 2.0)

# D3 reveal plan 1:1
text(DX + 112, 130, 'D3  Gold reveal  (plan, 1:1)', 3.0, weight='bold')
rx, ry = DX + 150, 160                 # paint face at the reveal's left edge
def R(u, d): return rx + u, ry + d    # 1 mm = 1 mm; d into room (down)
hatch(rx - 32, ry - 22, 104, 20, 1.4)                         # masonry + coat
rect(rx - 32, ry - 2, 104, 2, 0.12, '#ddd')
xa, ya = R(-30, 0); rect(xa, ya, 30, 25, 0.35, NAVY2)         # MDF pilaster
text(rx - 15, ry + 14, 'MDF', 2.0, 'middle'); text(rx - 15, ry + 17.5, 'pilaster', 2.0, 'middle')
rect(rx, ry, 25, 2, 0.12, '#9aa6b8')                           # dark reveal back
rect(rx + 7.5, ry + 2, 10, 6, 0.3, GOLD)                       # gold bar
rect(rx + 25, ry, 20, 6, 0.2, NAVY2); rect(rx + 30, ry + 6, 10, 6, 0.2, NAVY2)   # field moulding M1
text(rx + 48, ry + 5, 'M1', 2.0)
dimH(rx, rx + 25, ry + 32, ry + 25, '25 reveal', 2.0, above=False)
dimH(rx + 7.5, rx + 17.5, ry + 14, ry + 8, '10', 1.8, above=False)
dimV(ry, ry + 25, rx - 36, rx - 30, '25', 1.8)
dimV(ry + 2, ry + 8, rx + 22, rx + 17.5, '6', 1.6, left=False)
text(rx + 52, ry - 6, 'masonry + 20 coat', 1.9)
text(DX + 112, 196, '10 × 6 gold-anodised aluminium flat bar on the dark-painted', 2.0)
text(DX + 112, 199.5, 'reveal back, centred, 17 mm behind the pilaster face. Continuous', 2.0)
text(DX + 112, 203, 'plinth → crown (one butt joint at the datum gap).', 2.0)
text(DX + 112, 206.5, 'Replaces LED: no wiring, no driver, no maintenance.', 2.0)

# D4 console section 1:10
S10 = 10.0
text(DX, 232, 'D4  Floating console  (section, 1:10)', 3.0, weight='bold')
cx, cy = DX + 70, 318                # wall paint face at floor
def C(d, z): return cx - d / S10, cy - z / S10
hatch(cx, C(0, 900)[1], 23, cy - C(0, 900)[1], 1.2)
line(cx - 50, cy, cx + 23, cy, 0.4)
def cr(d0, z0, d1, z1, sw, f):
    xa, ya = C(d1, z1); xb, yb = C(d0, z0); rect(xa, ya, xb - xa, yb - ya, sw, f)
cr(0, CZ0, CD, CZ1, 0.35, WAL)
cr(22, CZ1, 34, CZ1 + 30, 0.15, WAL)
cr(8, CZ1 + 22, 20, CZ1 + 26, 0.2, '#ffb000')
cr(40, CZ0 - 4, CD - 40, CZ0, 0.2, '#ffb000')
cr(CD - 8, CZ0 - 8, CD + 2, CZ0, 0.15, GOLD)
cr(50, CZ1, 130, CZ1 + 62, 0.15, '#333')
cr(140, CZ0 + 40, 210, CZ0 + 110, 0.15, '#eee')
text(C(175, 0)[0], C(0, CZ0 + 68)[1], 'driver', 1.6, 'middle')
cr(0, 0, 24, PLINTH, 0.2, NAVY2)
line(cx - 0.4, C(0, 900)[1], cx - 0.4, C(0, CZ1 - 30)[1], 0.35, '1.2 0.6', '#c00')
dimH(C(CD, 0)[0], cx, cy + 5, None, '356', 2.0, above=False)
dimV(C(0, CZ1)[1], C(0, CZ0)[1], C(CD, 0)[0] - 5, C(CD, 0)[0], '305', 1.9)
dimV(C(0, CZ0)[1], cy, C(CD, 0)[0] - 5, None, '305 clear', 1.9)
text(cx + 26, C(0, 800)[1], 'conduit from TV', 1.8, col='#c00')
for i, t in enumerate(['A  up-wash: strip behind a 30 mm walnut upstand, grazes the TV zone',
                       'B  under-glow: strip set back 40 mm — the console "floats"',
                       '8 mm gold edge strip on the front bottom edge',
                       'one 24 V circuit, 60 W driver inside the console, dimmable',
                       'steel French cleat into masonry (structural check by architect)']):
    text(DX + 105, 262 + i * 5, '• ' + t, 2.0)
text(C(14, 0)[0] - 2, C(0, CZ1 + 34)[1], 'A', 2.2, weight='bold', col='#a06000')
text(C(200, 0)[0], C(0, CZ0 - 12)[1] + 2.5, 'B', 2.2, weight='bold', col='#a06000')

# D5 crown + plinth 1:2 (shown at 1:4 for space)
S4 = 4.0
text(DX + 260, 42, 'D5  Crown + plinth  (sections, 1:4)', 3.0, weight='bold')
kx, ky = DX + 320, 70
def K(d, z): return kx - d / S4, ky + (TOP - z) / S4
hatch(kx, ky - 12, 6, 60, 1.2)
hatch(kx - 40, ky - 12, 46, 6, 1.2)
for d0, z0, z1, f in ((20, TOP - CROWN, TOP, NAVY2), (40, TOP - 80, TOP, NAVY2), (58, TOP - 40, TOP, NAVY2)):
    xa, ya = K(d0, z1); xb, yb = K(0, z0); rect(xa, ya + 6 / S4 * 0 + 0, xb - xa, yb - ya, 0.25, f)
xa, ya = K(44, TOP - 80); xb, yb = K(40, TOP - 92); rect(xa, ya, xb - xa, yb - ya, 0.2, GOLD)
_, ya = K(0, TOP); _, yb = K(0, TOP - CROWN); dimV(ya, yb, kx + 9, kx + 6, '120', 2.0, left=False)
xa, _ = K(58, 0); dimH(xa, kx, ky - 15, None, '58', 2.0)
text(kx - 40, ky + 40, 'stepped MDF crown, 12 mm gold fillet', 2.0)
px, py = DX + 320, 160
def Q(d, z): return px - d / S4, py - z / S4
hatch(px, py - 50, 6, 50, 1.2); hatch(px - 40, py, 46, 6, 1.2)
xa, ya = Q(18, 120); xb, yb = Q(0, 0); rect(xa, ya, xb - xa, yb - ya, 0.25, NAVY2)
xa, ya = Q(24, 150); xb, yb = Q(0, 120); rect(xa, ya, xb - xa, yb - ya, 0.25, NAVY2)
xa, ya = Q(31, 150); xb, yb = Q(24, 0); rect(xa, ya, xb - xa, yb - ya, 0.1, 'none', dash='1 0.5')
_, ya = Q(0, 150); dimV(ya, py, px + 9, px + 6, '150', 2.0, left=False)
xa, _ = Q(24, 0); dimH(xa, px, py + 10, None, '24', 2.0, above=False)
text(px - 40, py + 16, 'MDF plinth 18 / 24 proud; 31 proud', 2.0)
text(px - 40, py + 19.5, 'blocks under pilasters (dashed)', 2.0)

# ---------------------------------------------------------- SCHEDULE -----
TX = DX + 262
text(TX, 188, 'SPECIFICATION', 3.4, weight='bold')
SPEC = [
    ('Wall', 'Existing masonry; 20 mm plaster finish coat + putty. Matte emulsion, deep navy'),
    ('', '(design ref. sRGB #22385B — approve from a 1 m² site sample in hall daylight).'),
    ('Squares', '4 × 11, 298 mm outer (M1) + 184 mm inner (M2), 75 mm gaps; grid 1417 wide,'),
    ('', 'centred; one gap centred on the SF floor datum (3 rows below, 8 above).'),
    ('Pilasters', '208 × 25 mm MDF, PU satin, deeper navy (#1A2C48); single M1 panels 140 wide,'),
    ('', 'breaks aligned to the gold rule, the datum gap and the row 6|7 gap.'),
    ('Gold', '10 × 6 flat bar in both reveals (2 × 6.29 m) + 1417 × 12 rule at +2016 +'),
    ('', '12 mm crown fillet. Gold-anodised aluminium (brass-PVD optional). Nowhere else.'),
    ('Mouldings', 'All lines painted in situ, same navy as their ground (satin vs matte).'),
    ('TV', '55" class (≈1220 × 686), centre +1270; low-profile fixed bracket; single M1'),
    ('', 'frame 1417 × 930 = grid width. Sockets: 2 behind TV; 2 + LAN inside console.'),
    ('Conduit', '25 Ø PVC chased TV → console before plastering (power + HDMI).'),
    ('Console', 'Walnut veneer on 18 ply, 1600 × 305 × 356, underside +305, wall-hung on a'),
    ('', 'steel French cleat. 500 doors | 600 fluted centre | 500 doors. Gold edge strip.'),
    ('LED', 'Only in the console: 2 × ~1.5 m COB, 24 V, 2700–3000 K, CRI ≥ 90, in alu'),
    ('', 'profiles with opal diffusers; one 60 W driver inside; dimmable. ~3 m total.'),
    ('Pendants', 'Existing linen drum cluster in the void, globes at +3600 … +4400.'),
    ('Access', 'Full-height scaffold; set out the grid from the centreline and the datum.'),
]
for i, (k, v) in enumerate(SPEC):
    y = 195 + i * 4.4
    if k: text(TX, y, k, 2.15, weight='bold')
    text(TX + 18, y, v, 2.05)
text(TX, 279, 'Budget logic: the field is paint + moulding (cheapest per m²); spend goes', 2.05, style='italic')
text(TX, 282.5, 'to the pilasters, the gold lines and the console — where the eye lands.', 2.05, style='italic')

# legend
LX, LY = TX, 292
text(LX, LY, 'LEGEND', 2.6, weight='bold')
for i, (f, lab) in enumerate(((NAVY, 'painted field (matte)'), (NAVY2, 'MDF / PU moulding (satin)'),
                              (GOLD, 'gold-anodised aluminium'), (WAL, 'walnut veneer'),
                              (TVF, 'TV'), ('#ffb000', 'LED strip (console only)'))):
    rect(LX + (i % 3) * 58, LY + 3 + (i // 3) * 6, 5, 3.5, 0.15, f)
    text(LX + 7 + (i % 3) * 58, LY + 5.9 + (i // 3) * 6, lab, 2.0)

# ---------------------------------------------------------- notes + title --
NX, NY = 352, 398
text(NX, NY, 'NOTES', 2.8, weight='bold')
for i, s in enumerate(['1. All dimensions in mm unless noted. Levels from FF finished floor level (±0).',
                       '2. Design-intent drawing for discussion — architect / structural engineer to verify',
                       '    wall construction, fixings, scaffold and all services before construction.',
                       '3. Verify wall width (2221) and FF → soffit height (6556) on site; set out from',
                       '    the wall centreline (A–A) and the SF floor datum (+3353).',
                       '4. Do not scale. Renders: renders/media-wall/*.jpg (same model, same dimensions).']):
    text(NX, NY + 5 + i * 4.2, s, 2.1)

BX, BY, BW, BH = 641, 524, 180, 50
rect(BX, BY, BW, BH, 0.4)
line(BX, BY + 14, BX + BW, BY + 14, 0.25); line(BX, BY + 30, BX + BW, BY + 30, 0.25)
line(BX + 110, BY + 30, BX + 110, BY + BH, 0.25)
text(BX + 4, BY + 6, 'CHANDRASEKHAR RESIDENCE · ANANTAPUR', 3.0, weight='bold')
text(BX + 4, BY + 11, 'G+2 residence — first floor hall, double-height void', 2.2)
text(BX + 4, BY + 21, 'DOUBLE-HEIGHT MEDIA WALL', 4.0, weight='bold')
text(BX + 4, BY + 26.5, 'Elevation · section · plan · details · specification', 2.3)
text(BX + 4, BY + 36, 'Drawing  MW-01', 2.6, weight='bold')
text(BX + 4, BY + 41, 'Rev A — design intent, for discussion', 2.2)
text(BX + 4, BY + 46, 'Scales as noted @ A1 · mm', 2.2)
text(BX + 114, BY + 36, 'Date  2026-10-17', 2.4)
text(BX + 114, BY + 41, 'Status  NOT FOR', 2.2)
text(BX + 114, BY + 45, 'CONSTRUCTION', 2.2, weight='bold')
# north / view arrow
add('<g transform="translate(800,40)"><circle r="6" fill="none" stroke="#111" stroke-width="0.3"/>'
    '<path d="M0,-5 L2,3 L0,1.5 L-2,3 Z" fill="#111"/><text y="-7.5" font-size="2.6" text-anchor="middle" font-weight="bold">N</text></g>')

svg = ('<svg xmlns="http://www.w3.org/2000/svg" width="841mm" height="594mm" viewBox="0 0 841 594" '
       'font-family="Arial, Helvetica, sans-serif">' + '\n'.join(out) + '</svg>')
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'drawings', 'media-wall')
os.makedirs(root, exist_ok=True)
open(os.path.join(root, 'MW-01.svg'), 'w', encoding='utf-8').write(svg)
open(os.path.join(root, 'MW-01.html'), 'w', encoding='utf-8').write(
    '<!doctype html><html><head><meta charset="utf-8"><title>MW-01 Media Wall</title>'
    '<style>@page{size:841mm 594mm;margin:0}html,body{margin:0;padding:0}svg{display:block}</style>'
    '</head><body>' + svg + '</body></html>')
print('wrote', os.path.normpath(root))
