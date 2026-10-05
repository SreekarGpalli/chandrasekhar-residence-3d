"""
setup_blender_scene.py
Organizes a FRESH GLB import of the Chandrasekhar Residence in Blender.

Do NOT run this on Chandrasekhar_Residence.blend after the realism pass —
it would replace packed PBR materials with flat palette colors.

- Hierarchical collections
- Principled BSDF calibration from the houseScene.js palette
- Nishita sky for Anantapur daylight
- Camera bookmarks
- Save next to the current .blend (with a timestamped backup)
"""

import bpy
import math
import os
import shutil
from datetime import datetime
from mathutils import Vector, Euler

TILE_KEYS = {
    'tLiving', 'tBed', 'tBath', 'tKitch', 'tUtil', 'tCirc',
    'tOffice', 'tPooja', 'tWalk', 'balcTile', 'terraceF'
}

def hex_to_rgb(hex_val):
    r = ((hex_val >> 16) & 255) / 255.0
    g = ((hex_val >> 8) & 255) / 255.0
    b = (hex_val & 255) / 255.0
    # Convert sRGB to Linear for Blender shaders
    def to_linear(c):
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return (to_linear(r), to_linear(g), to_linear(b), 1.0)

# Palette from houseScene.js
PALETTE = {
    'white':       hex_to_rgb(0xece7db),
    'white2':      hex_to_rgb(0xf3efe6),
    'fin':         hex_to_rgb(0xd6c9ae),
    'fin2':        hex_to_rgb(0xded2b8),
    'sand':        hex_to_rgb(0xd2cdc4),
    'stone':       hex_to_rgb(0xd0cbc3),
    'charcoal':    hex_to_rgb(0x9c9b98),
    'charDark':    hex_to_rgb(0x8f8e8b),
    'plinth':      hex_to_rgb(0xb7ae9d),
    'frame':       hex_to_rgb(0x585349),
    'glass':       hex_to_rgb(0x8ea3af),
    'walnut':      hex_to_rgb(0x9c7748),
    'ms':          hex_to_rgb(0x8a8986),
    'brass':       hex_to_rgb(0xc0a06a),
    'steel':       hex_to_rgb(0xd2d6da),
    'paver':       hex_to_rgb(0x878178),
    'paver2':      hex_to_rgb(0x777168),
    'concrete':    hex_to_rgb(0x706d68),
    'terraceF':    hex_to_rgb(0x706d69),
    'balcTile':    hex_to_rgb(0x706d67),
    'solar':       hex_to_rgb(0x2a3038),
    'solarFrm':    hex_to_rgb(0x3a3530),
    'tank':        hex_to_rgb(0xece7dc),
    'green':       hex_to_rgb(0x4c6838),
    'green2':      hex_to_rgb(0x607d45),
    'boug':        hex_to_rgb(0xc44f86),
    'ixora':       hex_to_rgb(0xe16b39),
    'grass':       hex_to_rgb(0x55703f),
    'leafDark':    hex_to_rgb(0x2d4a28),
    'leafLight':   hex_to_rgb(0x6b8c3e),
    'bark':        hex_to_rgb(0x3d2e1f),
    'barkLight':   hex_to_rgb(0x6e5a42),
    'flowerPink':  hex_to_rgb(0xe0749a),
    'ground':      hex_to_rgb(0x9a9078),
    'plotPad':     hex_to_rgb(0xa2977f),
    'tLiving':     hex_to_rgb(0xd8d2c4),
    'tBed':        hex_to_rgb(0xddd6c8),
    'tBath':       hex_to_rgb(0xc8c6c2),
    'tKitch':      hex_to_rgb(0xd4cec0),
    'tUtil':       hex_to_rgb(0xc8c4bc),
    'tCirc':       hex_to_rgb(0xd4cec1),
    'tOffice':     hex_to_rgb(0xd4cebf),
    'tPooja':      hex_to_rgb(0xe2d8c4),
    'tWalk':       hex_to_rgb(0xd8d2c5),
    'fabric':      hex_to_rgb(0xc4bbae),
    'fabric2':     hex_to_rgb(0x8a847a),
    'woodF':       hex_to_rgb(0x5c4030),
    'woodD':       hex_to_rgb(0x3e2c20),
    'mattress':    hex_to_rgb(0xeee8dc),
    'pillow':      hex_to_rgb(0xf4efe6),
    'bedding':     hex_to_rgb(0xcfc9bc),
    'whiteG':      hex_to_rgb(0xf4efe7),
    'dark':        hex_to_rgb(0x2a2723),
    'tv':          hex_to_rgb(0x0b0c0d),
    'rug':         hex_to_rgb(0xb6a98d),
    'carBody':     hex_to_rgb(0x83888d),
    'carDark':     hex_to_rgb(0x1c1e20),
    'lamp':        hex_to_rgb(0xffd9a0),
    'liftDoor':    hex_to_rgb(0xc8ccd1),
    'counter':     hex_to_rgb(0xeee8dd),
    'counterTop':  hex_to_rgb(0x4a4540),
    'chrome':      hex_to_rgb(0xd8d2c3),
    'accentWarm':  hex_to_rgb(0xc39a66),
    'copingLight': hex_to_rgb(0xe6dfd1),
    'liftSteel':   hex_to_rgb(0xb8bdc2),
    'liftChrome':  hex_to_rgb(0xf0f2f4),
    'skirt':       hex_to_rgb(0x5f594f),
    'curtain':     hex_to_rgb(0xd4cec2),
    'curtain2':    hex_to_rgb(0xc4bbaf),
    'downlight':   hex_to_rgb(0xf4ead2),
    'road':        hex_to_rgb(0x3f4043),
    'roadLine':    hex_to_rgb(0xd8d5c8),
    'pave':        hex_to_rgb(0x8a867e),
    'soil':        hex_to_rgb(0x4a3b2d),
    'murtiGold':   hex_to_rgb(0xd4ad55),
    'murtiDark':   hex_to_rgb(0x2c2e32),
    'saffron':     hex_to_rgb(0xe08a30),
    'vermilion':   hex_to_rgb(0xd44532),
    'lotusPink':   hex_to_rgb(0xe08aaa),
    'peetaRed':    hex_to_rgb(0x9a3530),
    'eastPlaster': hex_to_rgb(0xece7db)
}

