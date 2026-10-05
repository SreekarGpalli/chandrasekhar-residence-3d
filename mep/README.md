# Ground Floor — Lighting & Ceiling Fans

Scope is general lighting and ceiling fans only. Task lighting (under-counter, wardrobe,
mirror, desk), AC, exhaust and all power wiring are outside this issue.

## Deliverables

| | |
|---|---|
| **GF-EL-01_Lighting-and-Fan-Layout.pdf** | Drawing set, 3 sheets, A2 landscape |
| — Sheet 01 | Layout plan 1:50, construction details 1–3, legend, general notes |
| — Sheet 02 | Luminaire type schedule, fan schedule, connected load, point schedule |
| — Sheet 03 | Illumination calculations, spacing and uniformity check, commentary |
| **GF-EL-SPEC_Specification.pdf** | A4 specification, 3 pages |
| `gf-ceiling-plan.html` | Same information as an interactive page |

```bash
python calc_lighting.py && python layout_points.py && python build_plan.py && python build_pdf.py
```

Everything is generated from `data/gf-geometry.json`, so the drawing, the schedules and the
calculations cannot drift apart.

## Setting out

All positions are **whole-inch offsets from the inside faces of the north and west walls of
that room** — the way it gets marked on site. Global mm co-ordinates are in the JSON if the
3D model needs them later.

| | |
|---|---|
| Floor to floor | 11'-0" (3353 mm) |
| Slab, S1 | 5½" (140 mm) |
| **Clear soffit** | **10'-6½" (3213 mm)** above GF FFL, bare RCC |
| Portico soffit | 12'-6" above the portico floor, which is 2'-0" lower |
| Beams | B1 9"×18" · B2/B3 9"×15" · B4 9"×12" · one concealed beam over Hall/Dining |

## Calculation basis

Lumen method to **IS 3646 (Part 1)**, NBC 2016 Part 8 Section 1:

```
N = (E × A) / (Φ × UF × MF)        K = LW / Hm(L+W)
```

Reflectances 0.70 ceiling / 0.50 walls / 0.20 floor. Maintenance factor 0.75 general,
0.70 wet and cooking, 0.65 portico, on a three-yearly cleaning cycle.

Surface mounting at 10'-6½" with no false ceiling is what drives the quantities: Hm works out
at 8'-1" in the habitable rooms, K at 0.7 to 1.1 and **UF at only 0.38 to 0.53**. A false
ceiling at 9'-0" would lift UF by about a fifth and reach the same lux with fewer fittings.

| Space | Size | Design lux | IS 3646 | Fittings | Achieved |
|---|---|---|---|---|---|
| Bedroom 02 | 15'-0" × 10'-5" | 125 | 100 min | 4 × 15 W | 137 |
| Master Bedroom | 15'-0" × 11'-3" | 125 | 100 min | 4 × 15 W | 131 |
| Hall + Dining | 14'-8" × 20'-8" | 150 | 150 | 6 × 18 W | 153 |
| Office / Study | 9'-8" × 14'-9" | 200 | 200 gen | 4 × 22 W | 213 |
| Kitchen | 9'-6" × 12'-5" | 200 | 200 gen | 4 × 18 W | 191 |
| Utility | 8'-2" × 6'-11" | 150 | 150 | 2 × 15 W | 152 |
| Handwash | 9'-1" × 5'-2" | 100 | 100 | 1 × 15 W | 98 |
| Common Bath | 5'-11" × 5'-2" | 100 | 100 | 1 × 15 W | 140 |
| Master Bath | 6'-1" × 6'-6" | 100 | 100 | 1 × 15 W | 109 |
| Lift Lobby | 4'-7" × 5'-6" | 150 | 150 lobby | 1 × 15 W | 183 |
| Portico | 12'-2" × 15'-5" | 70 | 70 covered | 2 × 24 W | 67 |

**30 fittings, 526 W over 1275 sft — 4.44 W/m².** NBC / ECBC-R benchmark is 5 to 8 W/m².
Rationalised to **six luminaire types** so the schedule can be ordered as it stands.

Hall and Dining are calculated as one open volume: there is no wall between them and the beam
on that line is a *concealed* beam, flush with the slab, so the ceiling is one unbroken
14'-8" × 20'-8" plane. The six fittings are a single 2 × 3 grid over the whole space.

Sheet 03 also carries a spacing and uniformity check — spacing to mounting height ratio
against the 1.50 maximum, and edge offset as a fraction of spacing. Every space passes.

## Layout logic

**Both bedrooms use a symmetric 2 × 2 grid**, deliberately not tuned to any one bed position.
The bed can sit against the south, west or north wall and the lighting still reads even. Fans
are on the true room centre.

**Bedroom 02 is the one room the structure interferes with**, and detail 3 on sheet 01 sections
it. A 9"×15" beam crosses 7'-0½" in from the north wall, carrying the first-floor staircase,
and the last 2'-8" strip sits under the first-floor bathroom's sunken slab at about 9'-6½".
The two light rows are set at 2'-4" and 8'-11" from the north wall, so **the beam falls in the
gap between them** and neither row lands on it.

**Office** — the grid is held north of the beam that crosses 10'-3" in from its north wall.
**Kitchen** — general lighting only, plain 2 × 2 grid, no fan. **Utility** — two fittings,
no fan.

## Fans

Six 48" BLDC fans on **24" downrods**, blade plane at 8'-3½" above floor. The stock 10" rod
would put the blades near 9'-6", too tight under a 10'-6½" ceiling to move air properly. The
portico fan takes a 36" rod and lands at 9'-3½" above the portico floor, clear of vehicles.

Every blade tip is at least 12" from a wall and no blade circle reaches a light point;
`layout_points.py` asserts both and fails loudly if a position is edited badly.

## To confirm

1. **Sunken slab depth** — assumed 12". Sets the soffit in Bedroom 02's south strip, both
   baths and the Handwash.
2. **Beam depths marked `?`** in `gf-geometry.json` — eleven could not be matched to a label
   with confidence. Get them off the structural engineer's marked-up print.
3. **Staircase** is not in this issue — the stairwell is open to the first floor, so its
   fittings hang off the FF or SF slab.
