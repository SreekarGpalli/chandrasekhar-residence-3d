"""
Builds gf-ceiling-plan.html - ground floor lighting and ceiling fan layout.

Generated from data/gf-geometry.json, data/lighting-calc.json and
data/gf-ceiling-points.json so the drawing can never drift from the schedule.

Run:  python build_plan.py
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
G = json.load(open(os.path.join(HERE, "data", "gf-geometry.json")))
C = json.load(open(os.path.join(HERE, "data", "lighting-calc.json")))
P = json.load(open(os.path.join(HERE, "data", "gf-ceiling-points.json")))
ROOMS = {r["id"]: r for r in G["rooms"]}
IN = 25.4
SOFFIT = G["levels"]["clear_soffit_above_gf_ffl_mm"]
NOMINAL = {900: '36"', 1050: '42"', 1200: '48"', 1400: '56"'}


def fi(mm, half=True):
    n = mm / IN
    n = round(n * 2) / 2 if half else round(n)
    ft = int(n // 12)
    inch = n - 12 * ft
    frac = "½" if abs(inch - int(inch)) > 0.01 else ""
    return f"{ft}'-{int(inch)}{frac}\""


def esc(s):
    return str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


W, H = 16606, 8870
ML, MT, MR, MB = 1450, 1150, 650, 1350
e = []
add = e.append

# ---------------------------------------------------------------- wall poche
holes = [f"M{r['x0']} {r['y0']}H{r['x1']}V{r['y1']}H{r['x0']}Z" for r in G["rooms"]]
for x0, y0, x1, y1 in [(9372, 4846, 9521, 6539), (12424, 5156, 12654, 6835),
                       (14045, 5156, 14275, 6835), (12654, 6835, 14045, 7060)]:
    holes.append(f"M{x0} {y0}H{x1}V{y1}H{x0}Z")
add(f'<path class="poche" fill-rule="evenodd" d="M0 0H{W}V{H}H0Z {" ".join(holes)}"/>')

for r in G["rooms"]:
    cls = {"outdoor_covered": "rm rm-out", "bath": "rm rm-wet", "wet": "rm rm-wet",
           "utility": "rm rm-wet", "kitchen": "rm rm-wet",
           "lift": "rm rm-lift"}.get(r["type"], "rm")
    add(f'<rect class="{cls}" x="{r["x0"]}" y="{r["y0"]}" '
        f'width="{r["x1"] - r["x0"]}" height="{r["y1"] - r["y0"]}"/>')

# ------------------------------------------------------------------ openings
for key, lst in G["openings"].items():
    if key.startswith("_"):
        continue
    for o in lst:
        if "x0" in o:
            yy = 0 if "north" in key else H - 235
            add(f'<rect class="op op-{o["kind"]}" x="{o["x0"]}" y="{yy - 3}" '
                f'width="{o["x1"] - o["x0"]}" height="241"/>')
        else:
            xx = 0 if "west" in key else 12424
            add(f'<rect class="op op-{o["kind"]}" x="{xx - 3}" y="{o["y0"]}" '
                f'width="241" height="{o["y1"] - o["y0"]}"/>')

# --------------------------------------------------------------- room labels
RLAB = {"BED02": (0, -1130, 200), "MBED": (0, -1180, 200), "HALL": (0, -1250, 200),
        "DINING": (0, 1180, 200), "OFFICE": (0, -1560, 185), "KITCH": (-430, 1430, 180),
        "UTIL": (0, -700, 150), "HWASH": (0, -560, 133), "CBATH": (0, -560, 130),
        "MBATH": (0, -830, 133), "LOBBY": (0, -640, 130), "LIFT": (0, 0, 138),
        "STAIR": (0, -1300, 168), "PORTICO": (0, 1560, 196)}
SHORT = {"HWASH": "Handwash", "MBATH": "Master Bath", "PORTICO": "Portico",
         "LOBBY": "Lift Lobby", "KITCH": "Kitchen"}
for r in G["rooms"]:
    cx, cy = (r["x0"] + r["x1"]) / 2, (r["y0"] + r["y1"]) / 2
    dx, dy, fs = RLAB.get(r["id"], (0, 0, 185))
    add(f'<text class="rlab" x="{cx + dx}" y="{cy + dy}" style="font-size:{fs}px">'
        f'{esc(SHORT.get(r["id"], r["name"]).upper())}</text>')
    if r["id"] not in ("LIFT", "STAIR", "LOBBY"):
        add(f'<text class="rdim" x="{cx + dx}" y="{cy + dy + fs * 1.44}" '
            f'style="font-size:{int(fs * 0.7)}px">'
            f'{fi(r["w"], False)} × {fi(r["d"], False)}</text>')

# -------------------------------------------------------------------- lights
add('<g class="lyr lyr-light">')
for L in P["lights"]:
    x, y, s = L["x"], L["y"], 320
    add(f'<rect class="fx" x="{x - s / 2}" y="{y - s / 2}" width="{s}" height="{s}" rx="24">'
        f'<title>{L["id"]} · {L["w"]}W surface panel · {L["cct"]}K · '
        f'{L["ox_ft"]} × {L["oy_ft"]} from the room corner · soffit {L["z_ft"]}</title></rect>')
    add(f'<line class="fxc" x1="{x - 95}" y1="{y}" x2="{x + 95}" y2="{y}"/>')
    add(f'<line class="fxc" x1="{x}" y1="{y - 95}" x2="{x}" y2="{y + 95}"/>')
    add(f'<text class="fxlab" x="{x}" y="{y - 250}">{L["id"]}</text>')
add('</g>')

# ---------------------------------------------------------------------- fans
add('<g class="lyr lyr-fan">')
for F in P["fans"]:
    x, y, r = F["x"], F["y"], F["sweep"] / 2
    add(f'<circle class="fansweep" cx="{x}" cy="{y}" r="{r}">'
        f'<title>{F["id"]} · BLDC {NOMINAL.get(F["sweep"], F["sweep"])} sweep · '
        f'{F["ox_ft"]} × {F["oy_ft"]} from the room corner · '
        f'{F["rod_in"]} downrod · blade {F["blade_ft"]} above {F["datum"]}</title></circle>')
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        add(f'<line class="fanblade" x1="{x + dx * 200}" y1="{y + dy * 200}" '
            f'x2="{x + dx * r}" y2="{y + dy * r}"/>')
    add(f'<circle class="fanhub" cx="{x}" cy="{y}" r="195"/>')
    add(f'<text class="fanlab" x="{x}" y="{y + 62}">{F["id"]}</text>')
add('</g>')

# ----------------------------------------------------------- dimensions/grid
add(f'<line class="dimline" x1="0" y1="{H + 580}" x2="{W}" y2="{H + 580}"/>')
add(f'<text class="dimtxt" x="{W / 2}" y="{H + 460}">{fi(W)} OVERALL</text>')
add(f'<line class="dimline" x1="-580" y1="0" x2="-580" y2="{H}"/>')
add(f'<text class="dimtxt" x="-700" y="{H / 2}" transform="rotate(-90 -700 {H / 2})">'
    f'{fi(H)} OVERALL</text>')
step = int(round(5 * 12 * IN))          # 5'-0" grid
x = 0
while x <= W:
    add(f'<line class="grid" x1="{x}" y1="-250" x2="{x}" y2="-90"/>')
    add(f'<text class="gridtxt" x="{x}" y="-350">{int(round(x / IN / 12))}\'</text>')
    x += step
y = 0
while y <= H:
    add(f'<line class="grid" x1="-250" y1="{y}" x2="-90" y2="{y}"/>')
    add(f'<text class="gridtxt gl" x="-320" y="{y + 68}">{int(round(y / IN / 12))}\'</text>')
    y += step
add(f'<g class="nm" transform="translate({W - 460} -790)">'
    f'<line x1="0" y1="320" x2="0" y2="-130"/>'
    f'<path d="M0 -220 L105 55 L0 -25 L-105 55 Z"/><text x="0" y="520">N</text></g>')

svg = ('<svg id="plan" viewBox="' + f"{-ML} {-MT} {W + ML + MR} {H + MT + MB}" +
       '" xmlns="http://www.w3.org/2000/svg" role="img" '
       'aria-label="Ground floor lighting and ceiling fan plan">' + "".join(e) + '</svg>')

# ============================================================= schedule rows
crows = "".join(
    f"<tr><td>{esc(c['name'])}</td>"
    f"<td class='n'>{fi(c['Lmm'], False)} × {fi(c['Wmm'], False)}</td>"
    f"<td class='n'>{c['A'] * 10.7639:.0f}</td>"
    f"<td class='n'>{c['lux']}</td><td class='n dim'>{esc(c['isref'])}</td>"
    f"<td class='n'>{fi(c['hm'] * 1000)}</td>"
    f"<td class='n'>{c['k']:.2f}</td><td class='n'>{c['uf']:.2f}</td>"
    f"<td class='n'>{c['mf']:.2f}</td>"
    f"<td class='n dim'>{c['n_exact']:.2f}</td>"
    f"<td class='n hi'>{c['n']} × {c['watt']} W</td>"
    f"<td class='n'>{c['E']:.0f}</td></tr>" for c in C)

lrows = "".join(
    f"<tr><td class='id'>{L['id']}</td><td>{esc(ROOMS[L['room']]['name'])}</td>"
    f"<td class='n'>{L['w']} W · {L['lm']} lm</td>"
    f"<td class='n hi'>{L['ox_ft']}</td><td class='n hi'>{L['oy_ft']}</td>"
    f"<td class='n'>{L['z_ft']}</td><td class='n'>{L['cct']} K</td>"
    f"<td class='n'>{L['ip']}</td></tr>" for L in P["lights"])

frows = "".join(
    f"<tr><td class='id'>{F['id']}</td><td>{esc(ROOMS[F['room']]['name'])}</td>"
    f"<td class='n'>{NOMINAL.get(F['sweep'], F['sweep'])}</td>"
    f"<td class='n hi'>{F['ox_ft']}</td><td class='n hi'>{F['oy_ft']}</td>"
    f"<td class='n'>{F['z_ft']}</td><td class='n'>{F['rod_in']}</td>"
    f"<td class='n'>{F['blade_ft']}</td>"
    f"<td class='dim'>{esc(F['datum'])}</td></tr>" for F in P["fans"])

n_l = len(P["lights"])
w_l = sum(L["w"] for L in P["lights"])
n_f = len(P["fans"])
w_f = n_f * 32
area = sum(c["A"] for c in C)

html = f"""<title>Chandrasekhar GF Lighting Plan</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Condensed:wght@400;600;700&family=IBM+Plex+Sans:wght@400;500&family=IBM+Plex+Mono:wght@400;500;600&display=swap">
<style>
:root{{
  --paper:#F2EFE8; --paper2:#FBF9F4; --sheet:#FFFFFF;
  --ink:#1A1D21; --ink2:#474D55; --ink3:#79808A;
  --rule:#D6D0C4; --rule2:#E9E4DA;
  --anno:#B93227; --amber:#A9670A; --teal:#0C645F;
  /* drawing */
  --room:#FBF9F5; --wall:#2B3138; --wallln:#171B20; --halo:#FFFFFF;
  --wetfill:#EDF3F2; --outfill:#F8F2E7; --liftfill:#E7E4DD;
}}

