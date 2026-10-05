"""
Issues the ground floor lighting drawing set as PDF.

    GF-EL-01_Lighting-and-Fan-Layout.pdf    3 sheets, A2 landscape
        Sheet 01  Layout plan, 1:50
        Sheet 02  Luminaire type schedule, light point schedule, fan schedule
        Sheet 03  Illumination calculations and design basis

    GF-EL-SPEC_Specification.pdf            A4 portrait specification

Line weights follow ISO 128 (0.25 / 0.35 / 0.50 / 0.70 mm), lettering follows
ISO 3098 nominal heights (2.0 / 2.5 / 3.5 / 5.0 / 7.0 mm). The architectural
background is screened back in grey so the services read black over it, which is
the normal convention for a services layout.

Run:  python build_pdf.py
"""
import json
import os
from datetime import date

from reportlab.pdfgen import canvas
from reportlab.lib.units import mm

try:
    from reportlab.pdfgen.canvas import FILL_EVEN_ODD
except ImportError:                                     # very old reportlab
    FILL_EVEN_ODD = 0

HERE = os.path.dirname(os.path.abspath(__file__))
G = json.load(open(os.path.join(HERE, "data", "gf-geometry.json")))
C = json.load(open(os.path.join(HERE, "data", "lighting-calc.json")))
P = json.load(open(os.path.join(HERE, "data", "gf-ceiling-points.json")))
ROOMS = {r["id"]: r for r in G["rooms"]}

INCH = 25.4
SOFFIT = G["levels"]["clear_soffit_above_gf_ffl_mm"]
TODAY = date.today().strftime("%d.%m.%Y")

PROJECT = "PROPOSED RESIDENTIAL BUILDING FOR MR CHANDRASEKHAR"
LOCATION = "ANANTAPUR, ANDHRA PRADESH"
ARCH_REF = "ECS __/AR/R2"
STRU_REF = "STRUCTURAL WD-1"

# ------------------------------------------------------------------ sheet setup
PW, PH = 594, 420                       # A2 landscape
ML, MO = 20, 10                         # binding margin, other margins
TBW, TBH = 178, 56                      # title block
REVH = 26

# line weights, mm -> points
LW = {k: v * mm for k, v in
      {"thin": 0.18, "dim": 0.25, "gen": 0.35, "med": 0.50, "hvy": 0.70}.items()}
# lettering, ISO 3098 nominal height mm -> points
TX = {k: v * mm for k, v in
      {"xs": 1.8, "s": 2.5, "m": 3.5, "l": 5.0, "xl": 7.0}.items()}

GREY_FILL = 0.80        # screened architecture
GREY_LINE = 0.52
GREY_TEXT = 0.45


