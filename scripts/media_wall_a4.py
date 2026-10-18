"""
Phone-friendly A4 booklet of the FF hall double-height media wall (MW-01 Rev C).
Drawings, renders and specifications only - no prose. Every dimension
mirrors Fur.tvFeatureWall in houseScene.js (v3: gold reveals, golden-ratio
squares, console-only LED).

    python scripts/media_wall_a4.py
    chrome --headless --print-to-pdf=drawings/media-wall/MW-01_A4.pdf drawings/media-wall/MW-01_A4.html
"""
import os

# ---------------------------------------------------------------- model ---
W = 2221
H = 3353
TOP = 2 * H - 150                       # 6556
PB, REV, PIL, PD = 208, 25, 233, 25
PLINTH, CROWN = 150, 120
MOD, GAP = 298, 75
P = MOD + GAP
GRID = 4 * MOD + 3 * GAP                # 1417
G0 = (W - GRID) / 2
G1 = G0 + GRID
ZROW0 = H - GAP / 2 - 3 * MOD - 2 * GAP  # 2271.5
INS = 57
TVF0, TVF1 = 830, 1760
RULE = (TVF1 + ZROW0) / 2
TVW, TVH, TVC = 1220, 686, 1270
CW, CD, CZ0, CZ1 = 1600, 356, 305, 610
C0 = W / 2 - CW / 2
def brk(k): return ZROW0 + k * P - GAP / 2
PIL_PANELS = [(260, RULE - 40), (RULE + 40, brk(3) - 38),
              (brk(3) + 38, brk(7) - 38), (brk(7) + 38, TOP - CROWN - 110)]

GOLD, NAVY, NAVY2, WAL, TVF, LED = '#d6b25e', '#dfe5ee', '#c3cddd', '#ead8c4', '#5f6267', '#ffb000'
INK, MUTE, RED, BLUE = '#14181f', '#5b6472', '#b3261e', '#2c4a7a'
def fmt(v): return ('%.0f' % v) if abs(v - round(v)) < 0.05 else ('%.1f' % v)

# ---------------------------------------------------------------- canvas --
class Canvas:
    def __init__(self, w, h):
        self.w, self.h, self.o, self.clip = w, h, [], 0
    def add(self, s): self.o.append(s)
    def line(self, x1, y1, x2, y2, w=0.25, dash=None, col=INK):
        d = ' stroke-dasharray="%s"' % dash if dash else ''
        self.add('<line x1="%.3f" y1="%.3f" x2="%.3f" y2="%.3f" stroke="%s" stroke-width="%.3f"%s/>' % (x1, y1, x2, y2, col, w, d))
    def rect(self, x, y, w, h, sw=0.25, fill='none', col=INK, dash=None, rx=0):
        d = ' stroke-dasharray="%s"' % dash if dash else ''
        self.add('<rect x="%.3f" y="%.3f" width="%.3f" height="%.3f" rx="%.2f" fill="%s" stroke="%s" stroke-width="%.3f"%s/>' % (x, y, w, h, rx, fill, col, sw, d))
    def text(self, x, y, s, size=3.4, anchor='start', rot=0, weight='normal', col=INK, style='normal'):
        tr = ' transform="rotate(%g %.3f %.3f)"' % (rot, x, y) if rot else ''
        s = s.replace('&', '&amp;').replace('<', '&lt;')
        self.add('<text x="%.3f" y="%.3f" font-size="%.2f" text-anchor="%s" font-weight="%s" font-style="%s" fill="%s"%s>%s</text>' % (x, y, size, anchor, weight, style, col, tr, s))
    def tick(self, x, y, s=1.3):
        self.line(x - s, y + s, x + s, y - s, 0.4)
    def dimH(self, x1, x2, y, ref=None, label='', size=3.0, below=False):
        if ref is not None:
            for x in (x1, x2): self.line(x, ref, x, y + (1.5 if y > ref else -1.5), 0.15, col=MUTE)
        self.line(x1 - 1.5, y, x2 + 1.5, y, 0.2)
        self.tick(x1, y); self.tick(x2, y)
        self.text((x1 + x2) / 2, y + size + 0.6 if below else y - 1.0, label, size, 'middle')
    def dimV(self, y1, y2, x, ref=None, label='', size=3.0, right=False):
        if ref is not None:
            for y in (y1, y2): self.line(ref, y, x + (1.5 if x > ref else -1.5), y, 0.15, col=MUTE)
        self.line(x, y1 - 1.5, x, y2 + 1.5, 0.2)
        self.tick(x, y1); self.tick(x, y2)
        self.text(x + size + 0.4 if right else x - 1.0, (y1 + y2) / 2, label, size, 'middle', -90)
    def hatch(self, x, y, w, h, step=2.0, sw=0.12):
        self.clip += 1
        self.add('<clipPath id="k%d"><rect x="%.3f" y="%.3f" width="%.3f" height="%.3f"/></clipPath><g clip-path="url(#k%d)">' % (self.clip, x, y, w, h, self.clip))
        k = -h
        while k < w:
            self.line(x + k, y + h, x + k + h, y, sw, col='#8a8f98'); k += step
        self.add('</g>')
        self.rect(x, y, w, h, 0.35)
    def begin_clip(self, x, y, w, h):
        self.clip += 1
        self.add('<clipPath id="k%d"><rect x="%.3f" y="%.3f" width="%.3f" height="%.3f"/></clipPath><g clip-path="url(#k%d)">' % (self.clip, x, y, w, h, self.clip))
    def end_clip(self): self.add('</g>')
    def svg(self):
        return ('<svg xmlns="http://www.w3.org/2000/svg" width="%gmm" height="%gmm" viewBox="0 0 %g %g" '
                'font-family="Inter, Arial, Helvetica, sans-serif">%s</svg>' % (self.w, self.h, self.w, self.h, ''.join(self.o)))