def organize_collections():
    print("Organizing collections...")
    scene = bpy.context.scene

    # Map groups to collection names
    col_map = {
        'site': '00_Site_and_Context',
        'context': '00_Site_and_Context',
        'garden': '01_Garden_Landscape',
        'floor0': '02_Ground_Floor',
        'outdoor0': '02_Ground_Floor',
        'floor1': '03_First_Floor',
        'outdoor1': '03_First_Floor',
        'floor2': '04_Second_Floor',
        'outdoor2': '04_Second_Floor',
        'exterior': '05_Exterior_Facade',
        'car': '06_Vehicles'
    }

    collections = {}
    for col_name in set(col_map.values()):
        col = bpy.data.collections.get(col_name)
        if not col:
            col = bpy.data.collections.new(col_name)
            scene.collection.children.link(col)
        collections[col_name] = col

    # Helper to find which group an object belongs to
    def get_group_owner(obj):
        curr = obj
        while curr:
            if curr.name in col_map:
                return col_map[curr.name]
            curr = curr.parent
        return None

    # Collect all objects to sort
    for obj in list(bpy.data.objects):
        target_col_name = get_group_owner(obj)
        if target_col_name:
            target_col = collections[target_col_name]
            # Link to target if not already there
            if obj.name not in target_col.objects:
                target_col.objects.link(obj)
            # Unlink from other collections (except target)
            for c in list(obj.users_collection):
                if c != target_col:
                    c.objects.unlink(obj)

    # Clean up empty default collection
    default_col = bpy.data.collections.get('Collection')
    if default_col:
        if len(default_col.objects) == 0:
            bpy.data.collections.remove(default_col)

    print("Collections organized successfully.")