def fi(v_mm, half=True):
    """millimetres -> feet and inches, Indian site notation"""
    n = v_mm / INCH
    n = round(n * 2) / 2 if half else round(n)
    ft = int(n // 12)
    inch = n - 12 * ft
    frac = "½" if abs(inch - int(inch)) > 0.01 else ""
    return "%d'-%d%s\"" % (ft, int(inch), frac)


PROJ_TXT = "2½ in to 3 in"
DOWNROD_TXT = '24" DOWNROD'

# ============================================================== drawing frame
def frame(c, sheet, total, title, drg, scale):
    c.setLineJoin(0)
    # trim + border
    c.setStrokeGray(0)
    c.setLineWidth(LW["med"])
    c.rect(ML * mm, MO * mm, (PW - ML - MO) * mm, (PH - 2 * MO) * mm)
    c.setLineWidth(LW["thin"])
    c.rect((ML - 4) * mm, (MO - 4) * mm, (PW - ML - MO + 8) * mm, (PH - 2 * MO + 8) * mm)

    # grid references round the border
    c.setFont("Helvetica", TX["s"])
    cols, rows = 8, 6
    cw = (PW - ML - MO) / cols
    rh = (PH - 2 * MO) / rows
    for i in range(cols):
        x = ML + cw * (i + 0.5)
        for y in (MO - 2.6, PH - MO + 1.2):
            c.drawCentredString(x * mm, y * mm, chr(65 + i))
        if i:
            for y0, y1 in ((MO - 4, MO), (PH - MO, PH - MO + 4)):
                c.setLineWidth(LW["thin"])
                c.line((ML + cw * i) * mm, y0 * mm, (ML + cw * i) * mm, y1 * mm)
    for j in range(rows):
        y = PH - MO - rh * (j + 0.5) - 0.9
        for x in (ML - 2.6, PW - MO + 1.4):
            c.drawCentredString(x * mm, y * mm, str(j + 1))
        if j:
            for x0, x1 in ((ML - 4, ML), (PW - MO, PW - MO + 4)):
                c.line(x0 * mm, (PH - MO - rh * j) * mm, x1 * mm, (PH - MO - rh * j) * mm)

    tb_x, tb_y = PW - MO - TBW, MO
    _title_block(c, tb_x, tb_y, sheet, total, title, drg, scale)
    _rev_block(c, tb_x, tb_y + TBH)
    return tb_x, tb_y + TBH + REVH


def _cell(c, x, y, w, h, label, value, lab_sz="xs", val_sz="s", bold=True, lw="thin"):
    c.setLineWidth(LW[lw])
    c.setStrokeGray(0)
    c.rect(x * mm, y * mm, w * mm, h * mm)
    c.setFillGray(0.35)
    c.setFont("Helvetica", TX[lab_sz])
    c.drawString((x + 1.4) * mm, (y + h - 2.6) * mm, label)
    c.setFillGray(0)
    c.setFont("Helvetica-Bold" if bold else "Helvetica", TX[val_sz])
    c.drawString((x + 1.4) * mm, (y + 1.6) * mm, value)


def _title_block(c, x, y, sheet, total, title, drg, scale):
    c.setLineWidth(LW["med"])
    c.setStrokeGray(0)
    c.rect(x * mm, y * mm, TBW * mm, TBH * mm)

    # consultant strip
    c.setFillGray(0)
    c.setFont("Helvetica-Bold", TX["m"])
    c.drawString((x + 2) * mm, (y + TBH - 6.4) * mm, "SERVICES  —  ELECTRICAL")
    c.setFont("Helvetica", TX["xs"])
    c.setFillGray(0.35)
    c.drawRightString((x + TBW - 2) * mm, (y + TBH - 6.2) * mm,
                      "TO BE READ WITH " + ARCH_REF + " AND " + STRU_REF)
    c.setLineWidth(LW["thin"])
    c.setStrokeGray(0)
    c.line(x * mm, (y + TBH - 9) * mm, (x + TBW) * mm, (y + TBH - 9) * mm)

    yy = y + TBH - 9
    _cell(c, x, yy - 12, TBW, 12, "PROJECT", PROJECT, val_sz="s")
    c.setFont("Helvetica", TX["xs"])
    c.setFillGray(0.35)
    c.drawString((x + 1.4) * mm, (yy - 12 + 5.4) * mm, LOCATION)

    c.setLineWidth(LW["thin"]); c.setStrokeGray(0)
    c.rect(x * mm, (yy - 25) * mm, TBW * mm, 13 * mm)
    c.setFillGray(0.35); c.setFont("Helvetica", TX["xs"])
    c.drawString((x + 1.4) * mm, (yy - 25 + 10.4) * mm, "DRAWING TITLE")
    c.setFillGray(0); c.setFont("Helvetica-Bold", TX["m"])
    tl = title.splitlines()
    if len(tl) == 1:
        c.drawString((x + 1.4) * mm, (yy - 25 + 2.6) * mm, tl[0])
    else:
        c.setFont("Helvetica", TX["s"])
        c.drawString((x + 1.4) * mm, (yy - 25 + 5.6) * mm, tl[0])
        c.setFont("Helvetica-Bold", TX["m"])
        c.drawString((x + 1.4) * mm, (yy - 25 + 1.4) * mm, tl[1])

    r = yy - 25
    _cell(c, x, r - 9, 62, 9, "DRAWING NO", drg, val_sz="s")
    _cell(c, x + 62, r - 9, 34, 9, "SCALE", scale, val_sz="s")
    _cell(c, x + 96, r - 9, 34, 9, "DATE", TODAY, val_sz="s")
    _cell(c, x + 130, r - 9, 24, 9, "REV", "A", val_sz="s")
    _cell(c, x + 154, r - 9, 24, 9, "SHEET", "%02d of %02d" % (sheet, total), val_sz="s")

    _cell(c, x, r - 18, 44, 9, "DRAWN", "", val_sz="s")
    _cell(c, x + 44, r - 18, 44, 9, "CHECKED", "", val_sz="s")
    _cell(c, x + 88, r - 18, 45, 9, "APPROVED", "", val_sz="s")
    _cell(c, x + 133, r - 18, 45, 9, "STATUS", "FOR CONSTRUCTION", val_sz="xs")


def _rev_block(c, x, y):
    c.setLineWidth(LW["thin"])
    c.setStrokeGray(0)
    c.rect(x * mm, y * mm, TBW * mm, REVH * mm)
    cols = [(0, 14, "REV"), (14, 26, "DATE"), (40, 108, "DESCRIPTION"), (148, 30, "BY")]
    c.setFont("Helvetica", TX["xs"])
    for cx, cw, lab in cols:
        c.line((x + cx) * mm, y * mm, (x + cx) * mm, (y + REVH) * mm)
        c.setFillGray(0.35)
        c.drawString((x + cx + 1.4) * mm, (y + REVH - 3.4) * mm, lab)
    c.line(x * mm, (y + REVH - 4.6) * mm, (x + TBW) * mm, (y + REVH - 4.6) * mm)
    c.setFillGray(0)
    c.setFont("Helvetica", TX["s"])
    for i, (rev, dt, desc) in enumerate([("A", TODAY, "First issue")]):
        ry = y + REVH - 4.6 - 5.2 * (i + 1) + 1.4
        c.drawString((x + 3) * mm, ry * mm, rev)
        c.drawString((x + 15.4) * mm, ry * mm, dt)
        c.drawString((x + 41.4) * mm, ry * mm, desc)


# ================================================================ sheet 01 plan
SC = 50.0                       # 1 : 50
PLAN_X0, PLAN_Y0 = 52.0, 222.0  # paper mm, bottom-left of the plan extent
PLAN_H = 8870 / SC


def px(X):
    return (PLAN_X0 + X / SC) * mm


def py(Y):
    return (PLAN_Y0 + PLAN_H - Y / SC) * mm


def plan_sheet(c):
    left, _ = frame(c, 1, 3, "GROUND FLOOR PLAN\nLIGHTING & CEILING FAN LAYOUT",
                    "GF/EL/01", "1:50 @ A2")

    # ---------------------------------------------------- architecture, screened
    p = c.beginPath()
    p.moveTo(px(0), py(0)); p.lineTo(px(16606), py(0))
    p.lineTo(px(16606), py(8870)); p.lineTo(px(0), py(8870)); p.close()
    voids = [(r["x0"], r["y0"], r["x1"], r["y1"]) for r in G["rooms"]] + [
        (9372, 4846, 9521, 6539), (12424, 5156, 12654, 6835),
        (14045, 5156, 14275, 6835), (12654, 6835, 14045, 7060)]
    for x0, y0, x1, y1 in voids:
        p.moveTo(px(x0), py(y0)); p.lineTo(px(x1), py(y0))
        p.lineTo(px(x1), py(y1)); p.lineTo(px(x0), py(y1)); p.close()
    c.setFillGray(GREY_FILL)
    c.setStrokeGray(GREY_LINE)
    c.setLineWidth(LW["dim"])
    c.drawPath(p, stroke=1, fill=1, fillMode=FILL_EVEN_ODD)

    # openings
    c.setStrokeGray(GREY_LINE)
    for key, lst in G["openings"].items():
        if key.startswith("_"):
            continue
        for o in lst:
            c.setLineWidth(LW["dim"])
            if "x0" in o:
                yy0, yy1 = (0, 231) if "north" in key else (8639, 8870)
                c.setFillGray(1)
                c.rect(px(o["x0"]), py(yy1), (o["x1"] - o["x0"]) / SC * mm,
                       231 / SC * mm, stroke=1, fill=1)
                if o["kind"] == "window":
                    c.line(px(o["x0"]), py((yy0 + yy1) / 2), px(o["x1"]), py((yy0 + yy1) / 2))
            else:
                xx0 = 0 if "west" in key else 12424
                c.setFillGray(1)
                c.rect(px(xx0), py(o["y1"]), 231 / SC * mm,
                       (o["y1"] - o["y0"]) / SC * mm, stroke=1, fill=1)
                if o["kind"] == "window":
                    c.line(px(xx0 + 115), py(o["y0"]), px(xx0 + 115), py(o["y1"]))

    # room names, masked so they read over any linework
    ANCHOR = {"BED02": (2900, 3210), "MBED": (2900, 8430), "HALL": (6820, 2900),
              "DINING": (6760, 6210), "OFFICE": (9700, 4600), "KITCH": (9700, 8450),
              "UTIL": (7000, 8480), "HWASH": (2300, 4950), "CBATH": (350, 3800),
              "MBATH": (5050, 7060), "LOBBY": (12760, 6700), "LIFT": (12760, 7900),
              "STAIR": (14400, 6000), "PORTICO": (12800, 4760)}
    SHORT = {"HWASH": "HANDWASH", "MBATH": "MASTER BATH", "LOBBY": "LIFT LOBBY",
             "PORTICO": "PORTICO", "KITCH": "KITCHEN"}
    for r in G["rooms"]:
        ax, ay = ANCHOR.get(r["id"], ((r["x0"] + r["x1"]) / 2, (r["y0"] + r["y1"]) / 2))
        txt = SHORT.get(r["id"], r["name"]).upper()
        size = TX["s"] if r["area_m2"] < 8 else TX["m"]
        c.setFont("Helvetica-Bold", size)
        w = c.stringWidth(txt, "Helvetica-Bold", size)
        c.setFillGray(1)
        c.rect(px(ax) - 0.8 * mm, py(ay) - 1.0 * mm, w + 1.6 * mm, size + 1.4 * mm,
               stroke=0, fill=1)
        c.setFillGray(GREY_TEXT)
        c.drawString(px(ax), py(ay), txt)

    _section_mark(c)
    _setting_out(c)
    _fixtures(c)
    _plan_dims(c)
    _north(c, 386, 388)
    _scalebar(c, PLAN_X0, 194)

    c.setFillGray(0)
    c.setFont("Helvetica-Bold", TX["m"])
    c.drawString(PLAN_X0 * mm, 404 * mm, "GROUND FLOOR PLAN")
    c.setFont("Helvetica", TX["xs"])
    c.setFillGray(0.35)
    c.drawString((PLAN_X0 + 42) * mm, 404 * mm,
                 "LIGHTING AND CEILING FAN LAYOUT   •   SCALE 1:50   •   "
                 "ALL DIMENSIONS IN FEET AND INCHES   •   DO NOT SCALE")

    _details(c)
    _legend(c, left, 236)
    _notes(c, left, 410)


def _section_mark(c):
    """cutting line A-A through Bedroom 02, drawn at the two ends only"""
    X = 2517
    c.setStrokeGray(0)
    c.setFillGray(0)
    for Yin, Yout in ((-260, -1000), (3700, 4440)):
        c.setLineWidth(LW["med"])
        c.setDash([5, 2, 1.4, 2], 0)
        c.line(px(X), py(Yin), px(X), py(Yout))
        c.setDash()
        # tail and arrow head, pointing west, the direction of view
        c.line(px(X), py(Yin), px(X - 620), py(Yin))
        pth = c.beginPath()
        pth.moveTo(px(X - 620), py(Yin))
        pth.lineTo(px(X - 300), py(Yin - 150))
        pth.lineTo(px(X - 300), py(Yin + 150))
        pth.close()
        c.drawPath(pth, stroke=0, fill=1)
        c.setFont("Helvetica-Bold", TX["s"])
        c.drawCentredString(px(X), py(Yout + (330 if Yout < 0 else -90)), "A")


def _fixtures(c):
    """luminaires and fans, drawn black over the screened background"""
    c.setStrokeGray(0)
    for L in P["lights"]:
        s = 300 / SC * mm                       # 300 mm fitting at 1:50
        x, y = px(L["x"]), py(L["y"])
        c.setFillGray(1)
        c.setLineWidth(LW["gen"])
        c.rect(x - s / 2, y - s / 2, s, s, stroke=1, fill=1)
        c.setLineWidth(LW["dim"])
        c.line(x - s / 2, y - s / 2, x + s / 2, y + s / 2)
        c.line(x - s / 2, y + s / 2, x + s / 2, y - s / 2)
        c.setFillGray(0)
        c.setFont("Helvetica-Bold", TX["xs"])
        c.drawCentredString(x, y + s / 2 + 1.0 * mm, L["id"])

    for F in P["fans"]:
        x, y, r = px(F["x"]), py(F["y"]), F["sweep"] / 2 / SC * mm
        c.setLineWidth(LW["thin"])
        c.setDash(2, 2)
        c.circle(x, y, r, stroke=1, fill=0)
        c.setDash()
        c.setLineWidth(LW["gen"])
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            c.line(x + dx * 1.6 * mm, y + dy * 1.6 * mm, x + dx * r, y + dy * r)
        c.setFillGray(1)
        c.circle(x, y, 1.7 * mm, stroke=1, fill=1)
        c.setFillGray(0)
        c.setFont("Helvetica-Bold", TX["xs"])
        c.drawCentredString(x, y - 0.7 * mm, F["id"])


def _setting_out(c):
    """fixture setting-out chains, run off the north and west inside faces"""
    by_room = {}
    for L in P["lights"]:
        by_room.setdefault(L["setout"], {"x": set(), "y": set()})
        by_room[L["setout"]]["x"].add(L["ox"])
        by_room[L["setout"]]["y"].add(L["oy"])
    for F in P["fans"]:
        by_room.setdefault(F["room"], {"x": set(), "y": set()})
        by_room[F["room"]]["x"].add(F["ox"])
        by_room[F["room"]]["y"].add(F["oy"])

    c.setStrokeGray(0)
    c.setFillGray(0)
    for rid, ax in by_room.items():
        r = ROOMS[rid]
        if r["w"] < 2200 and r["d"] < 2200:      # too small to letter, use the schedule
            continue
        # horizontal chain, just inside the north wall
        xs = sorted(ax["x"])
        if len(xs) >= 2:
            yline = r["y0"] + 330
            c.setLineWidth(LW["dim"])
            c.line(px(r["x0"]), py(yline), px(r["x0"] + max(xs) * INCH + 400), py(yline))
            prev = 0.0
            for v in xs + [None]:
                if v is None:
                    break
                X = r["x0"] + v * INCH
                c.setLineWidth(LW["thin"])
                c.line(px(X), py(yline - 130), px(X), py(yline + 130))
                c.setFont("Helvetica", TX["xs"])
                c.drawCentredString((px(r["x0"] + prev * INCH) + px(X)) / 2,
                                    py(yline) + 0.6 * mm, fi((v - prev) * INCH))
                prev = v
        # vertical chain, just inside the west wall
        ys = sorted(ax["y"])
        if len(ys) >= 2:
            xline = r["x0"] + 330
            c.setLineWidth(LW["dim"])
            c.line(px(xline), py(r["y0"]), px(xline), py(r["y0"] + max(ys) * INCH + 400))
            prev = 0.0
            for v in ys:
                Y = r["y0"] + v * INCH
                c.setLineWidth(LW["thin"])
                c.line(px(xline - 130), py(Y), px(xline + 130), py(Y))
                c.saveState()
                ymid = (py(r["y0"] + prev * INCH) + py(Y)) / 2
                c.translate(px(xline) - 0.7 * mm, ymid)
                c.rotate(90)
                c.setFont("Helvetica", TX["xs"])
                c.drawCentredString(0, 0, fi((v - prev) * INCH))
                c.restoreState()
                prev = v


def _plan_dims(c):
    """overall dimension strings below and left of the plan"""
    c.setStrokeGray(0)
    c.setFillGray(0)
    c.setLineWidth(LW["dim"])
    yb = PLAN_Y0 - 12
    c.line(px(0), yb * mm, px(16606), yb * mm)
    for X in (0, 16606):
        c.line(px(X), (yb - 1.6) * mm, px(X), (yb + 1.6) * mm)
        c.setLineWidth(LW["thin"])
        c.line(px(X), (yb + 1.6) * mm, px(X), py(8870))
        c.setLineWidth(LW["dim"])
    c.setFont("Helvetica-Bold", TX["s"])
    c.drawCentredString((px(0) + px(16606)) / 2, (yb + 1.4) * mm, fi(16606) + " OVERALL")

    xl = PLAN_X0 - 13
    c.line(xl * mm, py(0), xl * mm, py(8870))
    for Y in (0, 8870):
        c.line((xl - 1.6) * mm, py(Y), (xl + 1.6) * mm, py(Y))
        c.setLineWidth(LW["thin"])
        c.line((xl + 1.6) * mm, py(Y), px(0), py(Y))
        c.setLineWidth(LW["dim"])
    c.saveState()
    c.translate((xl - 1.2) * mm, (py(0) + py(8870)) / 2)
    c.rotate(90)
    c.setFont("Helvetica-Bold", TX["s"])
    c.drawCentredString(0, 0, fi(8870) + " OVERALL")
    c.restoreState()


def _north(c, x, y):
    c.setStrokeGray(0)
    c.setFillGray(0)
    c.setLineWidth(LW["gen"])
    c.circle(x * mm, y * mm, 8 * mm, stroke=1, fill=0)
    p = c.beginPath()
    p.moveTo(x * mm, (y + 7) * mm)
    p.lineTo((x + 2.6) * mm, (y - 5.4) * mm)
    p.lineTo(x * mm, (y - 2.6) * mm)
    p.lineTo((x - 2.6) * mm, (y - 5.4) * mm)
    p.close()
    c.drawPath(p, stroke=1, fill=1)
    c.setFont("Helvetica-Bold", TX["s"])
    c.drawCentredString(x * mm, (y + 9.6) * mm, "N")


def _scalebar(c, x, y):
    """0 - 15 ft bar, 1 ft divisions in the first 5 ft"""
    ft = 304.8 / SC                      # paper mm per foot
    c.setStrokeGray(0)
    c.setLineWidth(LW["thin"])
    for i in range(5):
        c.setFillGray(0 if i % 2 == 0 else 1)
        c.rect((x + i * ft) * mm, y * mm, ft * mm, 1.8 * mm, stroke=1, fill=1)
    for i in range(2):
        c.setFillGray(1 if i % 2 == 0 else 0)
        c.rect((x + (5 + i * 5) * ft) * mm, y * mm, 5 * ft * mm, 1.8 * mm, stroke=1, fill=1)
    c.setFillGray(0)
    c.setFont("Helvetica", TX["xs"])
    for v in (0, 5, 10, 15):
        c.drawCentredString((x + v * ft) * mm, (y - 3.4) * mm, str(v))
    c.drawString((x + 15 * ft + 2) * mm, (y - 3.4) * mm, "FEET")
    c.setFont("Helvetica-Bold", TX["xs"])
    c.drawString(x * mm, (y + 3) * mm, "SCALE  1:50")


# ------------------------------------------------------- construction details
def _hatch(c, x, y, w, h, step=1.5, gray=0.55):
    """45 degree concrete section hatch"""
    c.saveState()
    pth = c.beginPath()
    pth.rect(x * mm, y * mm, w * mm, h * mm)
    c.clipPath(pth, stroke=0, fill=0)
    c.setStrokeGray(gray)
    c.setLineWidth(LW["thin"])
    i = -int(h / step) - 1
    while i * step < w + h:
        c.line((x + i * step) * mm, y * mm, (x + i * step + h) * mm, (y + h) * mm)
        i += 1
    c.restoreState()


def _dbox(c, x, y, w, h, num, title, scale):
    c.setStrokeGray(0)
    c.setLineWidth(LW["thin"])
    c.rect(x * mm, y * mm, w * mm, h * mm)
    c.setFillGray(0.92)
    c.rect(x * mm, (y + h - 6.4) * mm, w * mm, 6.4 * mm, stroke=1, fill=1)
    c.setFillGray(0)
    c.setFont("Helvetica-Bold", TX["s"])
    c.drawString((x + 2) * mm, (y + h - 4.4) * mm, num + "   " + title)
    c.setFont("Helvetica", TX["xs"])
    c.setFillGray(0.3)
    c.drawRightString((x + w - 2) * mm, (y + h - 4.2) * mm, scale)
    c.setFillGray(0)


def _dim_v(c, x, y0, y1, txt, side=-1):
    c.setStrokeGray(0)
    c.setLineWidth(LW["dim"])
    c.line(x * mm, y0 * mm, x * mm, y1 * mm)
    for yy in (y0, y1):
        c.line((x - 1.1) * mm, yy * mm, (x + 1.1) * mm, yy * mm)
    c.saveState()
    c.translate((x + side * 1.2) * mm, (y0 + y1) / 2 * mm)
    c.rotate(90)
    c.setFont("Helvetica", TX["xs"])
    c.setFillGray(0)
    c.drawCentredString(0, 0, txt)
    c.restoreState()


def _note_lines(c, x, y, lines, w):
    c.setFont("Helvetica", TX["xs"])
    c.setFillGray(0.25)
    for ln in lines:
        for seg in _wrap(c, ln, w, "Helvetica", TX["xs"]):
            c.drawString(x * mm, y * mm, seg)
            y -= 2.7
        y -= 0.6
    c.setFillGray(0)
    return y


def _details(c):
    _detail_fan_hook(c, 24, 18, 116, 152)
    _detail_conduit(c, 146, 18, 116, 152)
    _detail_section(c, 268, 18, 130, 152)


def _slab_section(c, sx, sw, sb, st):
    _hatch(c, sx, sb, sw, st - sb)
    c.setStrokeGray(0)
    c.setLineWidth(LW["med"])
    c.line(sx * mm, sb * mm, (sx + sw) * mm, sb * mm)
    c.line(sx * mm, st * mm, (sx + sw) * mm, st * mm)
    c.setLineWidth(LW["gen"])
    c.setFillGray(1)
    for i in range(6):
        c.circle((sx + 8 + i * 16) * mm, (sb + 5) * mm, 1 * mm, stroke=1, fill=1)
        c.circle((sx + 8 + i * 16) * mm, (st - 5) * mm, 1 * mm, stroke=1, fill=1)
    c.setFillGray(0)


def _detail_fan_hook(c, x, y, w, h):
    _dbox(c, x, y, w, h, "1", "FAN HOOK CAST INTO SLAB", "1:5")
    sx, sw = x + 10, 94
    sb, st = y + 112, y + 140
    _slab_section(c, sx, sw, sb, st)

    cxm = sx + sw / 2
    c.setStrokeGray(0)
    c.setLineWidth(LW["med"])
    c.ellipse((cxm - 4) * mm, (sb - 13) * mm, (cxm + 4) * mm, (sb + 9) * mm,
              stroke=1, fill=0)
    c.setLineWidth(LW["gen"])
    c.setFillGray(1)
    for bx in (-2.5, 2.5):
        c.circle((cxm + bx) * mm, (sb + 5) * mm, 1 * mm, stroke=1, fill=1)
    c.setFillGray(0)

    _dim_v(c, sx - 4.5, sb, st, fi(140) + " SLAB")
    _dim_v(c, cxm + 9, sb - 13, sb, PROJ_TXT, side=1)

    c.setLineWidth(LW["gen"])
    c.setDash([1.4, 1.4], 0)
    c.line(cxm * mm, (sb - 13) * mm, cxm * mm, (y + 76) * mm)
    c.setDash()
    c.setLineWidth(LW["thin"])
    c.line((cxm - 3) * mm, (y + 84) * mm, (cxm + 3) * mm, (y + 87) * mm)
    c.line((cxm - 3) * mm, (y + 81) * mm, (cxm + 3) * mm, (y + 84) * mm)
    c.setLineWidth(LW["med"])
    c.line((cxm - 26) * mm, (y + 76) * mm, (cxm + 26) * mm, (y + 76) * mm)
    c.setFont("Helvetica", TX["xs"])
    c.setFillGray(0)
    c.drawString((cxm + 4) * mm, (y + 88) * mm, DOWNROD_TXT)
    c.drawCentredString(cxm * mm, (y + 71) * mm,
                        "BLADE LEVEL  " + P["fans"][0]["blade_ft"] + "  ABOVE FFL")

    _note_lines(c, x + 5, y + 62, [
        "a   10 mm dia MS bar bent as a closed loop, hooked over two bottom mesh "
        "bars in each direction.",
        "b   Tie at all four crossings with 18 SWG binding wire. A hook tied to a "
        "single bar is not acceptable.",
        "c   Loop to carry 100 kg static minimum.",
        "d   Set out and fix before the top mesh is laid.",
    ], w - 10)


def _detail_conduit(c, x, y, w, h):
    _dbox(c, x, y, w, h, "2", "CONDUIT AND JUNCTION BOX IN SLAB", "1:5")
    sx, sw = x + 10, 94
    sb, st = y + 112, y + 140
    _slab_section(c, sx, sw, sb, st)

    bx0, bw = sx + 56, 15
    c.setStrokeGray(0)
    c.setLineWidth(LW["med"])
    c.setFillGray(1)
    c.rect(bx0 * mm, sb * mm, bw * mm, 10 * mm, stroke=1, fill=1)

    c.setLineWidth(LW["gen"])
    c.setFillGray(1)
    for i in range(4):
        c.circle((sx + 12 + i * 11) * mm, (sb + 9) * mm, 2.5 * mm, stroke=1, fill=1)
    c.setFillGray(0)
    c.line((sx + 12) * mm, (sb + 11.5) * mm, bx0 * mm, (sb + 11.5) * mm)
    c.line((sx + 12) * mm, (sb + 6.5) * mm, bx0 * mm, (sb + 6.5) * mm)

    _dim_v(c, sx - 4.5, sb, st, fi(140) + " SLAB")
    c.setFont("Helvetica", TX["xs"])
    c.setFillGray(0)
    c.setLineWidth(LW["thin"])
    c.line((bx0 + bw / 2) * mm, (sb - 1) * mm, (bx0 + bw / 2) * mm, (sb - 6) * mm)
    c.line((bx0 + bw / 2) * mm, (sb - 6) * mm, (bx0 + bw / 2 + 8) * mm, (sb - 6) * mm)
    c.drawString((bx0 + bw / 2 + 9) * mm, (sb - 6.9) * mm, "75 mm dia PVC BOX, FLUSH")
    c.line((sx + 26) * mm, (sb + 11.5) * mm, (sx + 26) * mm, (st + 4) * mm)
    c.drawString((sx + 27) * mm, (st + 3.2) * mm, "20 / 25 mm dia RIGID PVC CONDUIT")
    c.drawString((sx - 1) * mm, (sb - 6.9) * mm, "25 mm COVER")

    _note_lines(c, x + 5, y + 100, [
        "a   Conduit laid between the top and bottom mesh, never above the top "
        "mesh, with 25 mm minimum cover to the soffit.",
        "b   ISI marked medium gauge rigid PVC to IS 9537 (Part 3). 20 mm dia for "
        "up to three 1.5 sq mm cores, 25 mm dia above that.",
        "c   GI draw wire to be left in every run before the pour.",
        "d   Maximum two 90 degree bends between draw points. Provide an "
        "additional box rather than a third bend.",
        "e   No conduit is to pass through any RCC beam.",
    ], w - 10)


def _detail_section(c, x, y, w, h):
    _dbox(c, x, y, w, h, "3", "SECTION A-A  •  BEDROOM 02 SOFFIT LEVELS", "1:35")
    S = 35.0
    x0 = x + 22
    fl = y + 36

    def sx_(v):
        return x0 + v / S

    def sy_(v):
        return fl + v / S

    bands = [(0, 2145, SOFFIT), (2145, 2373, SOFFIT - 241), (2373, 3185, SOFFIT - 300)]

    # floor slab
    _hatch(c, sx_(-230), fl - 150 / S, (3185 + 460) / S, 150 / S)
    c.setStrokeGray(0)
    c.setLineWidth(LW["med"])
    c.line(sx_(-230) * mm, fl * mm, sx_(3415) * mm, fl * mm)
    c.line(sx_(-230) * mm, (fl - 150 / S) * mm, sx_(3415) * mm, (fl - 150 / S) * mm)

    # end walls
    for a in (-230, 3185):
        _hatch(c, sx_(a), fl, 230 / S, (SOFFIT + 140) / S)
        c.setLineWidth(LW["gen"])
        c.rect(sx_(a) * mm, fl * mm, (230 / S) * mm, ((SOFFIT + 140) / S) * mm,
               stroke=1, fill=0)

    # roof slab, stepped
    for a, b, z in bands:
        _hatch(c, sx_(a), sy_(z), (b - a) / S, 140 / S)
        c.setStrokeGray(0)
        c.setLineWidth(LW["med"])
        c.line(sx_(a) * mm, sy_(z) * mm, sx_(b) * mm, sy_(z) * mm)
        c.setLineWidth(LW["gen"])
        c.line(sx_(a) * mm, sy_(z) * mm, sx_(a) * mm, sy_(z + 140) * mm)
        c.line(sx_(b) * mm, sy_(z) * mm, sx_(b) * mm, sy_(z + 140) * mm)
    c.setLineWidth(LW["med"])
    c.line(sx_(0) * mm, sy_(SOFFIT + 140) * mm, sx_(3185) * mm, sy_(SOFFIT + 140) * mm)

    # luminaires
    for off, z, tag in ((711, SOFFIT, "L1"), (2718, SOFFIT - 300, "L3")):
        c.setLineWidth(LW["gen"])
        c.setFillGray(1)
        c.rect((sx_(off) - 4.3) * mm, (sy_(z) - 1.7) * mm, 8.6 * mm, 1.7 * mm,
               stroke=1, fill=1)
        c.setFillGray(0)
        c.setFont("Helvetica-Bold", TX["xs"])
        c.drawCentredString(sx_(off) * mm, (sy_(z) - 5.2) * mm, tag)

    # fan
    fx = sx_(1600)
    c.setLineWidth(LW["gen"])
    c.line(fx * mm, sy_(SOFFIT) * mm, fx * mm, sy_(2613) * mm)
    c.setLineWidth(LW["med"])
    c.line((fx - 17) * mm, sy_(2528) * mm, (fx + 17) * mm, sy_(2528) * mm)
    c.setFillGray(1)
    c.circle(fx * mm, sy_(2570) * mm, 1.5 * mm, stroke=1, fill=1)
    c.setFillGray(0)
    c.setFont("Helvetica-Bold", TX["xs"])
    c.drawCentredString(fx * mm, (sy_(2528) - 4.6) * mm, "F1")

    # ceiling step setting out, run inside the room void
    ch = sy_(SOFFIT) - 17
    c.setLineWidth(LW["dim"])
    c.line(sx_(0) * mm, ch * mm, sx_(3185) * mm, ch * mm)
    prev = 0
    c.setFont("Helvetica", TX["xs"])
    for v in (2145, 2373, 3185):
        c.setLineWidth(LW["thin"])
        c.line(sx_(v) * mm, (ch - 1.2) * mm, sx_(v) * mm, (ch + 1.2) * mm)
        c.drawCentredString((sx_(prev) + sx_(v)) / 2 * mm, (ch + 1.9) * mm, fi(v - prev))
        prev = v
    c.line(sx_(0) * mm, (ch - 1.2) * mm, sx_(0) * mm, (ch + 1.2) * mm)

    # levels
    _dim_v(c, sx_(-330), fl, sy_(SOFFIT), fi(SOFFIT))
    _dim_v(c, sx_(3480), fl, sy_(2528), fi(2528), side=1)

    c.setFillGray(0)
    c.setFont("Helvetica", TX["xs"])
    c.drawString(sx_(-330) * mm, (fl - 8.6) * mm, "GF FFL")

    # leaders to the two steps
    c.setLineWidth(LW["thin"])
    c.line(sx_(2259) * mm, sy_(SOFFIT - 241) * mm, sx_(2000) * mm, sy_(SOFFIT + 340) * mm)
    c.drawRightString(sx_(1980) * mm, (sy_(SOFFIT + 300)) * mm, 'B2 BEAM 9" x 15"')
    c.line(sx_(2790) * mm, sy_(SOFFIT - 300) * mm, sx_(2790) * mm, sy_(SOFFIT - 780) * mm)
    c.drawRightString(sx_(2760) * mm, (sy_(SOFFIT - 900)) * mm, "FF SUNKEN SLAB OVER")

    # section arrows
    for xa, d in ((sx_(-560), 1), (sx_(3745), -1)):
        c.setLineWidth(LW["med"])
        c.line(xa * mm, (fl + 6) * mm, xa * mm, (fl + 16) * mm)
        c.setFont("Helvetica-Bold", TX["s"])
        c.drawCentredString(xa * mm, (fl + 1) * mm, "A")

    _note_lines(c, x + 5, y + 24, [
        "The B2 beam carries the first floor staircase. Beyond it the first floor "
        "bathroom sunken slab lowers the soffit to " + fi(SOFFIT - 300) + ". Both rows "
        "of fittings clear the beam and each sits wholly on one soffit level.",
        "Sunken depth assumed 12 in, to be confirmed by the structural engineer.",
    ], w - 10)


def _legend(c, x, top):
    w, h = TBW, 62
    y = top - h
    c.setStrokeGray(0)
    c.setLineWidth(LW["thin"])
    c.rect(x * mm, y * mm, w * mm, h * mm)
    c.setFillGray(0)
    c.setFont("Helvetica-Bold", TX["s"])
    c.drawString((x + 2) * mm, (top - 4.6) * mm, "LEGEND")
    c.line(x * mm, (top - 6.4) * mm, (x + w) * mm, (top - 6.4) * mm)

    ly = top - 13
    # luminaire
    s = 6 * mm
    c.setFillGray(1)
    c.setLineWidth(LW["gen"])
    c.rect((x + 5) * mm - s / 2, ly * mm - s / 2, s, s, stroke=1, fill=1)
    c.setLineWidth(LW["dim"])
    c.line((x + 5) * mm - s / 2, ly * mm - s / 2, (x + 5) * mm + s / 2, ly * mm + s / 2)
    c.line((x + 5) * mm - s / 2, ly * mm + s / 2, (x + 5) * mm + s / 2, ly * mm - s / 2)
    c.setFillGray(0)
    c.setFont("Helvetica", TX["s"])
    c.drawString((x + 11) * mm, (ly - 1.0) * mm,
                 "LED SURFACE PANEL LUMINAIRE, CEILING MOUNTED")
    c.setFont("Helvetica", TX["xs"])
    c.setFillGray(0.35)
    c.drawString((x + 11) * mm, (ly - 4.4) * mm,
                 "Ref Lxx. Wattage and type to luminaire schedule, sheet 02")

    ly -= 13
    c.setFillGray(0)
    r = 6 * mm
    c.setLineWidth(LW["thin"])
    c.setDash(2, 2)
    c.circle((x + 5) * mm, ly * mm, r, stroke=1, fill=0)
    c.setDash()
    c.setLineWidth(LW["gen"])
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        c.line((x + 5) * mm + dx * 1.6 * mm, ly * mm + dy * 1.6 * mm,
               (x + 5) * mm + dx * r, ly * mm + dy * r)
    c.setFillGray(1)
    c.circle((x + 5) * mm, ly * mm, 1.7 * mm, stroke=1, fill=1)
    c.setFillGray(0)
    c.setFont("Helvetica", TX["s"])
    c.drawString((x + 11) * mm, (ly - 1.0) * mm, "BLDC CEILING FAN ON HOOK CAST IN SLAB")
    c.setFont("Helvetica", TX["xs"])
    c.setFillGray(0.35)
    c.drawString((x + 11) * mm, (ly - 4.4) * mm,
                 "Ref Fxx. Broken circle indicates blade sweep")

    ly -= 13
    c.setFillGray(GREY_FILL)
    c.setStrokeGray(GREY_LINE)
    c.setLineWidth(LW["dim"])
    c.rect((x + 2) * mm, (ly - 2.4) * mm, 6 * mm, 4.8 * mm, stroke=1, fill=1)
    c.setFillGray(0)
    c.setStrokeGray(0)
    c.setFont("Helvetica", TX["s"])
    c.drawString((x + 11) * mm, (ly - 1.0) * mm, "ARCHITECTURAL BACKGROUND, SCREENED")
    c.setFont("Helvetica", TX["xs"])
    c.setFillGray(0.35)
    c.drawString((x + 11) * mm, (ly - 4.4) * mm,
                 "Indicative only. Refer architect's drawing " + ARCH_REF)

    ly -= 12
    c.setFillGray(0)
    c.setLineWidth(LW["dim"])
    c.line((x + 2) * mm, ly * mm, (x + 8) * mm, ly * mm)
    c.setLineWidth(LW["thin"])
    for xx in (2, 8):
        c.line((x + xx) * mm, (ly - 1.3) * mm, (x + xx) * mm, (ly + 1.3) * mm)
    c.setFont("Helvetica", TX["s"])
    c.drawString((x + 11) * mm, (ly - 1.0) * mm, "SETTING-OUT DIMENSION TO FITTING CENTRE")
    c.setFont("Helvetica", TX["xs"])
    c.setFillGray(0.35)
    c.drawString((x + 11) * mm, (ly - 4.4) * mm,
                 "Measured from inside face of north and west walls of that room")


NOTES = [
    "All dimensions are in feet and inches. Do not scale off this drawing.",
    "This drawing is to be read with the architect's drawing " + ARCH_REF +
    " and the structural drawing " + STRU_REF + ".",
    "Fixture positions are dimensioned to the centre of the fitting, from the inside faces "
    "of the north and west walls of the room concerned.",
    "Clear slab soffit is " + fi(SOFFIT) + " above ground floor finished floor level. "
    "There is no false ceiling. All luminaires and fans are surface mounted on the RCC soffit.",
    "Where the first floor sunken slab lowers the soffit, the reduced level is given in the "
    "light point schedule on sheet 02. Confirm the sunken depth with the structural engineer "
    "before setting out.",
    "Illumination design is to IS 3646 (Part 1) and NBC 2016 Part 8. Calculations on sheet 03.",
    "Conduit: ISI marked medium gauge rigid PVC, laid between the top and bottom slab "
    "reinforcement, 20 mm dia for up to three 1.5 sq mm cores and 25 mm dia above that. "
    "Draw wire to be left in every run.",
    "No conduit is to pass through any RCC beam. Route around through the slab panel or drop "
    "down the wall and rise again.",
    "Fan hooks: 10 mm dia MS bar bent as a closed loop, hooked over two bottom mesh bars in "
    "each direction and tied at all four crossings, projecting 2½ in to 3 in below the "
    "soffit and capable of carrying 100 kg.",
    "Junction boxes: 75 mm dia PVC, flush with the finished soffit. Maximum two 90 degree "
    "bends between draw points. No box is to be buried.",
    "Contractor to confirm every fan hook and light point on site with the client before "
    "concreting, and to re-draw all fish wires within one week of the pour.",
    "Task lighting, being under counter, wardrobe, mirror and desk lighting, is not part of "
    "this scope. Switching, socket outlets, distribution boards and air conditioning are "
    "covered by separate drawings.",
]


def _notes(c, x, top):
    w = TBW
    c.setFillGray(0)
    c.setStrokeGray(0)
    c.setFont("Helvetica-Bold", TX["s"])
    c.drawString(x * mm, (top - 4) * mm, "GENERAL NOTES")
    c.setLineWidth(LW["thin"])
    c.line(x * mm, (top - 5.8) * mm, (x + w) * mm, (top - 5.8) * mm)
    y = top - 10.4
    c.setFont("Helvetica", TX["xs"])
    for i, n in enumerate(NOTES, 1):
        c.setFont("Helvetica-Bold", TX["xs"])
        c.drawString(x * mm, y * mm, "%02d" % i)
        c.setFont("Helvetica", TX["xs"])
        for line in _wrap(c, n, w - 7, "Helvetica", TX["xs"]):
            c.drawString((x + 6) * mm, y * mm, line)
            y -= 2.9
        y -= 1.5


def _wrap(c, text, width_mm, font, size):
    out, cur = [], ""
    for word in text.split():
        t = (cur + " " + word).strip()
        if c.stringWidth(t, font, size) <= width_mm * mm:
            cur = t
        else:
            out.append(cur)
            cur = word
    if cur:
        out.append(cur)
    return out


# =============================================================== table renderer
def table(c, x, y, cols, rows, rowh=5.2, head=6.0, fs="s", hs="xs", zebra=True):
    """cols = [(width_mm, heading, align)]  align in l/c/r"""
    total = sum(w for w, _, _ in cols)
    c.setStrokeGray(0)
    c.setFillGray(0.92)
    c.setLineWidth(LW["thin"])
    c.rect(x * mm, (y - head) * mm, total * mm, head * mm, stroke=0, fill=1)
    c.setFillGray(0)
    c.setFont("Helvetica-Bold", TX[hs])
    cx = x
    for w, h, a in cols:
        _cellstr(c, cx, y - head + 1.9, w, h, a)
        cx += w
    c.setLineWidth(LW["gen"])
    c.line(x * mm, (y - head) * mm, (x + total) * mm, (y - head) * mm)
    c.line(x * mm, y * mm, (x + total) * mm, y * mm)

    yy = y - head
    for i, row in enumerate(rows):
        if row is None:                       # section rule
            continue
        if zebra and i % 2:
            c.setFillGray(0.955)
            c.rect(x * mm, (yy - rowh) * mm, total * mm, rowh * mm, stroke=0, fill=1)
        c.setFillGray(0)
        cx = x
        for (w, _, a), val in zip(cols, row):
            bold = isinstance(val, tuple)
            v = val[0] if bold else val
            c.setFont("Helvetica-Bold" if bold else "Helvetica", TX[fs])
            _cellstr(c, cx, yy - rowh + 1.7, w, str(v), a)
            cx += w
        yy -= rowh
        c.setStrokeGray(0.75)
        c.setLineWidth(LW["thin"])
        c.line(x * mm, yy * mm, (x + total) * mm, yy * mm)
    c.setStrokeGray(0)
    c.setLineWidth(LW["gen"])
    c.line(x * mm, yy * mm, (x + total) * mm, yy * mm)
    c.setLineWidth(LW["thin"])
    cx = x
    for w, _, _ in cols:
        c.line(cx * mm, (y - head) * mm, cx * mm, yy * mm)
        cx += w
    c.line(cx * mm, (y - head) * mm, cx * mm, yy * mm)
    return yy


def _cellstr(c, x, y, w, s, a):
    if a == "l":
        c.drawString((x + 1.6) * mm, y * mm, s)
    elif a == "r":
        c.drawRightString((x + w - 1.6) * mm, y * mm, s)
    else:
        c.drawCentredString((x + w / 2) * mm, y * mm, s)


def head(c, x, y, text, sub=None, w=None):
    c.setFillGray(0)
    c.setFont("Helvetica-Bold", TX["m"])
    c.drawString(x * mm, y * mm, text)
    if sub:
        c.setFont("Helvetica", TX["xs"])
        c.setFillGray(0.35)
        c.drawString(x * mm, (y - 4.2) * mm, sub)
    c.setFillGray(0)
    return y - (8.4 if sub else 4.6)


# ================================================== luminaire type schedule
def luminaire_types():
    seen, types = {}, []
    for L in P["lights"]:
        k = (L["w"], L["cct"], L["ip"])
        if k not in seen:
            seen[k] = chr(65 + len(types))
            types.append({"type": seen[k], "w": L["w"], "lm": L["lm"],
                          "cct": L["cct"], "ip": L["ip"], "qty": 0, "rooms": set()})
        t = next(t for t in types if t["type"] == seen[k])
        t["qty"] += 1
        t["rooms"].add(ROOMS[L["room"]]["name"])
        L["type"] = seen[k]
    return types


# ==================================================== sheet 02 schedules
def schedule_sheet(c, types):
    frame(c, 2, 3, "GROUND FLOOR\nLUMINAIRE AND FAN SCHEDULES", "GF/EL/02", "NTS @ A2")
    x0, xr = ML + 6, 300
    y = 400

    y = head(c, x0, y, "1.  LUMINAIRE TYPE SCHEDULE",
             "All luminaires surface mounted on the RCC soffit, driver integral. "
             "Minimum CRI 80, and 90 in the kitchen and bathrooms.")
    cols = [(14, "TYPE", "c"), (60, "DESCRIPTION", "l"), (18, "RATING", "r"),
            (20, "OUTPUT", "r"), (18, "CCT", "r"), (17, "IP", "c"),
            (13, "QTY", "r"), (70, "LOCATION", "l")]
    rows = [[(t["type"],), "LED surface panel luminaire", "%d W" % t["w"],
             "%d lm" % t["lm"], "%d K" % t["cct"],
             t["ip"] if t["ip"] != "\u2014" else "IP20",
             (str(t["qty"]),), ", ".join(sorted(t["rooms"]))[:56]] for t in types]
    y = table(c, x0, y, cols, rows) - 10

    y = head(c, x0, y, "2.  CEILING FAN SCHEDULE",
             "BLDC motor with integral RF remote receiver. Blade level held at " +
             P["fans"][0]["blade_ft"] + " above finished floor.")
    cols = [(16, "REF", "c"), (48, "ROOM", "l"), (20, "SWEEP", "r"),
            (30, "FROM W WALL", "r"), (30, "FROM N WALL", "r"),
            (26, "SOFFIT", "r"), (24, "DOWNROD", "r"), (28, "BLADE LEVEL", "r"),
            (28, "DATUM", "l")]
    rows = [[(F["id"],), ROOMS[F["room"]]["name"], '48"',
             (F["ox_ft"],), (F["oy_ft"],), F["z_ft"], F["rod_in"],
             F["blade_ft"], F["datum"]] for F in P["fans"]]
    y = table(c, x0, y, cols, rows) - 10

    y = head(c, x0, y, "3.  CONNECTED LOAD, THIS DRAWING")
    n_l, n_f = len(P["lights"]), len(P["fans"])
    w_l = sum(L["w"] for L in P["lights"])
    cols = [(96, "ITEM", "l"), (34, "QTY", "r"), (50, "LOAD", "r")]
    rows = [["Luminaires, general lighting", str(n_l), "%d W" % w_l],
            ["Ceiling fans, BLDC, 32 W each", str(n_f), "%d W" % (n_f * 32)],
            [("Total",), (str(n_l + n_f),), ("%d W" % (w_l + n_f * 32),)]]
    y = table(c, x0, y, cols, rows) - 10

    y = head(c, x0, y, "4.  SUMMARY BY ROOM")
    per, fans_per = {}, {}
    for L in P["lights"]:
        per.setdefault(L["room"], [0, 0])
        per[L["room"]][0] += 1
        per[L["room"]][1] += L["w"]
    for F in P["fans"]:
        fans_per[F["room"]] = fans_per.get(F["room"], 0) + 1
    cols = [(96, "ROOM", "l"), (30, "LIGHT POINTS", "r"), (24, "FANS", "r"),
            (30, "LOAD", "r")]
    rows = []
    for r in G["rooms"]:
        if r["id"] not in per and r["id"] not in fans_per:
            continue
        n, w = per.get(r["id"], [0, 0])
        rows.append([r["name"], str(n) if n else "\u2014",
                     str(fans_per.get(r["id"], 0)) if r["id"] in fans_per else "\u2014",
                     "%d W" % w])
    y = table(c, x0, y, cols, rows) - 10

    y = head(c, x0, y, "5.  NOTES TO THE SCHEDULES")
    for i, n in enumerate([
        "Setting out is to the centre of the fitting, measured from the inside faces "
        "of the north and west walls of the room named.",
        "Soffit level is above ground floor finished floor level except in the "
        "portico, where it is above the portico floor.",
        "Fittings marked at a reduced soffit level sit under the first floor sunken "
        "slab. Confirm the sunken depth before fixing.",
        "IP20 fittings are for dry interiors. IP44 is required in bathrooms, the "
        "handwash and the utility. IP54 in the portico.",
        "BLDC fans are controlled by their own remote. Do not fit a step type "
        "regulator on the wall plate.",
        "Task lighting is not scheduled here and is by others.",
    ], 1):
        c.setFillGray(0)
        c.setFont("Helvetica-Bold", TX["xs"])
        c.drawString(x0 * mm, y * mm, "%02d" % i)
        c.setFont("Helvetica", TX["xs"])
        for line in _wrap(c, n, 200, "Helvetica", TX["xs"]):
            c.drawString((x0 + 6) * mm, y * mm, line)
            y -= 2.9
        y -= 1.4

    # ---- right column: the point schedule ----
    ry = 400
    ry = head(c, xr, ry, "6.  LIGHT POINT SCHEDULE",
              "Refer drawing GF/EL/01 for locations.")
    cols = [(16, "REF", "c"), (48, "ROOM", "l"), (16, "TYPE", "c"), (22, "RATING", "r"),
            (30, "FROM W WALL", "r"), (30, "FROM N WALL", "r"), (26, "SOFFIT", "r"),
            (20, "CCT", "r"), (18, "IP", "c")]
    rows = [[(L["id"],), ROOMS[L["room"]]["name"], (L["type"],), "%d W" % L["w"],
             (L["ox_ft"],), (L["oy_ft"],), L["z_ft"], "%d K" % L["cct"],
             L["ip"] if L["ip"] != "\u2014" else "IP20"] for L in P["lights"]]
    table(c, xr, ry, cols, rows, rowh=4.9)


# ============================================ sheet 03 illumination calculations
def calc_sheet(c):
    left, _ = frame(c, 3, 3, "GROUND FLOOR\nILLUMINATION CALCULATIONS",
                    "GF/EL/03", "NTS @ A2")
    _calc_commentary(c, left)
    x0 = ML + 6
    y = 400

    y = head(c, x0, y, "1.  METHOD",
             "Lumen method to IS 3646 (Part 1) : 1992, Code of practice for interior "
             "illumination, and NBC 2016 Part 8 Section 1.")

    c.setStrokeGray(0)
    c.setFillGray(0.96)
    c.setLineWidth(LW["thin"])
    c.rect(x0 * mm, (y - 26) * mm, 232 * mm, 26 * mm, stroke=1, fill=1)
    c.setFillGray(0)
    c.setFont("Helvetica-Bold", TX["m"])
    c.drawString((x0 + 6) * mm, (y - 9) * mm,
                 "N  =  ( E × A )  ÷  ( Φ × UF × MF )")
    c.drawString((x0 + 128) * mm, (y - 9) * mm,
                 "K  =  L·W  ÷  Hm ( L + W )")
    c.setFont("Helvetica", TX["xs"])
    c.setFillGray(0.3)
    c.drawString((x0 + 6) * mm, (y - 15) * mm,
                 "N number of luminaires   E maintained illuminance, lux   "
                 "A area of the working plane")
    c.drawString((x0 + 6) * mm, (y - 19.4) * mm,
                 "Φ luminous flux per luminaire   UF utilisation factor   "
                 "MF maintenance factor")
    c.drawString((x0 + 128) * mm, (y - 15) * mm,
                 "K room index   L, W room dimensions")
    c.drawString((x0 + 128) * mm, (y - 19.4) * mm,
                 "Hm mounting height above the working plane")
    y -= 33

    y = head(c, x0, y, "2.  DESIGN ASSUMPTIONS")
    cols = [(80, "PARAMETER", "l"), (56, "VALUE", "l"), (96, "BASIS", "l")]
    rows = [
        ["Clear slab soffit", fi(SOFFIT) + " above GF FFL",
         "Floor to floor " + fi(3353) + " less " + fi(140) + " slab"],
        ["Ceiling construction", "Bare RCC, painted white",
         "No false ceiling. All fittings surface mounted"],
        ["Ceiling reflectance", "0.70", "White emulsion on plastered RCC"],
        ["Wall reflectance", "0.50", "Light coloured emulsion"],
        ["Floor reflectance", "0.20", "Vitrified tile, mid tone"],
        ["Working plane", fi(750) + " habitable, " + fi(850) + " kitchen and utility",
         "IS 3646 (Part 1)"],
        ["Maintenance factor", "0.75 general, 0.70 wet and cooking, 0.65 portico",
         "Three yearly cleaning cycle, dusty inland site"],
        ["Luminaire efficacy", "100 lm/W", "LED surface panel, integral driver"],
        ["Luminaire distribution", "Near cosine, opal diffuser", "UF from standard tables"],
    ]
    y = table(c, x0, y, cols, rows) - 9

    y = head(c, x0, y, "3.  ILLUMINATION CALCULATION",
             "Hall and Dining are calculated as one open volume: there is no dividing wall "
             "and the beam on that line is concealed within the slab.")
    cols = [(52, "SPACE", "l"), (34, "SIZE", "r"), (18, "AREA", "r"),
            (20, "DESIGN E", "r"), (22, "IS 3646", "r"), (18, "Hm", "r"),
            (14, "K", "r"), (14, "UF", "r"), (14, "MF", "r"),
            (16, "N CALC", "r"), (26, "PROVIDED", "r"), (24, "ACHIEVED", "r")]
    rows = []
    for cc in C:
        rows.append([cc["name"], fi(cc["Lmm"], False) + " x " + fi(cc["Wmm"], False),
                     "%.0f" % (cc["A"] * 10.7639), "%d lx" % cc["lux"], cc["isref"],
                     fi(cc["hm"] * 1000), "%.2f" % cc["k"], "%.2f" % cc["uf"],
                     "%.2f" % cc["mf"], "%.2f" % cc["n_exact"],
                     ("%d x %d W" % (cc["n"], cc["watt"]),), ("%d lx" % cc["E"],)])
    area = sum(cc["A"] for cc in C)
    w_l = sum(L["w"] for L in P["lights"])
    rows.append([("TOTAL",), "", ("%.0f" % (area * 10.7639),), "", "", "", "", "", "",
                 "", ("%d nos" % len(P["lights"]),), ("%d W" % w_l,)])
    y = table(c, x0, y, cols, rows) - 9

    y = head(c, x0, y, "4.  LIGHTING POWER DENSITY")
    cols = [(80, "ITEM", "l"), (46, "VALUE", "r"), (106, "REMARK", "l")]
    rows = [["Total lighting load", "%d W" % w_l, "General lighting only"],
            ["Total area served", "%.0f sft" % (area * 10.7639), "%.1f sq m" % area],
            [("Lighting power density",), ("%.2f W/sq m" % (w_l / area),),
             "Benchmark 5 to 8 W/sq m, ECBC-R and NBC 2016"]]
    y = table(c, x0, y, cols, rows) - 10

    y = head(c, x0, y, "5.  SPACING AND UNIFORMITY CHECK",
             "Spacing to mounting height ratio against the maximum of 1.50 for a near cosine "
             "surface luminaire, and edge offset as a fraction of the spacing.")
    cols = [(60, "SPACE", "l"), (26, "SPACING X", "r"), (26, "SPACING Y", "r"),
            (20, "Hm", "r"), (18, "SHR X", "r"), (18, "SHR Y", "r"),
            (20, "MAX SHR", "r"), (24, "EDGE X / SX", "r"), (24, "EDGE Y / SY", "r"),
            (18, "MAX", "r"), (20, "RESULT", "c")]
    table(c, x0, y, cols, _uniformity_rows())


def _uniformity_rows():
    """spacing to mounting height ratio, and edge offset as a fraction of spacing"""
    calc = {c["key"]: c for c in C}
    alias = {"HALL": "HALLDIN"}
    grp = {}
    for L in P["lights"]:
        g = grp.setdefault(L["setout"], {"x": set(), "y": set()})
        g["x"].add(L["ox"])
        g["y"].add(L["oy"])
    out = []
    for rid, ax in grp.items():
        key = alias.get(rid, rid)
        if key not in calc:
            continue
        cc = calc[key]
        # the space, not the room: hall and dining are one grid
        W, D, H = cc["Lmm"], cc["Wmm"], cc["hm"] * 1000
        xs, ys = sorted(ax["x"]), sorted(ax["y"])
        if len(xs) < 2 and len(ys) < 2:
            continue
        sx = max(b - a for a, b in zip(xs, xs[1:])) * INCH if len(xs) > 1 else 0
        sy = max(b - a for a, b in zip(ys, ys[1:])) * INCH if len(ys) > 1 else 0
        ex = min(xs[0] * INCH, W - xs[-1] * INCH)
        ey = min(ys[0] * INCH, D - ys[-1] * INCH)
        rx, ry = (ex / sx if sx else None), (ey / sy if sy else None)
        ok = ((sx / H <= 1.5) if sx else True) and ((sy / H <= 1.5) if sy else True) \
            and ((rx <= 0.55) if rx is not None else True) \
            and ((ry <= 0.55) if ry is not None else True)
        dash = "\u2014"
        out.append([cc["name"],
                    fi(sx) if sx else dash, fi(sy) if sy else dash, fi(H),
                    "%.2f" % (sx / H) if sx else dash,
                    "%.2f" % (sy / H) if sy else dash, "1.50",
                    "%.2f" % rx if rx is not None else dash,
                    "%.2f" % ry if ry is not None else dash,
                    "0.55", ("PASS",) if ok else ("CHECK",)])
    return out


def _calc_commentary(c, left):
    # ---------------- right column commentary
    ry = 400
    ry = head(c, left, ry, "DESIGN COMMENTARY")
    body = [
        ("Effect of the high soffit", [
            "Surface mounting at " + fi(SOFFIT) + " with no false ceiling puts the mounting "
            "height at " + fi(2463) + " above a " + fi(750) + " working plane in the "
            "habitable rooms. The room index falls to between 0.7 and 1.1 and the "
            "utilisation factor to between 0.38 and 0.53.",
            "A false ceiling at " + fi(2743) + " would raise the utilisation factor by "
            "roughly one fifth and reach the same illuminance with fewer fittings. The "
            "quantities in this drawing are the direct consequence of the decision to keep "
            "the bare soffit.",
        ]),
        ("Bedrooms", [
            "Both bedrooms are laid out on a symmetrical two by two grid that is "
            "deliberately not tuned to any one bed position. The bed may be placed against "
            "the south, west or north wall and the distribution remains even.",
            "In Bedroom 02 a 9 in x 15 in beam crosses the room " + fi(2145) + " in from the "
            "north wall, carrying the first floor staircase, and the strip beyond it lies "
            "under the first floor sunken slab. The two rows of fittings are set at " +
            fi(711) + " and " + fi(2718) + " so that the beam falls in the gap between them "
            "and neither row lands on it.",
        ]),
        ("Task lighting", [
            "Under counter lighting in the kitchen, wardrobe lighting, bathroom mirror "
            "lighting and desk lighting in the study are excluded from this calculation and "
            "are to be provided separately. The general levels above are therefore the "
            "ambient levels only.",
        ]),
        ("Items to be confirmed", [
            "Depth of the first floor sunken slab, assumed here as 12 in. It governs the "
            "soffit level in Bedroom 02, both bathrooms and the Handwash.",
            "Depths of the beams shown without a type mark on the structural drawing.",
            "Staircase lighting is not included. The stairwell is open to the first floor "
            "and its fittings are carried on the first or second floor slab.",
        ]),
    ]
    for title, paras in body:
        c.setFillGray(0)
        c.setFont("Helvetica-Bold", TX["s"])
        c.drawString(left * mm, ry * mm, title)
        ry -= 4.6
        c.setFont("Helvetica", TX["xs"])
        for para in paras:
            for line in _wrap(c, para, TBW, "Helvetica", TX["xs"]):
                c.drawString(left * mm, ry * mm, line)
                ry -= 3.0
            ry -= 1.8
        ry -= 2.4


# ================================================================== A4 spec
def spec_doc(path, types):
    A4 = (210 * mm, 297 * mm)
    c = canvas.Canvas(path, pagesize=A4)
    c.setTitle("Ground Floor Lighting and Ceiling Fans - Specification")
    c.setAuthor("Services - Electrical")
    W4, H4 = 210, 297
    M = 20
    state = {"y": 0, "page": 0}

    def newpage():
        if state["page"]:
            footer()
            c.showPage()
        state["page"] += 1
        c.setStrokeGray(0)
        c.setLineWidth(LW["med"])
        c.line(M * mm, (H4 - 24) * mm, (W4 - M) * mm, (H4 - 24) * mm)
        c.setFillGray(0)
        c.setFont("Helvetica-Bold", TX["s"])
        c.drawString(M * mm, (H4 - 21) * mm,
                     "GROUND FLOOR LIGHTING AND CEILING FANS")
        c.setFont("Helvetica", TX["xs"])
        c.setFillGray(0.35)
        c.drawRightString((W4 - M) * mm, (H4 - 21) * mm, "SPECIFICATION  •  GF/EL/SPEC  •  REV A")
        state["y"] = H4 - 34
        c.setFillGray(0)

    def footer():
        c.setLineWidth(LW["thin"])
        c.setStrokeGray(0.6)
        c.line(M * mm, 17 * mm, (W4 - M) * mm, 17 * mm)
        c.setFont("Helvetica", TX["xs"])
        c.setFillGray(0.4)
        c.drawString(M * mm, 13 * mm, PROJECT + ", " + LOCATION)
        c.drawRightString((W4 - M) * mm, 13 * mm, "Page %d" % state["page"])
        c.setFillGray(0)

    def need(h):
        if state["y"] - h < 24:
            newpage()

    def h1(n, t):
        need(16)
        state["y"] -= 3
        c.setFillGray(0)
        c.setFont("Helvetica-Bold", TX["m"])
        c.drawString(M * mm, state["y"] * mm, "%s   %s" % (n, t))
        state["y"] -= 2.2
        c.setLineWidth(LW["thin"])
        c.setStrokeGray(0)
        c.line(M * mm, state["y"] * mm, (W4 - M) * mm, state["y"] * mm)
        state["y"] -= 5.2

    def clause(n, text):
        need(12)
        c.setFont("Helvetica-Bold", TX["s"])
        c.setFillGray(0)
        c.drawString(M * mm, state["y"] * mm, n)
        c.setFont("Helvetica", TX["s"])
        lines = _wrap(c, text, W4 - 2 * M - 12, "Helvetica", TX["s"])
        for ln in lines:
            need(6)
            c.drawString((M + 12) * mm, state["y"] * mm, ln)
            state["y"] -= 4.1
        state["y"] -= 2.2

    # ---- cover
    newpage()
    state["y"] = H4 - 70
    c.setFont("Helvetica", TX["s"])
    c.setFillGray(0.35)
    c.drawString(M * mm, (state["y"] + 26) * mm, "SPECIFICATION")
    c.setFillGray(0)
    c.setFont("Helvetica-Bold", TX["xl"])
    c.drawString(M * mm, (state["y"] + 14) * mm, "Ground Floor Lighting")
    c.drawString(M * mm, (state["y"] + 4) * mm, "and Ceiling Fans")
    c.setLineWidth(LW["hvy"])
    c.line(M * mm, (state["y"] - 4) * mm, (W4 - M) * mm, (state["y"] - 4) * mm)
    state["y"] -= 16
    c.setFont("Helvetica", TX["m"])
    c.drawString(M * mm, state["y"] * mm, PROJECT.title())
    state["y"] -= 6
    c.setFillGray(0.35)
    c.setFont("Helvetica", TX["s"])
    c.drawString(M * mm, state["y"] * mm, LOCATION.title())
    state["y"] -= 20

    c.setFillGray(0)
    cols = [(52, "", "l"), (118, "", "l")]
    rows = [["Document", "GF/EL/SPEC"],
            ["Revision", "A  —  " + TODAY],
            ["Status", "For construction"],
            ["Accompanying drawings", "GF/EL/01  Lighting and ceiling fan layout"],
            ["", "GF/EL/02  Luminaire and fan schedules"],
            ["", "GF/EL/03  Illumination calculations"],
            ["Read with", ARCH_REF + "  •  " + STRU_REF]]
    state["y"] = table(c, M, state["y"], cols, rows, head=0, zebra=False) - 14

    h1("1", "SCOPE")
    clause("1.1", "This specification covers the supply and installation of general lighting "
                  "and ceiling fans on the ground floor, together with the conduit, junction "
                  "boxes and fan hooks that must be cast into the ground floor roof slab.")
    clause("1.2", "Excluded from this scope: task lighting of any kind, being under counter, "
                  "wardrobe, bathroom mirror and desk lighting; switching and switch boards; "
                  "socket outlets; distribution boards, cabling and earthing; air "
                  "conditioning; exhaust ventilation. These are covered by separate drawings.")
    clause("1.3", "Staircase lighting is excluded. The stairwell is open to the first floor "
                  "and its luminaires are carried on the first or second floor slab.")

    h1("2", "STANDARDS")
    for n, t in [("2.1", "IS 3646 (Part 1) : 1992  Code of practice for interior "
                         "illumination — principles of good lighting and aspects of "
                         "design."),
                 ("2.2", "National Building Code of India 2016, Part 8 Section 1, Lighting "
                         "and Ventilation, and Part 8 Section 2, Electrical and Allied "
                         "Installations."),
                 ("2.3", "IS 732 : 2019  Code of practice for electrical wiring "
                         "installations."),
                 ("2.4", "IS 9537 (Part 3)  Conduits for electrical installations, rigid "
                         "plain conduits of insulating material."),
                 ("2.5", "IS 10322 (Part 5)  Luminaires, particular requirements. LED "
                         "luminaires to IS 16107 and IS 16108 as applicable."),
                 ("2.6", "IS 374  Electric ceiling type fans and regulators. BLDC fans to "
                         "carry a valid BEE star label.")]:
        clause(n, t)

    h1("3", "LUMINAIRES")
    clause("3.1", "All luminaires are LED surface panels with integral driver, mounted "
                  "directly on the RCC soffit. There is no false ceiling anywhere on this "
                  "floor and no recessed fitting is to be used.")
    clause("3.2", "Minimum luminous efficacy 100 lm/W at the luminaire. Minimum colour "
                  "rendering index 80 generally and 90 in the kitchen and bathrooms. "
                  "Colour consistency within 3 SDCM across all fittings of one type.")
    clause("3.3", "Rated life not less than L70B50 at 25000 hours. Driver power factor not "
                  "less than 0.90 at full load. Surge protection not less than 2 kV line to "
                  "neutral.")
    clause("3.4", "Wet locations: bathrooms and utility to IP44 minimum, portico to IP54 "
                  "minimum with a UV stabilised diffuser.")
    clause("3.5", "Luminaire types, quantities and locations are scheduled on drawing "
                  "GF/EL/02. Any proposed equivalent is to be submitted with photometric "
                  "data and approved before ordering.")

    need(40)
    cols = [(16, "TYPE", "c"), (56, "DESCRIPTION", "l"), (20, "RATING", "r"),
            (22, "OUTPUT", "r"), (20, "CCT", "r"), (18, "IP", "c"), (18, "QTY", "r")]
    rows = [[(t["type"],), "LED surface panel luminaire", "%d W" % t["w"],
             "%d lm" % t["lm"], "%d K" % t["cct"],
             t["ip"] if t["ip"] != "—" else "IP20", (str(t["qty"]),)] for t in types]
    state["y"] = table(c, M, state["y"], cols, rows) - 10

    h1("4", "CEILING FANS")
    clause("4.1", "All fans are 1200 mm, being 48 in, sweep with a brushless direct current "
                  "motor, rated not more than 32 W at full speed and delivering not less "
                  "than 210 CMM.")
    clause("4.2", "Fans are supplied with an integral radio frequency receiver in the canopy "
                  "and a handheld remote. The wall position is therefore a plain switched "
                  "live; no step type regulator is to be fitted, as it will not control a "
                  "BLDC fan and may damage the electronics.")
    clause("4.3", "Downrod length 600 mm, being 24 in, in all internal rooms and 900 mm, "
                  "being 36 in, in the portico, so that the blade plane is held at " +
                  P["fans"][0]["blade_ft"] + " above finished floor internally. This is not "
                  "an optional item: with a " + fi(SOFFIT) + " soffit the stock 250 mm rod "
                  "leaves the blades too close to the ceiling to move air effectively.")
    clause("4.4", "Minimum blade clearance to any wall 12 in. Minimum blade level above "
                  "finished floor 2100 mm in accordance with normal practice.")
    clause("4.5", "The portico fan is to be an outdoor rated model with a powder coated or "
                  "anodised finish and sealed motor housing, suitable for a dusty inland "
                  "location.")

    h1("5", "WORK TO BE CAST INTO THE SLAB")
    clause("5.1", "Fan hooks. A closed loop bent from 10 mm diameter mild steel bar, hooked "
                  "over two bottom mesh bars in each direction and tied with binding wire at "
                  "all four crossings. The loop is to project 2½ in to 3 in below the "
                  "finished soffit and to be capable of carrying a static load of 100 kg. "
                  "Hooks tied to a single bar are not acceptable.")
    clause("5.2", "Conduit. ISI marked medium gauge rigid PVC to IS 9537 (Part 3). 20 mm "
                  "diameter for up to three 1.5 sq mm cores and 25 mm diameter above that. "
                  "Conduit is to be laid between the top and bottom layers of slab "
                  "reinforcement, never above the top mesh, with not less than 25 mm cover "
                  "to the soffit. A galvanised iron draw wire is to be left in every run.")
    clause("5.3", "Beams. No conduit is to pass through any reinforced concrete beam. Runs "
                  "are to be routed around the beam within the slab panel, or dropped down "
                  "the wall and raised again on the far side. The layout on GF/EL/01 is "
                  "arranged so that no run needs to cross a beam.")
    clause("5.4", "Junction boxes. 75 mm diameter PVC boxes set flush with the finished "
                  "soffit. Not more than two 90 degree bends between draw points; where a "
                  "third bend is unavoidable an additional box is to be provided. No box is "
                  "to be concealed behind finishes.")
    clause("5.5", "Sunken zones. Over the Common Bath, the Handwash, the south strip of "
                  "Bedroom 02 and the Master Bath the slab panel steps down by "
                  "approximately 12 in. Conduit is to follow the step and is not to bridge "
                  "across it.")

    h1("6", "SEQUENCE AND INSPECTION")
    clause("6.1", "The electrical contractor is to work on the deck after the bar bender has "
                  "completed the bottom mesh and before the top mesh is laid.")
    clause("6.2", "Before any concrete is placed, the contractor is to walk the deck with "
                  "the client and the architect and obtain confirmation of every fan hook "
                  "and light point position, and is then to photograph the entire deck with "
                  "a tape rule in frame.")
    clause("6.3", "All draw wires are to be pulled through again within one week of the pour "
                  "and before the shuttering is struck. Any run found to be blocked is to be "
                  "reported immediately.")
    clause("6.4", "Insulation resistance is to be tested with a 500 V megger after wiring "
                  "and before energising, and a test record submitted.")

    h1("7", "ASSUMPTIONS TO BE CONFIRMED")
    clause("7.1", "The depth of the first floor sunken slab is taken as 12 in. It governs "
                  "the soffit level in Bedroom 02, the Common Bath, the Handwash and the "
                  "Master Bath, and therefore the mounting level of six luminaires. To be "
                  "confirmed by the structural engineer before setting out.")
    clause("7.2", "Beam depths where the structural drawing carries no type mark have been "
                  "inferred. To be confirmed against the marked up structural print.")
    clause("7.3", "Room dimensions have been taken from the architect's drawing " + ARCH_REF +
                  " and reproduce to within 15 mm. Any dimensional change is to be notified "
                  "before the fittings are ordered.")

    footer()
    c.save()


# ===================================================================== build
def main():
    types = luminaire_types()

    dwg = os.path.join(HERE, "GF-EL-01_Lighting-and-Fan-Layout.pdf")
    c = canvas.Canvas(dwg, pagesize=(PW * mm, PH * mm))
    c.setTitle("GF/EL/01 - Ground Floor Lighting and Ceiling Fan Layout")
    c.setAuthor("Services - Electrical")
    plan_sheet(c); c.showPage()
    schedule_sheet(c, types); c.showPage()
    calc_sheet(c); c.showPage()
    c.save()

    spec = os.path.join(HERE, "GF-EL-SPEC_Specification.pdf")
    spec_doc(spec, types)

    for f in (dwg, spec):
        print("%-46s %6.0f KB" % (os.path.basename(f), os.path.getsize(f) / 1024))
    print("%d luminaire types, %d light points, %d fans"
          % (len(types), len(P["lights"]), len(P["fans"])))


if __name__ == "__main__":
    main()