@media (prefers-color-scheme:dark){{:root:not([data-theme="light"]){{
  --paper:#0C0E11; --paper2:#161A20; --sheet:#12161B;
  --ink:#E8EAEE; --ink2:#AFB7C0; --ink3:#7E8894;
  --rule:#272D35; --rule2:#1C2128;
  --anno:#FF8672; --amber:#F0B44E; --teal:#52D2C5;
  --room:#212832; --wall:#4E5764; --wallln:#8A94A1; --halo:#212832;
  --wetfill:#1B252C; --outfill:#28231A; --liftfill:#2B323B;
}}}}
:root[data-theme="dark"]{{
  --paper:#0C0E11; --paper2:#161A20; --sheet:#12161B;
  --ink:#E8EAEE; --ink2:#AFB7C0; --ink3:#7E8894;
  --rule:#272D35; --rule2:#1C2128;
  --anno:#FF8672; --amber:#F0B44E; --teal:#52D2C5;
  --room:#212832; --wall:#4E5764; --wallln:#8A94A1; --halo:#212832;
  --wetfill:#1B252C; --outfill:#28231A; --liftfill:#2B323B;
}}
*{{box-sizing:border-box}}
body{{margin:0;background:var(--paper);color:var(--ink);
  font-family:"IBM Plex Sans","Segoe UI",system-ui,sans-serif;font-size:14.5px;line-height:1.55;
  -webkit-font-smoothing:antialiased}}
