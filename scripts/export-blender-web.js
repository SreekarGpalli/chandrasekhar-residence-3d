// Utility script to re-export the Blender web GLB from Chandrasekhar_Residence.blend
// Run: node scripts/export-blender-web.js

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BLENDER_DIR = path.join(ROOT, 'Blender');
const BLEND_FILE = path.join(BLENDER_DIR, 'Chandrasekhar_Residence.blend');
const EXPORT_SCRIPT = path.join(BLENDER_DIR, 'export_realism.py');
const OUTPUT_GLB = path.join(BLENDER_DIR, 'chandrasekhar_residence_web.glb');

function findBlender() {
  // Check common Windows installation paths first
  const base = 'C:\\Program Files\\Blender Foundation';
  if (fs.existsSync(base)) {
    const dirs = fs.readdirSync(base).sort().reverse();
    for (const d of dirs) {
      const exe = path.join(base, d, 'blender.exe');
      if (fs.existsSync(exe)) return exe;
    }
  }
  // Try PATH
  const which = spawnSync('where', ['blender'], { encoding: 'utf-8' });
  if (which.status === 0 && which.stdout) {
    const first = which.stdout.split(/\r?\n/)[0].trim();
    if (first && fs.existsSync(first)) return first;
  }
  return 'blender';
}

console.log('--- Chandrasekhar Residence: Blender Web GLB Export ---');
if (!fs.existsSync(BLEND_FILE)) {
  console.error('Error: Blend file not found at:', BLEND_FILE);
  process.exit(1);
}

const blenderExe = findBlender();
console.log('Using Blender executable:', blenderExe);
console.log('Source blend:', BLEND_FILE);
console.log('Exporting Draco-compressed web GLB...');

const args = [
  '-b', BLEND_FILE,
  '--python', EXPORT_SCRIPT,
  '--', '--web'
];

const res = spawnSync(blenderExe, args, { stdio: 'inherit', cwd: BLENDER_DIR });
if (res.status !== 0) {
  console.error('\nExport failed with code:', res.status);
  process.exit(res.status || 1);
}

if (fs.existsSync(OUTPUT_GLB)) {
  const stat = fs.statSync(OUTPUT_GLB);
  console.log('\n✓ Export complete!');
  console.log(`  File: ${OUTPUT_GLB}`);
  console.log(`  Size: ${(stat.size / (1024 * 1024)).toFixed(2)} MB`);
  console.log('  Web delivery ready for GitHub and Vercel.');
} else {
  console.error('\nWarning: Export exited 0 but output file not found at:', OUTPUT_GLB);
}
