"""
Ground floor - general lighting design. Lumen method, IS 3646 (Part 1) / NBC 2016 Part 8.

    N  =  (E x A) / (F x UF x MF)          Room Index  K = LW / (Hm (L+W))

Fittings are SURFACE MOUNTED LED PANELS on bare RCC soffit at 10'-6" - there is no false
ceiling, so the mounting height is high and the utilisation factor is low. Task lighting
(under-counter, wardrobe, mirror, desk lamp) is by others and is NOT counted here.

Run:  python calc_lighting.py
"""
import json
import math
import os

HERE = os.path.dirname(os.path.abspath(__file__))
G = json.load(open(os.path.join(HERE, "data", "gf-geometry.json")))
ROOMS = {r["id"]: r for r in G["rooms"]}
SOFFIT = G["levels"]["clear_soffit_above_gf_ffl_mm"]        # 3213 mm = 10'-6.5"


# ------------------------------------------------------------------- ft / in
def fi(mm, half=True):
    """millimetres -> Indian site notation, e.g. 15'-0"  /  10'-61/2" """
    n = mm / 25.4
    n = round(n * 2) / 2 if half else round(n)
    ft, inch = int(n // 12), n - 12 * (n // 12)
    frac = "½" if abs(inch - int(inch)) > 0.01 else ""
    return f"{ft}'-{int(inch)}{frac}\""


def fi2(w, d):
    return f"{fi(w, False)} x {fi(d, False)}"


def sqft(m2):
    return m2 * 10.7639


# ---------------------------------------------------- utilisation factor
# Surface-mounted opal LED panel, near-cosine distribution.
# Reflectances: ceiling 0.70 (white painted RCC), walls 0.50, floor 0.20.
UF_TABLE = [(0.60, 0.38), (0.80, 0.46), (1.00, 0.52), (1.25, 0.57),
            (1.50, 0.61), (2.00, 0.66), (2.50, 0.70), (3.00, 0.72)]


def uf_from_ri(k):
    if k <= UF_TABLE[0][0]:
        return UF_TABLE[0][1]
    if k >= UF_TABLE[-1][0]:
        return UF_TABLE[-1][1]
    for (a, u), (b, v) in zip(UF_TABLE, UF_TABLE[1:]):
        if a <= k <= b:
            return u + (v - u) * (k - a) / (b - a)
    return 0.5


# Indian market surface LED panels, ~100 lm/W
PANEL = {12: 1200, 15: 1500, 18: 1800, 22: 2200, 24: 2400, 36: 3600}

# ------------------------------------------------------------------ programme
# lux : DESIGN illuminance on the working plane (IS 3646 recommendation in brackets)
# wp  : working plane above FFL, m       mf : maintenance factor (dusty site, 3-yearly clean)
SPEC = [
    # key,      spaces,              lux, is_ref,       wp,   mf,   W,  n,  cct, cri
    ("BED02",   ["BED02"],           125, "100 min",   0.75, 0.75, 15, 4, 3000, 80),
    ("MBED",    ["MBED"],            125, "100 min",   0.75, 0.75, 15, 4, 3000, 80),
    ("HALLDIN", ["HALL", "DINING"],  150, "150",       0.75, 0.75, 18, 6, 3000, 80),
    ("OFFICE",  ["OFFICE"],          200, "200 gen",   0.75, 0.75, 22, 4, 4000, 80),
    ("KITCH",   ["KITCH"],           200, "200 gen",   0.85, 0.70, 18, 4, 4000, 90),
    ("UTIL",    ["UTIL"],            150, "150",       0.85, 0.70, 15, 2, 4000, 80),
    ("HWASH",   ["HWASH"],           100, "100",       0.85, 0.75, 15, 1, 4000, 90),
    ("CBATH",   ["CBATH"],           100, "100",       0.00, 0.70, 15, 1, 4000, 90),
    ("MBATH",   ["MBATH"],           100, "100",       0.00, 0.70, 15, 1, 4000, 90),
    ("LOBBY",   ["LOBBY"],           150, "150 lobby", 0.00, 0.75, 15, 1, 3000, 80),
    ("PORTICO", ["PORTICO"],          70, "70 covered", 0.00, 0.65, 24, 2, 3000, 80),
]

PORTICO_DROP = 600      # portico FFL is 600 mm below GF FFL, so its soffit is higher

rows = []
for key, ids, lux, isref, wp, mf, watt, n, cct, cri in SPEC:
    # combined spaces (hall + dining are one open volume) are calculated as one room
    x0 = min(ROOMS[i]["x0"] for i in ids)
    x1 = max(ROOMS[i]["x1"] for i in ids)
    y0 = min(ROOMS[i]["y0"] for i in ids)
    y1 = max(ROOMS[i]["y1"] for i in ids)
    Lm, Wm = (x1 - x0) / 1000.0, (y1 - y0) / 1000.0
    A = Lm * Wm
    soff = SOFFIT + (PORTICO_DROP if key == "PORTICO" else 0)
    hm = soff / 1000.0 - wp
    k = (Lm * Wm) / (hm * (Lm + Wm))
    uf = uf_from_ri(k)
    lm = PANEL[watt]
    n_exact = (lux * A) / (lm * uf * mf)
    E = (n * lm * uf * mf) / A
    rows.append(dict(key=key, ids=ids,
                     name=" + ".join(ROOMS[i]["name"] for i in ids),
                     Lmm=x1 - x0, Wmm=y1 - y0, A=A, lux=lux, isref=isref,
                     soffit=soff, hm=hm, k=k, uf=uf, mf=mf, watt=watt, lm=lm,
                     n_exact=n_exact, n=n, E=E, cct=cct, cri=cri,
                     load=n * watt, wsqm=n * watt / A))

# --------------------------------------------------------------------- report
print("GENERAL LIGHTING - LUMEN METHOD, IS 3646 (PART 1)")
print(f"Surface panels on bare RCC soffit at {fi(SOFFIT)} AFF. No false ceiling.\n")

h = (f"{'SPACE':26s}{'SIZE':>20s}{'AREA':>9s}{'DESIGN':>8s}{'Hm':>9s}"
     f"{'K':>6s}{'UF':>6s}{'MF':>6s}{'FITTINGS':>15s}{'CALC':>7s}{'ACHIEVED':>10s}")
print(h)
print("-" * len(h))
for r in rows:
    print(f"{r['name'][:25]:26s}{fi2(r['Lmm'], r['Wmm']):>20s}"
          f"{sqft(r['A']):8.0f}'{r['lux']:8d}{fi(r['hm'] * 1000):>9s}"
          f"{r['k']:6.2f}{r['uf']:6.2f}{r['mf']:6.2f}"
          f"{str(r['n']) + ' x ' + str(r['watt']) + 'W':>15s}"
          f"{r['n_exact']:7.2f}{r['E']:9.0f}L")
print("-" * len(h))

tot_n = sum(r["n"] for r in rows)
tot_w = sum(r["load"] for r in rows)
tot_a = sum(r["A"] for r in rows)
print(f"{'TOTAL':26s}{'':20s}{sqft(tot_a):8.0f}'{'':8s}{'':9s}{'':6s}{'':6s}{'':6s}"
      f"{str(tot_n) + ' fittings':>15s}{'':7s}{tot_w:8d}W")
print(f"\nLighting power density  {tot_w / tot_a:.2f} W/m2  ({tot_w / sqft(tot_a):.3f} W/sqft)")
print("ECBC-R / NBC 2016 residential benchmark is 5-8 W/m2.")
print("\nDESIGN lux is the maintained level on the working plane. IS 3646 reference in the")
print("schedule. Task lighting (under-counter, wardrobe, mirror, desk lamp) is BY OTHERS.")

json.dump(rows, open(os.path.join(HERE, "data", "lighting-calc.json"), "w"), indent=1)
print("\nwrote data/lighting-calc.json")