# ------------------------------------------------------- shared drawings --
def elevation(c, ox, oy, sc, z0=0, z1=TOP, lw=1.0):
    """Front elevation; wall origin (u=0, z=0) at paper (ox, oy); only z0..z1 drawn."""
    def E(u, z): return ox + u / sc, oy - z / sc
    def er(u0, za, u1, zb, sw=0.2, fill='none', dash=None):
        xa, yb = E(u0, za); xb, ya = E(u1, zb); c.rect(xa, ya, xb - xa, yb - ya, sw * lw, fill, dash=dash)
    def mould(u0, za, u1, zb, w):
        er(u0, za, u1, zb, 0.18); er(u0 + w, za + w, u1 - w, zb - w, 0.1)
    xa, ya = E(-10, z1); xb, yb = E(W + 10, z0)
    c.begin_clip(xa, ya, xb - xa, yb - ya)
    er(0, 0, W, TOP, 0.4, NAVY)
    er(0, 0, W, PLINTH, 0.25, NAVY2)
    er(0, TOP - CROWN, W, TOP, 0.25, NAVY2)
    for z in (TOP - 80, TOP - 40):
        xl, y = E(0, z); xr, _ = E(W, z); c.line(xl, y, xr, y, 0.12 * lw)
    er(0, TOP - 92, W, TOP - 80, 0.12, GOLD)
    for s in (0, 1):
        p0 = W - PB if s else 0
        er(p0, PLINTH, p0 + PB, TOP - CROWN, 0.35, NAVY2)
        r0 = W - PIL if s else PB
        er(r0, PLINTH, r0 + REV, TOP - CROWN, 0.15, '#93a0b4')
        er(r0 + 7.5, PLINTH, r0 + 17.5, TOP - CROWN, 0.08, GOLD)
        for za, zb in PIL_PANELS:
            mould(p0 + 34, za, p0 + PB - 34, zb, 20)
    for r in range(11):
        za = ZROW0 + r * P
        for col in range(4):
            ua = G0 + col * P
            mould(ua, za, ua + MOD, za + MOD, 20)
            mould(ua + INS, za + INS, ua + MOD - INS, za + MOD - INS, 14)
    mould(G0, TVF0, G1, TVF1, 20)
    er(G0, RULE - 6, G1, RULE + 6, 0.1, GOLD)
    er(W / 2 - TVW / 2, TVC - TVH / 2, W / 2 + TVW / 2, TVC + TVH / 2, 0.45, TVF)
    er(C0, CZ0, C0 + CW, CZ1, 0.45, WAL)
    for u in (C0 + 500, C0 + CW - 500):
        x, ya = E(u, CZ0 + 20); _, yb = E(u, CZ1 - 26); c.line(x, ya, x, yb, 0.18)
    u = C0 + 508
    while u + 14 <= C0 + CW - 508:
        x, ya = E(u + 7, CZ0 + 24); _, yb = E(u + 7, CZ1 - 30); c.line(x, ya, x, yb, 0.08, col='#8a6a4a'); u += 22
    er(C0, CZ0 - 8, C0 + CW, CZ0, 0.08, GOLD)
    for z, a, b in ((CZ0 - 40, C0 + 60, C0 + CW - 60), (CZ1 + 60, C0 + 40, C0 + CW - 40)):
        xa_, y = E(a, z); xb_, _ = E(b, z); c.line(xa_, y, xb_, y, 0.5, '1.4 0.8', LED)
    c.end_clip()
    return E