.wrap{{max-width:1320px;margin:0 auto;padding:0 22px 72px}}

header{{border-bottom:2px solid var(--ink);margin-bottom:26px;padding:34px 0 16px;
  display:grid;grid-template-columns:1fr auto;gap:26px;align-items:end}}
header h1{{font-family:"IBM Plex Sans Condensed",sans-serif;font-weight:700;
  font-size:clamp(27px,4vw,44px);line-height:1.03;margin:0;letter-spacing:-.012em}}
.eyebrow{{font-family:"IBM Plex Sans Condensed",sans-serif;color:var(--anno);font-size:12.5px;
  font-weight:600;letter-spacing:.15em;text-transform:uppercase;margin:0 0 8px}}
.meta{{font-family:"IBM Plex Mono",monospace;font-size:11px;line-height:1.85;
  color:var(--ink2);text-align:right;white-space:nowrap}}
.meta b{{color:var(--ink);font-weight:500}}

.stats{{display:grid;grid-template-columns:repeat(auto-fit,minmax(132px,1fr));gap:1px;
  background:var(--rule);border:1px solid var(--rule);margin:0 0 24px;border-radius:3px;
  overflow:hidden}}
.stat{{background:var(--paper2);padding:12px 15px}}
.stat .k{{font-family:"IBM Plex Sans Condensed",sans-serif;font-size:10px;letter-spacing:.13em;
  text-transform:uppercase;color:var(--ink3)}}
