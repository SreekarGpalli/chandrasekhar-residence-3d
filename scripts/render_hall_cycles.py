# Headless photoreal render of the FF hall / media wall.
# blender -b --factory-startup -P render_hall.py -- <outdir> <samples> <scale%> <views,comma> [night]
import bpy, sys, json, math, os
from mathutils import Vector, Euler

argv = sys.argv[sys.argv.index('--') + 1:]
OUT, SAMPLES, SCALE = argv[0], int(argv[1]), int(argv[2])
VIEWS = argv[3].split(',')
NIGHT = len(argv) > 4 and argv[4] == 'night'
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'render')

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=os.path.join(SRC, 'hall.glb'))
sc = bpy.context.scene

# ---------------- render settings ----------------
sc.render.engine = 'CYCLES'
cy = sc.cycles
prefs = bpy.context.preferences.addons['cycles'].preferences
for dt in ('OPTIX', 'CUDA'):
    try:
        prefs.compute_device_type = dt
        prefs.get_devices()
        if any(d.type == dt for d in prefs.devices):
            break
    except TypeError:
        pass
for d in prefs.devices:
    d.use = d.type != 'CPU'
cy.device = 'GPU'
cy.samples = SAMPLES
cy.use_denoising = True
cy.max_bounces = 10; cy.diffuse_bounces = 5; cy.glossy_bounces = 4; cy.transmission_bounces = 8
cy.caustics_reflective = False; cy.caustics_refractive = False
cy.sample_clamp_indirect = 8.0
sc.view_settings.view_transform = 'AgX'
try:
    sc.view_settings.look = 'AgX - Base Contrast'
except TypeError:
    pass
sc.view_settings.exposure = 0.0 if NIGHT else 0.3
print('devices:', [(d.name, d.type, d.use) for d in prefs.devices], prefs.compute_device_type)

# ---------------- materials ----------------
def base(m):
    return m.name.split('.')[0]