# ---------------------------------------------------------------- pages ---
PW, PH, M = 210, 297, 12
pages = []
def page(title, sub=None):
    c = Canvas(PW, PH)
    c.add('<rect width="210" height="297" fill="#fff"/>')
    c.text(M, 13, 'MW-01  ·  DOUBLE-HEIGHT MEDIA WALL  ·  CHANDRASEKHAR RESIDENCE', 2.6, col=MUTE, weight='bold')
    c.line(M, 15.5, PW - M, 15.5, 0.3, col='#c9ced6')
    c.text(M, 28, title, 7.2, weight='bold')
    if sub: c.text(M, 35, sub, 3.8, col=MUTE)
    pages.append(c)
    return c
def footer(c, n, total):
    c.line(M, PH - 14, PW - M, PH - 14, 0.3, col='#c9ced6')
    c.text(M, PH - 9, 'Rev C · 17 Oct 2026 · all dimensions mm', 2.6, col=MUTE)
    c.text(PW - M, PH - 9, '%d / %d' % (n, total), 3.0, 'end', weight='bold', col=MUTE)
def img(c, src, x, y, w, h, caption=None):
    c.add('<image href="%s" x="%.2f" y="%.2f" width="%.2f" height="%.2f" preserveAspectRatio="xMidYMid slice"/>' % (src, x, y, w, h))
    c.rect(x, y, w, h, 0.3, col='#c9ced6')
    if caption: c.text(x, y + h + 5, caption, 3.2, col=MUTE)
def bullets(c, x, y, items, size=4.0, gap=None, width_chars=None, head_col=INK):
    gap = gap or size * 1.55
    for head, body in items:
        c.add('<circle cx="%.2f" cy="%.2f" r="0.9" fill="%s"/>' % (x + 1, y - size * 0.32, GOLD))
        c.text(x + 4.5, y, head, size, weight='bold', col=head_col)
        y += gap
        for ln in body:
            c.text(x + 4.5, y, ln, size * 0.86, col='#2b313b'); y += gap * 0.86
        y += gap * 0.45
    return y
R = '../../renders/media-wall/'

# 1 cover --------------------------------------------------------------------
c = page('Double-height media wall', 'FF hall · 2221 × 6556 mm')
img(c, R + 'hero.jpg', M, 42, 186, 212)
y0 = 42 + 212 + 9
for i, (big, small) in enumerate((('2221 × 6556', 'wall'), ('55"', 'TV'), ('4 × 11', 'squares'))):
    x = M + i * 62
    c.text(x, y0 + 4, big, 5.6, weight='bold'); c.text(x, y0 + 9.5, small, 2.9, col=MUTE)

# 3 full elevation -----------------------------------------------------------
c = page('Front elevation', '1:30')
sc = 30.0
ox, oy = M + 34, 42 + TOP / sc + 6
E = elevation(c, ox, oy, sc)
xl, yf = E(0, 0); xr, ys = E(W, TOP)
c.hatch(xl - 8, yf, (xr - xl) + 16, 4); c.hatch(xl - 8, ys - 4, (xr - xl) + 16, 4)
_, yd = E(0, H); c.line(xl - 10, yd, xr + 10, yd, 0.3, '3 1.5 0.8 1.5', BLUE)
c.dimH(xl, xr, yf + 13, yf + 4, '2221', 3.6, below=False)
c.dimV(ys, yf, xl - 14, xl, '6556  (21\'-6")', 3.6)
gx0, _ = E(G0, 0); gx1, _ = E(G1, 0); _, gt = E(0, TOP - CROWN)
c.dimH(gx0, gx1, ys - 8, None, '1417 grid = TV frame', 3.0)
labels = [(TOP, 'SF soffit +6556', INK), (ZROW0 + 10 * P + MOD, 'top of grid +6300', INK),
          (H, 'SF floor level +3353 (11\' datum)', BLUE), (ZROW0, 'bottom of grid +2272', INK),
          (RULE, 'gold rule +2016', '#8a6a1a'), (TVC, 'TV centre +1270 (50")', INK),
          (CZ1, 'console top +610', INK), (CZ0, 'console underside +305', INK), (0, 'FF floor ±0', INK)]
