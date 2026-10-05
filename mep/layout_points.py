"""
Ground floor - light point and ceiling fan setting-out.

Every position is defined as a whole-inch offset from the INSIDE CORNER of its own room,
because that is what the wireman measures on site. Global co-ordinates are derived from it.

Scope: general lighting + ceiling fans only.

Run:  python layout_points.py
"""
import json
import math
import os

HERE = os.path.dirname(os.path.abspath(__file__))
G = json.load(open(os.path.join(HERE, "data", "gf-geometry.json")))
ROOMS = {r["id"]: r for r in G["rooms"]}
LV = G["levels"]

IN = 25.4
SOFFIT = LV["clear_soffit_above_gf_ffl_mm"]          # 3213
SUNK = 300                                           # assumed FF sunken-slab drop
PORTICO_DROP = 600                                   # portico FFL is 600 below GF FFL
BEAM_SOFFIT = {k: SOFFIT - v["downstand_mm"] for k, v in LV["beam_types"].items()}


def fi(mm, half=True):
    n = mm / IN
    n = round(n * 2) / 2 if half else round(n)
    ft = int(n // 12)
    inch = n - 12 * ft
    frac = "½" if abs(inch - int(inch)) > 0.01 else ""
    return f"{ft}'-{int(inch)}{frac}\""


# --------------------------------------------------------------------------
# Soffit bands. Not drawn on the plan, but every fitting must sit wholly inside
# one of them - a surface panel cannot straddle a downstand or a sunken step.
# --------------------------------------------------------------------------
BANDS = {
    "BED02": [(231, 2376, SOFFIT), (2376, 2604, BEAM_SOFFIT["B2"]), (2604, 3416, SOFFIT - SUNK)],
    "OFFICE": [(231, 3810, SOFFIT), (3810, 4041, BEAM_SOFFIT["B2"]), (4041, 4732, SOFFIT)],
    "UTIL": [(6539, 6770, BEAM_SOFFIT["B1"]), (6770, 8639, SOFFIT)],
    "HWASH": [(3526, 4210, SOFFIT - SUNK), (4210, 4439, BEAM_SOFFIT["B1"]), (4439, 5096, SOFFIT)],
    "CBATH": [(3526, 4210, SOFFIT - SUNK), (4210, 4439, BEAM_SOFFIT["B1"]), (4439, 5096, SOFFIT)],
    "MBATH": [(6668, 8639, SOFFIT - SUNK)],
    "PORTICO": [(231, 4925, SOFFIT + PORTICO_DROP)],
}


def soffit_at(rid, y):
    for y0, y1, z in BANDS.get(rid, []):
        if y0 <= y <= y1:
            return z
    return SOFFIT


def on_beam(rid, y):
    for y0, y1, z in BANDS.get(rid, []):
        if y0 <= y <= y1 and z in (BEAM_SOFFIT["B1"], BEAM_SOFFIT["B2"], BEAM_SOFFIT["B4"]):
            return True
    return False


# --------------------------------------------------------------------------
# LIGHT POINTS - (setting-out room, id, X offset in, Y offset in, watt)
# Hall and Dining are one open volume, so the six fittings are one 2 x 3 grid
# set out from the Hall's north-west inside corner.
# --------------------------------------------------------------------------
LIGHTS = [
    # Bedroom 02 - square grid, deliberately orientation-neutral. The B2 beam
    # falls in the gap between the two rows, so neither row lands on it.
    ("BED02", "L1", 45, 28, 15), ("BED02", "L2", 135, 28, 15),
    ("BED02", "L3", 45, 107, 15), ("BED02", "L4", 135, 107, 15),

    # Master Bedroom - clean flat ceiling, true 2 x 2 centred on the room.
    ("MBED", "L5", 45, 34, 15), ("MBED", "L6", 135, 34, 15),
    ("MBED", "L7", 45, 101, 15), ("MBED", "L8", 135, 101, 15),

    # Hall + Dining - one 2 x 3 grid over the whole open volume.
    ("HALL", "L9", 44, 41.5, 18), ("HALL", "L10", 131.5, 41.5, 18),
    ("HALL", "L11", 44, 124, 18), ("HALL", "L12", 131.5, 124, 18),
    ("HALL", "L13", 44, 206.5, 18), ("HALL", "L14", 131.5, 206.5, 18),

    # Office / Study - grid held north of the B2 beam.
    ("OFFICE", "L15", 29, 42, 22), ("OFFICE", "L16", 86.5, 42, 22),
    ("OFFICE", "L17", 29, 123, 22), ("OFFICE", "L18", 86.5, 123, 22),

    # Kitchen - general lighting only. Under-counter task lighting by others.
    ("KITCH", "L19", 28.5, 37.5, 18), ("KITCH", "L20", 85.5, 37.5, 18),
    ("KITCH", "L21", 28.5, 112, 18), ("KITCH", "L22", 85.5, 112, 18),

    ("UTIL", "L23", 24.5, 46, 15), ("UTIL", "L24", 74, 46, 15),

    ("HWASH", "L25", 54.5, 18, 15),
    ("CBATH", "L26", 35.5, 45, 15),
    ("MBATH", "L27", 36.5, 39, 15),
    ("LOBBY", "L28", 27.5, 33, 15),

    ("PORTICO", "L29", 73, 46, 24), ("PORTICO", "L30", 73, 139, 24),
]

# --------------------------------------------------------------------------
# CEILING FANS - BLDC. (room, id, X offset in, Y offset in, sweep mm)
# --------------------------------------------------------------------------
FANS = [
    ("BED02", "F1", 90, 63, 1200),
    ("MBED", "F2", 90, 67.5, 1200),
    ("HALL", "F3", 88, 65, 1200),
    ("DINING", "F4", 87, 62, 1200),
    ("OFFICE", "F5", 58, 88.5, 1200),
    ("PORTICO", "F6", 73, 92.5, 1200),
]

CCT = {"BED02": 3000, "MBED": 3000, "HALL": 3000, "DINING": 3000, "OFFICE": 4000,
       "KITCH": 4000, "UTIL": 4000, "HWASH": 4000, "CBATH": 4000, "MBATH": 4000,
       "LOBBY": 3000, "PORTICO": 3000}
IP = {"CBATH": "IP44", "MBATH": "IP44", "UTIL": "IP44", "HWASH": "IP44",
      "PORTICO": "IP54"}

NOMINAL_ROD = {250: '10"', 450: '18"', 600: '24"', 900: '36"'}
TARGET_BLADE = 2530          # blade plane above FFL, internal rooms


def owner(x, y):
    """which room a global point actually falls in"""
    for r in G["rooms"]:
        if r["x0"] <= x <= r["x1"] and r["y0"] <= y <= r["y1"]:
            return r["id"]
    return None


lights = []
for rid, lid, ox, oy, w in LIGHTS:
    r = ROOMS[rid]
    x, y = round(r["x0"] + ox * IN), round(r["y0"] + oy * IN)
    home = owner(x, y) or rid
    z = soffit_at(home, y)
    lights.append(dict(id=lid, setout=rid, room=home, x=x, y=y,
                       ox=ox, oy=oy, w=w, lm=w * 100, cct=CCT[rid],
                       ip=IP.get(home, "—"), z=z,
                       ox_ft=fi(ox * IN), oy_ft=fi(oy * IN), z_ft=fi(z)))

fans = []
for rid, fid, ox, oy, sweep in FANS:
    r = ROOMS[rid]
    x, y = round(r["x0"] + ox * IN), round(r["y0"] + oy * IN)
    z = soffit_at(rid, y)
    if rid == "PORTICO":
        rod, blade = 900, z - 900 - 85   # z is already above the PORTICO floor
    else:
        rod = round((z - TARGET_BLADE - 85) / 150) * 150
        rod = min(max(rod, 250), 900)
        blade = z - rod - 85
    fans.append(dict(id=fid, room=rid, x=x, y=y, ox=ox, oy=oy, sweep=sweep,
                     z=z, rod=rod, blade=blade,
                     ox_ft=fi(ox * IN), oy_ft=fi(oy * IN),
                     sweep_in=f'{round(sweep / IN)}"', rod_in=NOMINAL_ROD.get(rod, f'{round(rod / IN)}"'),
                     datum=("portico floor" if rid == "PORTICO" else "GF FFL"),
                     blade_ft=fi(blade), z_ft=fi(z)))

# ------------------------------------------------------------------- checks
issues = []
for L in lights:
    r = ROOMS[L["room"]]
    if not (r["x0"] <= L["x"] <= r["x1"] and r["y0"] <= L["y"] <= r["y1"]):
        issues.append(f"{L['id']} falls outside {r['name']}")
    if on_beam(L["room"], L["y"]):
        issues.append(f"{L['id']} sits on a downstand beam in {r['name']}")

for F in fans:
    r = ROOMS[F["room"]]
    rad = F["sweep"] / 2
    clr = min(F["x"] - rad - r["x0"], r["x1"] - F["x"] - rad,
              F["y"] - rad - r["y0"], r["y1"] - F["y"] - rad)
    if clr < 300:
        issues.append(f"{F['id']} blade tip only {clr:.0f} mm from a wall in {r['name']}")
    for L in lights:
        if L["room"] != F["room"] and L["setout"] != F["room"]:
            continue
        d = math.hypot(L["x"] - F["x"], L["y"] - F["y"])
        if d < rad + 150:
            issues.append(f"{F['id']} blade circle reaches {L['id']} ({d:.0f} mm)")
    if F["blade"] < 2100:
        issues.append(f"{F['id']} blade only {F['blade']} mm AFF (IS minimum 2100)")

out = {
    "_meta": {
        "scope": "GROUND FLOOR - GENERAL LIGHTING AND CEILING FANS ONLY",
        "frame": G["_meta"]["origin"],
        "units": "offsets are whole inches from the room's inside corner; "
                 "global co-ordinates in mm",
        "soffit_mm": SOFFIT, "soffit_ft": fi(SOFFIT),
        "sunken_drop_assumed_mm": SUNK,
        "no_false_ceiling": True,
    },
    "lights": lights,
    "fans": fans,
}
json.dump(out, open(os.path.join(HERE, "data", "gf-ceiling-points.json"), "w"), indent=1)

# ------------------------------------------------------------------ report
print(f"LIGHT POINTS  {len(lights)}   {sum(l['w'] for l in lights)} W")
hdr = f"{'REF':5s}{'ROOM':24s}{'FITTING':13s}{'FROM ROOM CORNER':>24s}{'SOFFIT':>10s}{'CCT':>7s}{'IP':>6s}"
print(hdr); print("-" * len(hdr))
for L in lights:
    print(f"{L['id']:5s}{ROOMS[L['room']]['name'][:23]:24s}"
          f"{str(L['w']) + 'W panel':13s}"
          f"{L['ox_ft'] + ' x ' + L['oy_ft']:>24s}{L['z_ft']:>10s}"
          f"{str(L['cct']) + 'K':>7s}{L['ip']:>6s}")

print(f"\nCEILING FANS  {len(fans)}   BLDC")
hdr = f"{'REF':5s}{'ROOM':24s}{'SWEEP':>9s}{'FROM ROOM CORNER':>24s}{'SOFFIT':>10s}{'DOWNROD':>10s}{'BLADE AFF':>12s}"
print(hdr); print("-" * len(hdr))
for F in fans:
    print(f"{F['id']:5s}{ROOMS[F['room']]['name'][:23]:24s}{F['sweep_in']:>9s}"
          f"{F['ox_ft'] + ' x ' + F['oy_ft']:>24s}{F['z_ft']:>10s}"
          f"{F['rod_in']:>10s}{F['blade_ft']:>12s}   {F['datum']}")

print()
if issues:
    print("!! WARNINGS"); [print("   -", s) for s in issues]
else:
    print("Checks passed: no fitting on a downstand beam, no blade circle reaching a light")
    print("point, every blade tip 300 mm clear of walls, every blade above the 2100 mm minimum.")
print("\nwrote data/gf-ceiling-points.json")