def bsdf(m):
    return next((n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)

def inp(b, *names):
    for n in names:
        if n in b.inputs:
            return b.inputs[n]
    return None

def setv(b, name, v):
    i = inp(b, name)
    if i is not None:
        i.default_value = v

def coord(nt):
    tc = nt.nodes.new('ShaderNodeTexCoord')
    return tc.outputs['Object']

def marble(m, b):
    nt = m.node_tree; L = nt.links
    co = coord(nt)
    br = nt.nodes.new('ShaderNodeTexBrick')        # 800 mm tiles, 2 mm grout
    br.inputs['Scale'].default_value = 1.0
    br.inputs['Mortar Size'].default_value = 0.0025
    br.inputs['Brick Width'].default_value = 0.8
    br.inputs['Row Height'].default_value = 0.8
    br.offset = 0.0
    br.inputs['Color1'].default_value = (0.86, 0.84, 0.80, 1)
    br.inputs['Color2'].default_value = (0.83, 0.81, 0.77, 1)
    br.inputs['Mortar'].default_value = (0.55, 0.53, 0.50, 1)
    L.new(co, br.inputs['Vector'])
    nz = nt.nodes.new('ShaderNodeTexNoise')       # veins = thin iso-lines of noise
    nz.inputs['Scale'].default_value = 2.2
    nz.inputs['Detail'].default_value = 8
    nz.inputs['Distortion'].default_value = 3.0
    L.new(co, nz.inputs['Vector'])
    sub = nt.nodes.new('ShaderNodeMath'); sub.operation = 'SUBTRACT'; sub.inputs[1].default_value = 0.5
    ab = nt.nodes.new('ShaderNodeMath'); ab.operation = 'ABSOLUTE'
    L.new(nz.outputs['Fac'], sub.inputs[0]); L.new(sub.outputs[0], ab.inputs[0])
    cr = nt.nodes.new('ShaderNodeValToRGB')
    cr.color_ramp.elements[0].position = 0.0; cr.color_ramp.elements[0].color = (0.70, 0.69, 0.68, 1)
    cr.color_ramp.elements[1].position = 0.018; cr.color_ramp.elements[1].color = (1, 1, 1, 1)
    L.new(ab.outputs[0], cr.inputs['Fac'])
    mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'; mix.blend_type = 'MULTIPLY'
    mix.inputs['Factor'].default_value = 1.0
    L.new(br.outputs['Color'], mix.inputs[6]); L.new(cr.outputs['Color'], mix.inputs[7])
    L.new(mix.outputs[2], inp(b, 'Base Color'))
    setv(b, 'Roughness', 0.12)

def wood(m, b, dark, light, scale=55.0):
    # straight grain: fine bands across Z (horizontal lines on the console),
    # lightly distorted, plus a slow noise for board-to-board tone
    nt = m.node_tree; L = nt.links
    co = coord(nt)
    wv = nt.nodes.new('ShaderNodeTexWave')
    wv.wave_type = 'BANDS'; wv.bands_direction = 'Z'
    wv.inputs['Scale'].default_value = scale
    wv.inputs['Distortion'].default_value = 2.2
    wv.inputs['Detail'].default_value = 3.0
    L.new(co, wv.inputs['Vector'])
    cr = nt.nodes.new('ShaderNodeValToRGB')
    cr.color_ramp.elements[0].color = dark + (1,)
    cr.color_ramp.elements[1].color = light + (1,)
    L.new(wv.outputs['Fac'], cr.inputs['Fac'])
    L.new(cr.outputs['Color'], inp(b, 'Base Color'))
    setv(b, 'Roughness', 0.42)

def emissive(b, col, strength):
    i = inp(b, 'Emission Color', 'Emission')
    if i is not None:
        i.default_value = col + (1,)
    setv(b, 'Emission Strength', strength)

WARM = (1.0, 0.80, 0.58) if NIGHT else (1.0, 0.88, 0.75)   # 3000 K at night, ~3500 K by day
for m in bpy.data.materials:
    if not m.use_nodes:
        continue
    b = bsdf(m)
    if b is None:
        continue
    k = base(m)
    try:
        m.blend_method = 'OPAQUE'
    except Exception:
        pass
    if k in ('tLiving', 'tCirc', 'tKitch', 'tOffice'):
        marble(m, b)
    elif k == 'walnutI':
        wood(m, b, (0.11, 0.05, 0.025), (0.22, 0.11, 0.055))
    elif k in ('oakDark',):
        wood(m, b, (0.08, 0.05, 0.03), (0.20, 0.13, 0.08))
    elif k in ('oak', 'woodF', 'woodD'):
        wood(m, b, (0.42, 0.30, 0.18), (0.56, 0.42, 0.27), 40.0)
    elif k == 'paintNavy':
        setv(b, 'Roughness', 0.82)
    elif k in ('lacqNavy', 'lacqNavyDk'):
        setv(b, 'Roughness', 0.32)
        setv(b, 'Coat Weight', 0.25); setv(b, 'Coat Roughness', 0.25)
    elif k in ('white', 'white2', 'fin', 'fin2', 'skirt'):
        setv(b, 'Roughness', 0.9)
    elif k in ('linen', 'linenDk', 'curtain', 'duvet', 'boucle', 'rugW', 'rugD'):
        setv(b, 'Roughness', 1.0); setv(b, 'Sheen Weight', 0.6)
    elif k == 'curtain2':                       # linen drum shades: glow from within
        setv(b, 'Roughness', 1.0); setv(b, 'Transmission Weight', 0.35)
        setv(b, 'Sheen Weight', 0.4)
    elif k in ('brassI', 'brass'):
        inp(b, 'Base Color').default_value = (0.80, 0.56, 0.26, 1)
        setv(b, 'Metallic', 1.0); setv(b, 'Roughness', 0.26)
    elif k in ('steel', 'liftSteel', 'chrome'):
        setv(b, 'Metallic', 1.0); setv(b, 'Roughness', 0.25)
    elif k in ('aluDark', 'alu'):
        setv(b, 'Metallic', 0.9); setv(b, 'Roughness', 0.35)
    elif k == 'blackM':
        setv(b, 'Metallic', 0.6); setv(b, 'Roughness', 0.42)
    elif k == 'tv':
        inp(b, 'Base Color').default_value = (0.006, 0.006, 0.007, 1)
        setv(b, 'Roughness', 0.06); setv(b, 'Metallic', 0.0)
    elif k in ('glass', 'carGlass'):
        setv(b, 'Transmission Weight', 1.0); setv(b, 'Roughness', 0.0); setv(b, 'IOR', 1.45)
        setv(b, 'Alpha', 1.0)
        inp(b, 'Base Color').default_value = (0.92, 0.95, 0.95, 1)
    elif k == 'lamp':
        emissive(b, WARM, 30.0 if NIGHT else 18.0)
    elif k == 'coveLED':
        emissive(b, (1.0, 0.86, 0.66), 5.0)
    elif k == 'downlight':
        emissive(b, WARM, 20.0)
    elif k in ('travertine', 'marbleV', 'quartz'):
        setv(b, 'Roughness', 0.35)
    elif k == 'ceramic':
        setv(b, 'Roughness', 0.3)

# ---------------- world + sun ----------------
world = bpy.data.worlds.new('sky'); sc.world = world
world.use_nodes = True
wn = world.node_tree
bg = next(n for n in wn.nodes if n.type == 'BACKGROUND')
sky = wn.nodes.new('ShaderNodeTexSky')
types = [i.identifier for i in bpy.types.ShaderNodeTexSky.bl_rna.properties['sky_type'].enum_items]
for t in ('MULTIPLE_SCATTERING', 'NISHITA', 'SINGLE_SCATTERING', 'HOSEK_WILKIE'):
    if t in types:
        sky.sky_type = t; break
try:
    sky.sun_elevation = math.radians(-8 if NIGHT else 38)
    sky.sun_rotation = math.radians(115)
except AttributeError:
    pass
wn.links.new(sky.outputs['Color'], bg.inputs['Color'])
bg.inputs['Strength'].default_value = 0.02 if NIGHT else 0.9

if not NIGHT:
    sun = bpy.data.lights.new('sun', 'SUN'); sun.energy = 3.5; sun.angle = math.radians(0.6)
    sun.color = (1.0, 0.96, 0.90)
    so = bpy.data.objects.new('sun', sun); sc.collection.objects.link(so)
    so.rotation_euler = Euler((math.radians(52), 0, math.radians(115 + 180)), 'XYZ')

# ---------------- interior fixtures as real lights ----------------
lights = json.load(open(os.path.join(SRC, 'lights.json')))
for i, l in enumerate(lights):
    p = Vector((l['x'], -l['z'], l['y']))
    ld = bpy.data.lights.new('fx%d' % i, 'POINT')
    w = l.get('i', 1.0)
    ld.energy = (55 if NIGHT else 35) * w
    ld.color = WARM if l.get('warm', True) else (1, 0.95, 0.9)
    ld.shadow_soft_size = 0.06
    o = bpy.data.objects.new('fx%d' % i, ld); sc.collection.objects.link(o)
    o.location = p
print('lights:', len(lights))

# ---------------- cameras ----------------
CAMS = {
    #          location (x east, y north, z up)   pitch  yaw   lens  res
    'hero':   ((7.13, 5.30, 5.30), 21, 0, 15, (1600, 2000)),   # seated on the sofa
    'tv':     ((7.13, 6.25, 5.25), -1, 0, 26, (2000, 1400)),
    'detail': ((6.25, 7.15, 5.55), 34, -30, 24, (1600, 2000)),
    'sf':     ((7.13, 5.45, 9.05), -4, 0, 17, (2000, 1400)),
    'side':   ((5.05, 5.80, 5.65), 6, -42, 18, (2000, 1400)),
}
os.makedirs(OUT, exist_ok=True)
for v in VIEWS:
    loc, pitch, yaw, lens, res = CAMS[v]
    cd = bpy.data.cameras.new(v); cd.lens = lens; cd.sensor_width = 36
    cd.clip_start = 0.05; cd.clip_end = 400
    co = bpy.data.objects.new(v, cd); sc.collection.objects.link(co)
    co.location = loc
    co.rotation_euler = Euler((math.radians(90 + pitch), 0, math.radians(yaw)), 'XYZ')
    sc.camera = co
    sc.render.resolution_x, sc.render.resolution_y = res
    sc.render.resolution_percentage = SCALE
    sc.render.image_settings.file_format = 'JPEG'
    sc.render.image_settings.quality = 92
    sc.render.filepath = os.path.join(OUT, v + ('_night' if NIGHT else '') + '.jpg')
    bpy.ops.render.render(write_still=True)
    print('wrote', sc.render.filepath)