for z, lab, col in labels:
    _, y = E(0, z)
    c.line(xr + 2, y, xr + 9, y, 0.2, col=MUTE)
    c.text(xr + 10, y + 1.2, lab, 3.2, col=col)
c.text(xl - 22, oy - 4, '', 3)

# 4 TV zone elevation --------------------------------------------------------
c = page('TV & console zone', '1:13')
sc = 13.0
ox, oy = M + 2, 252
E = elevation(c, ox, oy, sc, 0, 2560)
xl, yf = E(0, 0); xr, ytop = E(W, 2560)
c.hatch(xl - 2, yf, xr - xl + 4, 4)
c.line(xl - 2, ytop, xr + 2, ytop, 0.25, '2 1', MUTE)
xs = [0, PB, PIL, G0, G1, W - PIL, W - PB, W]
for a, b in zip(xs, xs[1:]):
    xa, _ = E(a, 0); xb, _ = E(b, 0)
    c.dimH(xa, xb, yf + 10, yf + 4, fmt(b - a), 2.9, below=False)
xa, _ = E(W / 2 - TVW / 2, 0); xb, _ = E(W / 2 + TVW / 2, 0); _, yt = E(0, TVC + TVH / 2)
c.dimH(xa, xb, yt - 4, None, '55" TV  1220 × 686', 3.0)
xa, _ = E(C0, 0); xb, _ = E(C0 + CW, 0); _, yc = E(0, CZ0)
c.dimH(xa, xb, yc + 5, None, 'console 1600', 3.0, below=True)
for z, lab in ((PLINTH, '150'), (CZ0, '305'), (CZ1, '610'), (TVF0, '830'), (TVC, '1270'), (TVF1, '1760'),
               (RULE, '2016'), (ZROW0, '2272')):
    _, y = E(0, z); c.line(xr + 1, y, xr + 4, y, 0.2, col=MUTE)
    c.text(xr + 4.5, y + 1.1, '+' + lab, 2.8, weight='bold')
# 5 squares + mouldings ------------------------------------------------------
c = page('Squares & mouldings', 'module 1:3.5 · profiles 3:1')
s5 = 3.5                                   # 1:3.5
mx, my = M + 30, 160
def Q(u, z): return mx + u / s5, my - z / s5
x0, y0 = Q(-40, MOD + 40)
c.rect(x0, y0, (MOD + 80 + GAP + 60) / s5, (MOD + 80) / s5, 0.2, NAVY)
for a, w in ((0, 20), (INS, 14)):
    xa, ya = Q(a, MOD - a); xb, yb = Q(MOD - a, a)
    c.rect(xa, ya, xb - xa, yb - ya, 0.4, NAVY2); c.rect(xa + w / s5, ya + w / s5, xb - xa - 2 * w / s5, yb - ya - 2 * w / s5, 0.25, NAVY)