.stat .v{{font-family:"IBM Plex Mono",monospace;font-size:21px;font-weight:600;
  font-variant-numeric:tabular-nums;line-height:1.3}}
.stat .v small{{font-size:11.5px;font-weight:400;color:var(--ink2)}}

.rail{{display:flex;gap:7px;margin:0 0 12px;align-items:center}}
.rail .lbl{{font-family:"IBM Plex Sans Condensed",sans-serif;font-size:10px;letter-spacing:.13em;
  text-transform:uppercase;color:var(--ink3);margin-right:4px}}
.tog{{display:inline-flex;align-items:center;gap:7px;cursor:pointer;border:1px solid var(--rule);
  background:var(--paper2);border-radius:999px;padding:5px 13px 5px 10px;font-size:12.5px;
  font-family:"IBM Plex Sans Condensed",sans-serif;color:var(--ink2);
  transition:border-color .12s,color .12s,background .12s}}
.tog input{{position:absolute;opacity:0;width:0;height:0}}
.tog .sw{{width:11px;height:11px;border-radius:3px;background:currentColor;opacity:.28}}
.tog:has(input:checked){{color:var(--ink);border-color:var(--ink3);background:var(--sheet)}}
.tog:has(input:checked) .sw{{opacity:1}}
.tog:has(input:focus-visible){{outline:2px solid var(--anno);outline-offset:2px}}
.tog.t-light{{color:var(--amber)}} .tog.t-fan{{color:var(--teal)}}

.sheet{{background:var(--sheet);border:1px solid var(--rule);border-radius:4px;padding:14px;
  overflow-x:auto;box-shadow:0 1px 0 var(--rule2) inset}}
svg#plan{{display:block;width:100%;min-width:860px;height:auto}}
.poche{{fill:var(--wall);stroke:var(--wallln);stroke-width:16}}
.rm{{fill:var(--room)}}
.rm-wet{{fill:var(--wetfill)}} .rm-out{{fill:var(--outfill)}}
.rm-lift{{fill:var(--liftfill)}}
.op-window{{fill:var(--room);stroke:var(--wallln);stroke-width:26}}
.op-door{{fill:var(--room);stroke:var(--anno);stroke-width:26;stroke-dasharray:150 90}}
.rlab{{font-family:"IBM Plex Sans Condensed",sans-serif;font-weight:700;fill:var(--anno);
  text-anchor:middle;letter-spacing:.05em}}
.rdim{{font-family:"IBM Plex Mono",monospace;fill:var(--anno);text-anchor:middle;opacity:.72}}
.fx{{fill:var(--amber);fill-opacity:.22;stroke:var(--amber);stroke-width:40}}
.fxc{{stroke:var(--amber);stroke-width:32}}
.fxlab{{font-family:"IBM Plex Mono",monospace;font-size:152px;font-weight:600;fill:var(--amber);
  text-anchor:middle}}
.fansweep{{fill:var(--teal);fill-opacity:.07;stroke:var(--teal);stroke-width:28;
  stroke-dasharray:170 110}}
.fanhub{{fill:var(--room);stroke:var(--teal);stroke-width:46}}
.fanblade{{stroke:var(--teal);stroke-width:46;stroke-linecap:round;opacity:.8}}
.fanlab{{font-family:"IBM Plex Mono",monospace;font-size:150px;font-weight:600;fill:var(--teal);
  text-anchor:middle}}
.dimline{{stroke:var(--ink3);stroke-width:14}}
.dimtxt{{font-family:"IBM Plex Mono",monospace;font-size:168px;fill:var(--ink2);
  text-anchor:middle;letter-spacing:.08em}}
