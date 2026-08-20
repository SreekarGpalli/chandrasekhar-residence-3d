/**
 * Keep V1, V6, V14, V16, V17, V19, V21, V22.
 * Promote photoreal to the only page on V19 / V21 / V22.
 * Delete the other iteration folders and the study/photoreal splits.
 */
const fs = require('fs');
const path = require('path');

const ELEV = path.resolve(__dirname, '..', 'elevations');

const KEEP = [
  ['version-one', 'V1'],
  ['version-six', 'V6'],
  ['version-fourteen', 'V14'],
  ['version-sixteen', 'V16'],
  ['version-seventeen', 'V17'],
  ['version-nineteen', 'V19'],
  ['version-twenty-one', 'V21'],
  ['version-twenty-two', 'V22']
];

const DROP = [
  'version-two',
  'version-three',
  'version-four',
  'version-five',
  'version-seven',
  'version-eight',
  'version-nine',
  'version-ten',
  'version-eleven',
  'version-twelve',
  'version-thirteen',
  'version-fifteen',
  'version-eighteen',
  'version-twenty',
  'version-seventeen-real'
];

function navHtml(active) {
  const links = KEEP.map(([dir, lab]) => {
    const on = dir === active ? ' class="on"' : '';
    return `  <a href="../${dir}/"${on}>${lab}</a>`;
  });
  links.push('  <a href="../">All</a>');
  return links.join('\n');
}

function replaceNav(html, active) {
  return html.replace(
    /<nav id="nav"[^>]*>[\s\S]*?<\/nav>/,
    `<nav id="nav" aria-label="Elevation versions">\n${navHtml(active)}\n</nav>`
  );
}

// V19: photoreal (real.html) becomes the only page.
const v19 = path.join(ELEV, 'version-nineteen');
let v19html = fs.readFileSync(path.join(v19, 'real.html'), 'utf8');
v19html = v19html
  .replace(
    'Elevation · Version Nineteen · Photoreal · Chandrasekhar Residence',
    'Elevation · Version Nineteen · Chandrasekhar Residence'
  )
  .replace(
    'Photoreal exterior render of Version Nineteen — fully textured, screen-space GI, reflections, temporal accumulation.',
    'Exterior elevation — Version Nineteen. Photoreal pipeline (SSGI, SSR, temporal, filmic).'
  )
  .replace('VERSION NINETEEN · PHOTOREAL', 'VERSION NINETEEN');
v19html = replaceNav(v19html, 'version-nineteen');
fs.writeFileSync(path.join(v19, 'index.html'), v19html);
fs.unlinkSync(path.join(v19, 'real.html'));
console.log('V19 photoreal is now index.html');

// V21 / V22: drop study.html, simplify nav and titles.
for (const [dir, word, stampUnused] of [
  ['version-twenty-one', 'TWENTY-ONE'],
  ['version-twenty-two', 'TWENTY-TWO']
]) {
  const dest = path.join(ELEV, dir);
  const study = path.join(dest, 'study.html');
  if (fs.existsSync(study)) {
    fs.unlinkSync(study);
    console.log('removed', path.relative(ELEV, study));
  }
  let html = fs.readFileSync(path.join(dest, 'index.html'), 'utf8');
  html = html
    .replace(
      /Elevation · Version Twenty-(One|Two) · Photoreal · Chandrasekhar Residence/,
      `Elevation · Version Twenty-${dir.endsWith('one') ? 'One' : 'Two'} · Chandrasekhar Residence`
    )
    .replace(
      /Photoreal exterior render of Version Twenty-(One|Two) — V19 pipeline \(SSGI, SSR, temporal, filmic\)\. Open canvas\./,
      `Exterior elevation — Version Twenty-${dir.endsWith('one') ? 'One' : 'Two'}. Photoreal pipeline. Open canvas.`
    )
    .replace(`VERSION ${word} · PHOTOREAL`, `VERSION ${word}`);
  html = replaceNav(html, dir);
  fs.writeFileSync(path.join(dest, 'index.html'), html);
  console.log('simplified', dir);
}

// Remaining study versions: slim nav only.
for (const dir of ['version-one', 'version-six', 'version-fourteen', 'version-sixteen', 'version-seventeen']) {
  const file = path.join(ELEV, dir, 'index.html');
  const html = replaceNav(fs.readFileSync(file, 'utf8'), dir);
  fs.writeFileSync(file, html);
  console.log('nav', dir);
}

// Delete dropped iteration folders.
for (const dir of DROP) {
  const dest = path.join(ELEV, dir);
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
    console.log('deleted', dir);
  }
}

console.log('done');