xn, _ = Q(MOD + GAP, 0); _, yn0 = Q(0, MOD); _, yn1 = Q(0, 0)
c.rect(xn, yn0, 60 / s5, MOD / s5, 0.4, NAVY2); c.rect(xn + 20 / s5, yn0 + 20 / s5, 40 / s5, MOD / s5 - 40 / s5, 0.25, NAVY)
xa, _ = Q(0, 0); xb, _ = Q(MOD, 0); c.dimH(xa, xb, my + 14, my, '298', 3.4, below=False)
xg, _ = Q(MOD, 0); c.dimH(xg, xn, my + 14, my, '75', 3.4, below=False)
xa, _ = Q(INS, 0); xb, _ = Q(MOD - INS, 0); _, yi = Q(0, MOD - INS); c.dimH(xa, xb, yi + 5, None, '184', 3.4, below=True)
_, ya = Q(0, MOD); _, yb = Q(0, MOD - INS); xl, _ = Q(0, 0); c.dimV(ya, yb, xl - 6, xl, '57', 3.2)
_, ya = Q(0, MOD); _, yb = Q(0, MOD - 20); c.dimV(ya, yb, xl - 13, xl, '20', 3.0)
def prof(x, y, steps, s, name):
    prev = 0; tot = steps[0][1]
    c.hatch(x - 5, y, tot * s + 10, 4, 1.6)
    for i, w, pr in steps:
        c.rect(x + i * s, y - pr * s, w * s, (pr - prev) * s, 0.4, NAVY2); prev = pr
    c.dimH(x, x + tot * s, y + 11, y + 4, str(tot), 3.2, below=False)
    c.dimV(y - steps[-1][2] * s, y, x + tot * s + 7, x + tot * s, str(steps[-1][2]), 3.2, right=True)
    c.text(x + tot * s / 2, y - steps[-1][2] * s - 5, name, 3.6, 'middle', weight='bold')
prof(M + 8, 250, [(0, 20, 6), (5, 10, 12)], 3.0, 'M1  20 × 12')
prof(M + 108, 250, [(0, 14, 5), (4, 6, 9)], 3.0, 'M2  14 × 9')
c.text(M, 272, 'M1 PU 20 × 12 — outer squares, TV frame, pilaster panels', 3.4)
c.text(M, 277, 'M2 PU 14 × 9 — inner squares', 3.4)

# 6 section A-A --------------------------------------------------------------
c = page('Section A–A', '1:30')
sc = 30.0
SX, SY = 120, 42 + TOP / sc + 6
def Sv(d, z): return SX - d / sc, SY - z / sc
_, yt = Sv(0, TOP); _, yb = Sv(0, 0)
c.hatch(SX + 0.7, yt, 230 / sc, yb - yt, 1.6)
c.rect(SX, yt, 0.7, yb - yt, 0.15, '#bbb')
c.hatch(SX - 40, yt - 5, 40 + 0.7 + 230 / sc, 5, 1.6); c.hatch(SX - 40, yb, 40 + 0.7 + 230 / sc, 5, 1.6)
def sr(d0, z0, d1, z1, sw=0.3, f='none'):
    xa, ya = Sv(d1, z1); xb, yb_ = Sv(d0, z0); c.rect(xa, ya, xb - xa, yb_ - ya, sw, f)
sr(0, 0, 24, PLINTH, 0.3, NAVY2)
for d, z in ((20, TOP - CROWN), (40, TOP - 80), (58, TOP - 40)): sr(0, z, d, TOP, 0.3, NAVY2)
sr(0, CZ0, CD, CZ1, 0.45, WAL); sr(0, TVC - TVH / 2, 61, TVC + TVH / 2, 0.45, TVF)
for r in range(11):
    za = ZROW0 + r * P; sr(0, za, 12, za + 20, 0.1, NAVY2); sr(0, za + MOD - 20, 12, za + MOD, 0.1, NAVY2)
xa, ya = Sv(0, TVC); _, yc = Sv(0, CZ1 - 30)
c.line(SX + 0.35, ya, SX + 0.35, yc, 0.6, '1.6 0.8', RED)
_, yd = Sv(0, H); c.line(SX - 40, yd, SX + 12, yd, 0.3, '3 1.5 0.8 1.5', BLUE)
notes = [(TOP - 60, 'MDF crown 120 × 58, gold fillet'), (ZROW0 + 6 * P, 'PU moulding 12 on 20 plaster'),
         (H, 'SF FFL +3353'), (TVC + 250, 'TV, bracket 61'),
         (TVC - 120, '25 Ø conduit'), ((CZ0 + CZ1) / 2, 'console 356'),
         (60, 'MDF plinth 150 × 24')]
for z, t in notes:
    _, y = Sv(0, z); c.line(SX + 8.5, y, SX + 14, y, 0.2, col=MUTE)
    c.text(SX + 15, y + 1.2, t, 3.0, col=RED if 'conduit' in t else (BLUE if 'SF floor' in t else INK))