.grid{{stroke:var(--ink3);stroke-width:12}}
.gridtxt{{font-family:"IBM Plex Mono",monospace;font-size:132px;fill:var(--ink3);
  text-anchor:middle}}
.gridtxt.gl{{text-anchor:end}}
.nm line{{stroke:var(--ink2);stroke-width:26}} .nm path{{fill:var(--ink2)}}
.nm text{{font-family:"IBM Plex Sans Condensed",sans-serif;font-weight:700;font-size:225px;
  fill:var(--ink2);text-anchor:middle}}
.rlab,.rdim,.fxlab,.fanlab{{paint-order:stroke fill;stroke:var(--halo);
  stroke-width:84;stroke-linejoin:round}}
.dimtxt,.gridtxt{{paint-order:stroke fill;stroke:var(--sheet);stroke-width:80;
  stroke-linejoin:round}}
.rlab{{stroke-width:98}}
body.h-light .lyr-light,body.h-fan .lyr-fan{{display:none}}
.cap{{font-family:"IBM Plex Mono",monospace;font-size:11px;color:var(--ink3);margin:10px 2px 0}}

section{{margin-top:46px}}
h2{{font-family:"IBM Plex Sans Condensed",sans-serif;font-weight:700;font-size:22px;margin:0;
  padding-bottom:8px;border-bottom:1px solid var(--ink);display:flex;align-items:baseline;
  justify-content:space-between;gap:14px}}
h2 .n{{font-family:"IBM Plex Mono",monospace;font-size:11px;color:var(--ink3);font-weight:400;
  letter-spacing:.08em;text-transform:uppercase}}
.note{{color:var(--ink2);margin:12px 0 16px;max-width:78ch;font-size:14px}}
.tblwrap{{overflow-x:auto;border:1px solid var(--rule);border-radius:3px;background:var(--paper2)}}
table{{border-collapse:collapse;width:100%;font-size:12.5px;min-width:700px}}
th{{font-family:"IBM Plex Sans Condensed",sans-serif;font-size:10px;font-weight:600;
  letter-spacing:.1em;text-transform:uppercase;color:var(--ink3);text-align:left;
  padding:9px 11px;border-bottom:1px solid var(--rule);background:var(--sheet);white-space:nowrap}}
th.n{{text-align:right}}
td{{padding:7px 11px;border-bottom:1px solid var(--rule2)}}
tr:last-child td{{border-bottom:none}}
td.n{{font-family:"IBM Plex Mono",monospace;font-variant-numeric:tabular-nums;
  white-space:nowrap;text-align:right}}
td.id{{font-family:"IBM Plex Mono",monospace;font-weight:600;color:var(--anno);text-align:left}}
td.hi{{color:var(--ink);font-weight:600}}
td.dim{{color:var(--ink3)}}
tbody tr:hover td{{background:var(--sheet)}}
.key{{margin:10px 2px 0;font-size:12.5px;color:var(--ink3);max-width:96ch}}
.key b{{color:var(--ink2);font-weight:600}}
.eq{{font-family:"IBM Plex Mono",monospace;font-size:13.5px;color:var(--ink);
  background:var(--paper2);border:1px solid var(--rule);border-radius:3px;
  padding:9px 13px;display:inline-block;margin:2px 0 14px}}
@media (prefers-reduced-motion:reduce){{*{{transition:none!important}}}}
@media (max-width:700px){{header{{grid-template-columns:1fr}}.meta{{text-align:left}}}}
</style>

<div class="wrap">
<header>
  <div>
    <p class="eyebrow">Ground Floor &middot; Lighting &amp; Ceiling Fan Layout</p>
    <h1>Chandrasekhar Residence</h1>
  </div>
  <div class="meta">
    <b>Mr Chandrasekhar Family Residence, Anantapur</b><br>
    Ceiling &nbsp; <b>{fi(SOFFIT)} bare RCC, no false ceiling</b><br>
    Measure from &nbsp; <b>inside face of N and W walls of each room</b>
  </div>
</header>

<div class="stats">
  <div class="stat"><div class="k">Light points</div><div class="v">{n_l}</div></div>
  <div class="stat"><div class="k">Lighting load</div><div class="v">{w_l} <small>W</small></div></div>
  <div class="stat"><div class="k">Ceiling fans</div><div class="v">{n_f} <small>BLDC</small></div></div>
  <div class="stat"><div class="k">Fan load</div><div class="v">{w_f} <small>W</small></div></div>
  <div class="stat"><div class="k">Power density</div><div class="v">{w_l / area:.1f} <small>W/m&sup2;</small></div></div>
