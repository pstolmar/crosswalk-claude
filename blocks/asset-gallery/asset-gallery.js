// blocks/asset-gallery/asset-gallery.js

export const FILTERS = {
  none: '',
  negative: 'invert(1) hue-rotate(180deg)',
  polaroid: 'sepia(0.4) saturate(0.8) brightness(1.15) contrast(0.9)',
  filmstrip: 'saturate(0.3) contrast(1.4) brightness(0.85) sepia(0.3)',
  'hi-contrast': 'saturate(0) contrast(2.5) brightness(0.9)',
  fisheye: 'saturate(1.8) contrast(1.3) brightness(1.1) hue-rotate(15deg)',
  'glass-ball': 'brightness(1.4) saturate(0.6) contrast(1.2)',
};

const EFFECT_LABELS = {
  none: 'Original',
  negative: 'Negative',
  polaroid: 'Polaroid',
  filmstrip: 'Filmstrip',
  'hi-contrast': 'Hi-Contrast',
  fisheye: 'Fisheye',
  'glass-ball': 'Glass Ball',
};

export function parseConfig(block) {
  const cells = [...block.querySelectorAll(':scope > div:first-child > div')];
  const raw = cells.map((c) => c.textContent.trim());
  const effect = Object.prototype.hasOwnProperty.call(FILTERS, raw[1]) ? raw[1] : 'none';
  return {
    damFolder: raw[0] || '/content/dam/mermaidrdetools/demo',
    defaultEffect: effect,
    columns: parseInt(raw[2], 10) || 4,
  };
}

export function buildEffectStrip(activeEffect) {
  const strip = document.createElement('div');
  strip.className = 'ag-effect-strip';
  Object.keys(FILTERS).forEach((key) => {
    const pill = document.createElement('button');
    pill.className = `ag-effect-pill${key === activeEffect ? ' ag-effect-pill--active' : ''}`;
    pill.dataset.effect = key;
    pill.textContent = EFFECT_LABELS[key];
    strip.appendChild(pill);
  });
  return strip;
}

async function loadAssets(damFolder) {
  try {
    const res = await fetch(`/bin/mermaid/assets.json?path=${encodeURIComponent(damFolder)}`);
    if (res.ok) return (await res.json()).assets || [];
  } catch (_) { /* fall through to manifest */ }
  try {
    const res = await fetch(new URL('./assets-manifest.json', import.meta.url));
    if (res.ok) return (await res.json()).assets || [];
  } catch (_) { /* nothing */ }
  return [];
}

function buildGrid(assets, columns) {
  const grid = document.createElement('div');
  grid.className = 'ag-grid';
  grid.style.setProperty('--ag-columns', columns);
  assets.forEach((asset) => {
    const item = document.createElement('div');
    item.className = 'ag-item';
    item.dataset.path = asset.path;
    const img = document.createElement('img');
    img.src = asset.url;
    img.alt = asset.title || '';
    img.loading = 'lazy';
    item.appendChild(img);
    grid.appendChild(item);
  });
  return grid;
}

function buildJourneyDrawer(asset) {
  const drawer = document.createElement('div');
  drawer.className = 'ag-journey';
  const steps = [
    { label: 'I/O Upload', state: 'done' },
    { label: 'nt:file', state: 'done' },
    { label: 'dam:Asset ✓', state: 'active' },
    { label: 'Effects', state: 'pending' },
    { label: 'EDS Publish', state: 'pending' },
  ];
  drawer.innerHTML = `<p class="ag-journey__title">Asset Journey</p>
    <nav class="ag-journey__steps">${
  steps.map((s, i) => `<span class="ag-journey__step ag-journey__step--${s.state}">${s.label}</span>${
    i < steps.length - 1 ? '<span class="ag-journey__arrow">→</span>' : ''}`).join('')
}</nav>
    <footer class="ag-journey__meta">
      <code>${asset?.path || ''}</code>
    </footer>`;
  return drawer;
}

function buildDevHud(config) {
  const hud = document.createElement('div');
  hud.className = 'ag-dev-hud ag-dev-hud--hidden';
  hud.innerHTML = `
    <dl class="ag-dev-hud__list">
      <dt>Service user</dt><dd>mermaid-process-service</dd>
      <dt>Workflow model</dt><dd>/var/workflow/models/mermaid-promote</dd>
      <dt>DAM folder</dt><dd>${config.damFolder}</dd>
      <dt>I/O event shape</dt>
      <dd><pre>{\n  "eventType": "asset.promoted",\n  "assetPath": "&lt;path&gt;"\n}</pre></dd>
      <dt>RDE deploy</dt><dd><code>aio aem:rde:deploy</code></dd>
    </dl>`;
  return hud;
}

export default async function decorate(block) {
  const config = parseConfig(block);
  const assets = await loadAssets(config.damFolder);

  // Clear original table markup
  block.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'ag-header';
  header.innerHTML = `<span class="ag-folder-path">${config.damFolder}</span>`;

  const strip = buildEffectStrip(config.defaultEffect);
  const grid = buildGrid(assets, config.columns);
  const journey = buildJourneyDrawer(null);
  journey.classList.add('ag-journey--hidden');
  const devHud = buildDevHud(config);

  const hudToggle = document.createElement('button');
  hudToggle.className = 'ag-dev-hud-toggle';
  hudToggle.textContent = 'Dev HUD';

  block.append(header, strip, grid, journey, devHud, hudToggle);

  // Wire effect strip
  strip.addEventListener('click', (e) => {
    const pill = e.target.closest('.ag-effect-pill');
    if (!pill) return;
    strip.querySelectorAll('.ag-effect-pill').forEach((p) => p.classList.remove('ag-effect-pill--active'));
    pill.classList.add('ag-effect-pill--active');
    const filterVal = FILTERS[pill.dataset.effect] || '';
    grid.querySelectorAll('.ag-item img').forEach((img) => { img.style.filter = filterVal; });
  });

  // Wire image click → journey drawer
  grid.addEventListener('click', (e) => {
    const item = e.target.closest('.ag-item');
    if (!item) return;
    const wasOpen = !journey.classList.contains('ag-journey--hidden')
      && journey.dataset.activePath === item.dataset.path;
    journey.classList.toggle('ag-journey--hidden', wasOpen);
    if (!wasOpen) {
      journey.dataset.activePath = item.dataset.path;
      journey.querySelector('.ag-journey__meta code').textContent = item.dataset.path;
    }
  });

  // Wire dev HUD toggle
  hudToggle.addEventListener('click', () => {
    devHud.classList.toggle('ag-dev-hud--hidden');
    hudToggle.textContent = devHud.classList.contains('ag-dev-hud--hidden') ? 'Dev HUD' : 'Dev HUD ✕';
  });
}