c.text(SX - 40, yb + 10, 'FF slab', 3.0, col=MUTE); c.text(SX - 40, yt - 7, 'roof slab', 3.0, col=MUTE)
c.text(SX + 2, yt - 7, '230 masonry', 3.0, col=MUTE)

# 7 plan B-B + gold reveal ---------------------------------------------------
c = page('Plan B–B  +  gold reveal', 'plan at +1200, 1:12 · reveal 2:1')
sc = 12.0
PX, PY = M + 0.5, 70
def Pp(u, d): return PX + u / sc, PY + d / sc
x0, y0 = Pp(0, -250); c.hatch(x0, y0, W / sc, 230 / sc, 1.6)
c.rect(x0, PY - 20 / sc, W / sc, 20 / sc, 0.15, '#ddd')
def pr(u0, d0, u1, d1, sw=0.3, f='none', dash=None):
    xa, ya = Pp(u0, d0); xb, yb = Pp(u1, d1); c.rect(xa, ya, xb - xa, yb - ya, sw, f, dash=dash)
for s in (0, 1):
    p0 = W - PB if s else 0
    pr(p0, 0, p0 + PB, PD, 0.4, NAVY2)
    r0 = W - PIL if s else PB; pr(r0 + 7.5, 2, r0 + 17.5, 8, 0.15, GOLD)
pr(G0, 0, G0 + 20, 12, 0.15, NAVY2); pr(G1 - 20, 0, G1, 12, 0.15, NAVY2)
pr(W / 2 - TVW / 2 - 5, 30, W / 2 + TVW / 2 + 5, 61, 0.45, TVF)
pr(C0, 0, C0 + CW, CD, 0.3, 'none', '1.8 1')
xs = [0, PB, PIL, G0, W / 2 - TVW / 2, W / 2 + TVW / 2, G1, W - PIL, W - PB, W]
for a, b in zip(xs, xs[1:]):
    xa, _ = Pp(a, 0); xb, _ = Pp(b, 0); c.dimH(xa, xb, PY - 26, PY - 22, fmt(b - a), 2.6)
c.text(PX + W / sc / 2, PY + CD / sc + 6, 'console 1600 × 356 (dashed)', 3.2, 'middle', col=MUTE)
# reveal 2:1
s2 = 0.5
rx, ry = M + 70, 150
def Rr(u, d): return rx + u / s2, ry + d / s2
c.hatch(rx - 60, ry - 40, 170, 36, 2.2)
c.rect(rx - 60, ry - 4, 170, 4, 0.2, '#ddd')
xa, ya = Rr(-30, 0); c.rect(xa, ya, 60, 50, 0.5, NAVY2)
c.text(rx - 30, ry + 26, 'MDF', 3.6, 'middle', weight='bold'); c.text(rx - 30, ry + 31, 'pilaster', 3.4, 'middle')
xa, ya = Rr(0, 0); c.rect(xa, ya, 50, 4, 0.2, '#93a0b4')
xa, ya = Rr(7.5, 2); c.rect(xa, ya, 20, 12, 0.5, GOLD)
xa, ya = Rr(25, 0); c.rect(xa, ya, 40, 12, 0.35, NAVY2); xa, ya = Rr(30, 6); c.rect(xa, ya, 20, 12, 0.35, NAVY2)
c.text(Rr(46, 0)[0], Rr(0, 9)[1], 'M1 moulding', 3.2)
c.dimH(rx, Rr(25, 0)[0], Rr(0, 25)[1] + 16, Rr(0, 25)[1], '25 reveal', 3.4, below=False)
c.dimH(Rr(7.5, 0)[0], Rr(17.5, 0)[0], Rr(0, 8)[1] + 9, Rr(0, 8)[1], '10', 3.2, below=True)
c.dimV(Rr(0, 0)[1], Rr(0, 25)[1], Rr(-30, 0)[0] - 6, Rr(-30, 0)[0], '25', 3.2)
c.dimV(Rr(0, 2)[1], Rr(0, 8)[1], Rr(25, 0)[0] + 3, Rr(17.5, 0)[0], '6', 3.0, right=True)
c.text(rx + 40, ry - 10, 'masonry + 20 plaster', 3.2, col=MUTE)
c.text(M, 232, 'Gold-anodised aluminium flat bar 10 × 6, continuous plinth → crown, 2 × 6.29 m', 3.4)