</div>

<div class="rail">
  <span class="lbl">Layers</span>
  <label class="tog t-light"><input type="checkbox" data-l="light" checked><span class="sw"></span>Lighting</label>
  <label class="tog t-fan"><input type="checkbox" data-l="fan" checked><span class="sw"></span>Fans</label>
</div>

<div class="sheet">{svg}</div>
<p class="cap">Grid at 5'-0" from the north-west corner. Hover any fitting for its setting out.
Do not scale &mdash; work from the schedules.</p>

<section>
  <h2>Light points <span class="n">{n_l} points &middot; {w_l} W</span></h2>
  <p class="note">Surface LED panels on the bare slab. Measure to the <b>centre</b> of the
  fitting from the inside face of the north wall and the west wall of that room. Check the
  soffit column &mdash; it drops where the first-floor sunken slab sits above.</p>
  <div class="tblwrap"><table>
    <thead><tr><th>Ref</th><th>Room</th><th class="n">Fitting</th>
      <th class="n">From W wall</th><th class="n">From N wall</th>
      <th class="n">Soffit AFF</th><th class="n">CCT</th><th class="n">IP</th></tr></thead>
    <tbody>{lrows}</tbody>
  </table></div>
</section>

<section>
  <h2>Ceiling fans <span class="n">{n_f} hooks &middot; BLDC</span></h2>
  <p class="note">48" sweep, 24" downrod, blade at {P["fans"][0]["blade_ft"]} from the floor.
  <b>Do not use the short rod that comes in the box</b> &mdash; under a {fi(SOFFIT)} ceiling
  the blades sit too close to the slab and the fan barely moves air.</p>
  <div class="tblwrap"><table>
    <thead><tr><th>Ref</th><th>Room</th><th class="n">Sweep</th>
      <th class="n">From W wall</th><th class="n">From N wall</th><th class="n">Soffit</th>
      <th class="n">Downrod</th><th class="n">Blade level</th><th>Measured from</th></tr></thead>
    <tbody>{frows}</tbody>
  </table></div>
</section>

<section>
  <h2>How the count was worked out <span class="n">IS 3646 Part 1</span></h2>
  <p class="note">Each room needs a set light level in lux. The number of fittings is:</p>
  <p class="eq">fittings &nbsp;=&nbsp; (lux needed &times; room area) &nbsp;&divide;&nbsp;
  (lumens per fitting &times; UF &times; MF)</p>
  <p class="note">Our ceiling is {fi(SOFFIT)} and there is no false ceiling, so the fittings
  are far from the floor and <b>UF is only 0.38 to 0.53</b> &mdash; less than half the lamp's
  light lands where you need it. That is why the counts are what they are. A false ceiling at
  9'-0" would need fewer fittings for the same lux.</p>
  <div class="tblwrap"><table>
    <thead><tr><th>Space</th><th class="n">Size</th><th class="n">Area sft</th>
      <th class="n">Lux needed</th><th class="n">IS min</th><th class="n">Mounting ht</th>
      <th class="n">Room index</th><th class="n">UF</th><th class="n">MF</th>
      <th class="n">Exact</th><th class="n">Fittings</th><th class="n">Lux you get</th></tr></thead>
    <tbody>{crows}</tbody>
  </table></div>
  <p class="key"><b>Mounting ht</b> fitting to table-top level, not to floor &nbsp;&middot;&nbsp;
  <b>Room index</b> room size compared with that height &nbsp;&middot;&nbsp;
  <b>UF</b> share of the lamp's light reaching the working level &nbsp;&middot;&nbsp;
  <b>MF</b> allowance for dust and ageing, 0.75 normally and 0.70 in kitchen, bathrooms and
  utility &nbsp;&middot;&nbsp; <b>Exact</b> what the formula gives, rounded up to a whole
  fitting. Hall and Dining are one open space, so they are counted together.</p>
</section>
</div>
<script>
document.querySelectorAll('.rail input').forEach(function(i){{
  i.addEventListener('change',function(){{
    document.body.classList.toggle('h-'+i.dataset.l,!i.checked);
  }});
}});
</script>
"""

path = os.path.join(HERE, "gf-ceiling-plan.html")
open(path, "w", encoding="utf-8").write(html)
print(f"wrote {path} ({len(html) // 1024} KB) — {n_l} lights, {n_f} fans")