def setup_materials():
    print("Calibrating materials...")
    created_materials = {}

    for mat_key, color in PALETTE.items():
        mat_name = f"Mat_{mat_key}"
        mat = bpy.data.materials.get(mat_name)
        if not mat:
            mat = bpy.data.materials.new(name=mat_name)
            mat.use_nodes = True
        created_materials[mat_key] = mat

        bsdf = next((n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
        if not bsdf:
            continue

        bsdf.inputs['Base Color'].default_value = color

        # Material-specific tuning
        if mat_key == 'glass':
            # Glass shader
            if 'Transmission Weight' in bsdf.inputs:
                bsdf.inputs['Transmission Weight'].default_value = 0.95
            elif 'Transmission' in bsdf.inputs:
                bsdf.inputs['Transmission'].default_value = 0.95
            bsdf.inputs['Roughness'].default_value = 0.04
            bsdf.inputs['IOR'].default_value = 1.52
            mat.blend_method = 'BLEND' if hasattr(mat, 'blend_method') else 'OPAQUE'
            if hasattr(mat, 'shadow_method'):
                mat.shadow_method = 'NONE'

        elif mat_key in ['brass', 'murtiGold']:
            bsdf.inputs['Metallic'].default_value = 0.85
            bsdf.inputs['Roughness'].default_value = 0.25

        elif mat_key in ['steel', 'chrome', 'liftChrome', 'liftSteel']:
            bsdf.inputs['Metallic'].default_value = 0.92
            bsdf.inputs['Roughness'].default_value = 0.15

        elif mat_key == 'ms':
            bsdf.inputs['Metallic'].default_value = 0.55
            bsdf.inputs['Roughness'].default_value = 0.38

        elif mat_key in ['walnut', 'woodD', 'woodF']:
            bsdf.inputs['Metallic'].default_value = 0.0
            bsdf.inputs['Roughness'].default_value = 0.42

        elif mat_key in ['white', 'white2', 'eastPlaster', 'fin', 'fin2']:
            bsdf.inputs['Metallic'].default_value = 0.0
            bsdf.inputs['Roughness'].default_value = 0.88

        elif mat_key in ['frame', 'charcoal', 'charDark']:
            bsdf.inputs['Metallic'].default_value = 0.25
            bsdf.inputs['Roughness'].default_value = 0.55

        elif mat_key in TILE_KEYS:
            bsdf.inputs['Metallic'].default_value = 0.02
            bsdf.inputs['Roughness'].default_value = 0.28

        elif mat_key in ['paver', 'paver2', 'road', 'ground', 'concrete']:
            bsdf.inputs['Metallic'].default_value = 0.0
            bsdf.inputs['Roughness'].default_value = 0.92

        elif mat_key in ['fabric', 'fabric2', 'rug', 'curtain', 'curtain2', 'bedding', 'pillow']:
            bsdf.inputs['Metallic'].default_value = 0.0
            bsdf.inputs['Roughness'].default_value = 0.95

        elif mat_key in ['lamp', 'downlight']:
            if 'Emission Color' in bsdf.inputs:
                bsdf.inputs['Emission Color'].default_value = color
                bsdf.inputs['Emission Strength'].default_value = 3.0

    # Assign materials to meshes based on name key
    for obj in bpy.data.objects:
        if obj.type != 'MESH':
            continue
        # Skip car meshes (they keep original BMW baked textures)
        if 'BMW' in obj.name or (obj.parent and 'car' in obj.parent.name.lower()):
            continue

        parts = obj.name.split('_')
        if len(parts) >= 2:
            key = parts[1]
            if key in created_materials:
                target_mat = created_materials[key]
                if obj.data.materials:
                    obj.data.materials[0] = target_mat
                else:
                    obj.data.materials.append(target_mat)

    print("Materials calibrated and applied successfully.")

def setup_lighting():
    print("Setting up Sun and Sky lighting...")
    scene = bpy.context.scene

    # 1. Sun light
    sun_data = bpy.data.lights.get('Sun_Light')
    if not sun_data:
        sun_data = bpy.data.lights.new(name='Sun_Light', type='SUN')
    sun_data.energy = 4.0
    sun_data.angle = math.radians(1.2) # Soft shadow
    sun_data.color = (1.0, 0.97, 0.91)

    sun_obj = bpy.data.objects.get('Sun')
    if not sun_obj:
        sun_obj = bpy.data.objects.new(name='Sun', object_data=sun_data)
        scene.collection.objects.link(sun_obj)

    # Rotate Sun for East-facing facade with nice dramatic shadow (Azimuth ~120 deg, Elevation ~45 deg)
    sun_obj.rotation_euler = Euler((math.radians(50.0), math.radians(15.0), math.radians(-50.0)), 'XYZ')

    # 2. Sky environment in World
    world = scene.world
    if not world:
        world = bpy.data.worlds.new('World')
        scene.world = world
    world.use_nodes = True
    nt = world.node_tree
    nt.nodes.clear()

    bg_node = nt.nodes.new(type='ShaderNodeBackground')
    out_node = nt.nodes.new(type='ShaderNodeOutputWorld')
    out_node.location = (300, 0)
    bg_node.location = (0, 0)

    # Try Nishita Sky texture
    sky_node = nt.nodes.new(type='ShaderNodeTexSky')
    sky_node.location = (-300, 0)
    if hasattr(sky_node, 'sky_type'):
        sky_node.sky_type = 'MULTIPLE_SCATTERING'
        sky_node.sun_elevation = math.radians(45.0)
        sky_node.sun_rotation = math.radians(-50.0)
        sky_node.altitude = 350.0 # Anantapur elevation ~350m
        sky_node.air_density = 1.0
        if hasattr(sky_node, 'aerosol_density'):
            sky_node.aerosol_density = 1.2
        elif hasattr(sky_node, 'dust_density'):
            sky_node.dust_density = 1.2
        sky_node.ozone_density = 1.0

    nt.links.new(sky_node.outputs['Color'], bg_node.inputs['Color'])
    bg_node.inputs['Strength'].default_value = 1.0
    nt.links.new(bg_node.outputs['Background'], out_node.inputs['Surface'])

    print("Lighting setup complete.")

def setup_cameras():
    print("Setting up architectural cameras...")
    scene = bpy.context.scene

    cam_col = bpy.data.collections.get('07_Cameras_and_Lighting')
    if not cam_col:
        cam_col = bpy.data.collections.new('07_Cameras_and_Lighting')
        scene.collection.children.link(cam_col)

    # Move sun to Cam collection
    sun = bpy.data.objects.get('Sun')
    if sun and sun.name in scene.collection.objects:
        scene.collection.objects.unlink(sun)
        if sun.name not in cam_col.objects:
            cam_col.objects.link(sun)

    # Camera definitions: (name, pos, rot_euler, focal_length)
    # Residence center is around X=10, Y=-6, Z=5
    camera_defs = [
        (
            'Cam_Hero_East_Facade',
            Vector((29.0, -18.5, 9.5)),
            Euler((math.radians(72.0), 0.0, math.radians(52.0)), 'XYZ'),
            32.0
        ),
        (
            'Cam_Street_Level_Entry',
            Vector((25.5, -4.5, 1.7)),
            Euler((math.radians(85.0), 0.0, math.radians(75.0)), 'XYZ'),
            28.0
        ),
        (
            'Cam_Floor0_Living',
            Vector((18.5, -8.0, 2.0)),
            Euler((math.radians(82.0), 0.0, math.radians(65.0)), 'XYZ'),
            24.0
        ),
        (
            'Cam_Floor1_Balcony',
            Vector((16.8, -4.2, 5.4)),
            Euler((math.radians(82.0), 0.0, math.radians(68.0)), 'XYZ'),
            24.0
        ),
        (
            'Cam_Dollhouse_Overview',
            Vector((26.0, -26.0, 24.0)),
            Euler((math.radians(54.0), 0.0, math.radians(45.0)), 'XYZ'),
            45.0
        )
    ]

    for name, pos, rot, focal in camera_defs:
        cam_obj = bpy.data.objects.get(name)
        if not cam_obj:
            cam_data = bpy.data.cameras.new(name=name)
            cam_obj = bpy.data.objects.new(name=name, object_data=cam_data)
            cam_col.objects.link(cam_obj)
        else:
            cam_data = cam_obj.data

        cam_data.lens = focal
        cam_data.clip_start = 0.1
        cam_data.clip_end = 200.0
        cam_obj.location = pos
        cam_obj.rotation_euler = rot

    # Set default camera to Hero view
    hero_cam = bpy.data.objects.get('Cam_Hero_East_Facade')
    if hero_cam:
        scene.camera = hero_cam

    # Remove generic Camera if present
    old_cam = bpy.data.objects.get('Camera')
    if old_cam:
        bpy.data.objects.remove(old_cam, do_unlink=True)

    print("Cameras created and hero camera set as active.")

def is_realism_master():
    if bpy.data.objects.get('Realism_Hero_East') or bpy.data.collections.get('Realism | Plants'):
        return True
    for mat in bpy.data.materials:
        src = mat.get('source') if hasattr(mat, 'get') else None
        if src and 'polyhaven.com' in str(src):
            return True
    return False

def save_blend_file():
    filepath = bpy.data.filepath
    if not filepath:
        here = os.path.dirname(os.path.abspath(__file__))
        filepath = os.path.normpath(os.path.join(here, '..', 'Blender', 'Chandrasekhar_Residence.blend'))
    if os.path.exists(filepath):
        stamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup = filepath.replace('.blend', '_PreSetup_' + stamp + '.blend')
        shutil.copy2(filepath, backup)
        print('Backup written to', backup)
    bpy.ops.wm.save_as_mainfile(filepath=filepath)
    print('Master .blend saved to:', filepath)

def run_all():
    if is_realism_master():
        raise RuntimeError(
            'Refusing to run setup_blender_scene.py on the finished realism master. '
            'It would overwrite packed PBR materials. Import a fresh GLB first.'
        )
    organize_collections()
    setup_materials()
    setup_lighting()
    setup_cameras()
    save_blend_file()
    print('ALL STEPS COMPLETED!')

if __name__ == "__main__":
    run_all()