# 8 console + LED + crown/plinth --------------------------------------------
c = page('Console, LED, crown', 'console 1:6 · crown 1:3')
s5 = 6.0
cx, cy = M + 80, 168
def Cc(d, z): return cx - d / s5, cy - z / s5
c.hatch(cx, Cc(0, 680)[1], 12, cy - Cc(0, 680)[1], 1.6)
c.line(cx - 66, cy, cx + 12, cy, 0.5)
def cr(d0, z0, d1, z1, sw, f):
    xa, ya = Cc(d1, z1); xb, yb = Cc(d0, z0); c.rect(xa, ya, xb - xa, yb - ya, sw, f)
cr(0, 0, 24, PLINTH, 0.35, NAVY2)
cr(0, CZ0, CD, CZ1, 0.5, WAL); cr(CD - 14, CZ0, CD, CZ1, 0.25, '#d9c2a8')
cr(22, CZ1, 34, CZ1 + 30, 0.3, WAL)
cr(8, CZ1 + 22, 20, CZ1 + 26, 0.3, LED); cr(40, CZ0 - 4, CD - 40, CZ0, 0.3, LED)
cr(CD - 8, CZ0 - 8, CD + 2, CZ0, 0.25, GOLD)
cr(50, CZ1, 130, CZ1 + 62, 0.25, '#333')
cr(150, CZ0 + 40, 230, CZ0 + 120, 0.25, '#eee')
c.text(Cc(190, 0)[0], Cc(0, CZ0 + 75)[1], 'driver', 2.8, 'middle')
c.line(cx - 0.4, Cc(0, 680)[1], cx - 0.4, Cc(0, CZ1 - 30)[1], 0.6, '1.6 0.8', RED)
c.dimH(Cc(CD, 0)[0], cx, cy + 9, cy, '356', 3.4, below=False)
c.dimV(Cc(0, CZ1)[1], Cc(0, CZ0)[1], Cc(CD, 0)[0] - 7, Cc(CD, 0)[0], '305', 3.2)
c.dimV(Cc(0, CZ0)[1], cy, Cc(CD, 0)[0] - 7, None, '305 clear', 3.2)
c.text(Cc(14, 0)[0] - 1, Cc(0, CZ1 + 50)[1], 'A', 4.0, 'middle', weight='bold', col='#a06000')
c.text(Cc(200, 0)[0], Cc(0, CZ0 - 22)[1] + 3, 'B', 4.0, 'middle', weight='bold', col='#a06000')
c.text(cx + 15, Cc(0, 600)[1], 'conduit', 3.0, col=RED); c.text(cx + 15, Cc(0, 600)[1] + 4, 'from TV', 3.0, col=RED)
c.text(M, 44, 'Console section 1:6', 3.6, weight='bold')
for i, (k, v) in enumerate((('A', 'LED up-wash behind 30 mm upstand'), ('B', 'LED under-glow, 40 set back'),
                             ('LED', '24 V COB · 2700–3000 K · CRI ≥ 90 · ~3 m · 60 W driver · dimmable'),
                             ('Console', 'walnut veneer on 18 ply · 1600 × 305 × 356 · steel French cleat'))):
    c.text(M, 196 + i * 7, k, 3.6, weight='bold', col='#a06000' if len(k) == 1 else INK)
    c.text(M + 22, 196 + i * 7, v, 3.4)
# crown + plinth small
kx, ky = M + 175, 58
def K(d, z): return kx - d / 3.0, ky + (TOP - z) / 3.0
c.text(M + 135, 50, 'Crown 1:3', 3.6, weight='bold')
for d, z in ((20, TOP - CROWN), (40, TOP - 80), (58, TOP - 40)):
    xa, ya = K(d, TOP); xb, yb = K(0, z); c.rect(xa, ya, xb - xa, yb - ya, 0.35, NAVY2)
xa, ya = K(44, TOP - 80); xb, yb = K(40, TOP - 92); c.rect(xa, ya, xb - xa, yb - ya, 0.3, GOLD)
c.hatch(kx, ky - 4, 5, 48, 1.4); c.hatch(kx - 30, ky - 4, 35, 4, 1.4)
c.dimV(K(0, TOP)[1], K(0, TOP - CROWN)[1], kx + 9, kx + 5, '120', 3.0, right=True)
c.dimH(K(58, 0)[0], kx, ky + 50, None, '58', 3.0, below=True)

# 9 specification ------------------------------------------------------------
c = page('Specification')
rows = [
    ('Wall', 'plaster + putty · matte emulsion, deep navy #22385B'),
    ('Squares', '44 (4 × 11) · 298 outer M1 + 184 inner M2 · 75 gap · grid 1417'),
    ('Pilasters', 'MDF 208 × 25 · PU satin navy #1A2C48 · M1 panels 140 wide'),
    ('Gold', 'gold-anodised Al · 10 × 6 bar 2 × 6.29 m · rule 1417 × 12 @ +2016 · crown fillet 12'),
    ('Mouldings', 'PU · M1 20 × 12 · M2 14 × 9 · painted with the wall, satin'),
    ('Crown', 'MDF stepped 120 × 58'),
    ('Plinth', 'MDF 150 × 24 · blocks 31 under pilasters'),
    ('TV', '55" (1220 × 686) · centre +1270 · fixed bracket · M1 frame 1417 × 930'),
    ('Power', '25 Ø conduit TV → console · 2 sockets behind TV · 2 sockets + LAN in console'),
    ('Console', 'walnut veneer · 1600 × 305 × 356 · underside +305 · 500 | 600 fluted | 500'),
    ('LED', 'console only · up-wash + under-glow · 24 V COB 2700–3000 K · ~3 m'),
    ('Pendants', 'linen drum cluster · +3600 … +4400'),
]
y = 48
for k, v in rows:
    c.rect(M, y - 5.2, 186, 0.01, 0.2, col='#dde1e7')
    c.text(M, y, k, 3.6, weight='bold')
    words, ln, lines = v.split(' '), '', []
    for w_ in words:
        if len(ln) + len(w_) > 58: lines.append(ln); ln = w_
        else: ln = (ln + ' ' + w_).strip()
    lines.append(ln)
    for i, l in enumerate(lines): c.text(M + 38, y + i * 4.8, l, 3.4)
    y += 4.8 * len(lines) + 5
sw_y = y + 6
c.text(M, sw_y, 'Finishes', 4.2, weight='bold')
for i, (f, lab) in enumerate(((NAVY, 'painted field'), (NAVY2, 'MDF / mouldings'), (GOLD, 'gold aluminium'),
                              (WAL, 'walnut'), (TVF, 'TV'), (LED, 'LED (console)'))):
    x = M + (i % 3) * 62; yy = sw_y + 6 + (i // 3) * 10
    c.rect(x, yy, 8, 6, 0.25, f); c.text(x + 11, yy + 4.5, lab, 3.4)

# renders ----------------------------------------------------------------------
c = page('Evening')
img(c, R + 'hero_night.jpg', M, 42, 186, 228)

c = page('Day')
img(c, R + 'side.jpg', M, 42, 186, 130)
img(c, R + 'tv.jpg', M, 178, 186, 98)

c = page('Details')
img(c, R + 'detail.jpg', M, 42, 90, 112)
img(c, R + 'tv_night.jpg', M + 96, 42, 90, 112)
img(c, R + 'hero.jpg', M + 38, 160, 110, 116)

for i, cv in enumerate(pages): footer(cv, i + 1, len(pages))

root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'drawings', 'media-wall')
os.makedirs(root, exist_ok=True)
html = ('<!doctype html><html><head><meta charset="utf-8"><title>MW-01 Media Wall (A4)</title>'
        '<style>@page{size:210mm 297mm;margin:0}html,body{margin:0;padding:0}'
        '.pg{width:210mm;height:297mm;page-break-after:always;break-after:page;overflow:hidden}'
        '.pg:last-child{page-break-after:auto;break-after:auto}svg{display:block}</style></head><body>'
        + ''.join('<div class="pg">%s</div>' % p.svg() for p in pages) + '</body></html>')
open(os.path.join(root, 'MW-01_A4.html'), 'w', encoding='utf-8').write(html)
print('pages:', len(pages))

if os.environ.get('MW_PAGES'):            # debug: one SVG per page for previews
    for i, p in enumerate(pages):
        open(os.path.join(root, '_p%02d.svg' % (i + 1)), 'w', encoding='utf-8').write(p.svg())
