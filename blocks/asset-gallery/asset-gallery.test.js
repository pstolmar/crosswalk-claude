// blocks/asset-gallery/asset-gallery.test.js
import { jest } from '@jest/globals';
import decorate, { parseConfig, buildEffectStrip, FILTERS } from './asset-gallery.js';

// Stub fetch
global.fetch = jest.fn(() => Promise.resolve({
  ok: true,
  json: () => Promise.resolve({
    assets: [
      {
        path: '/content/dam/demo/a.jpg', url: '/a.jpg', title: 'Asset A', mimeType: 'image/jpeg',
      },
      {
        path: '/content/dam/demo/b.jpg', url: '/b.jpg', title: 'Asset B', mimeType: 'image/jpeg',
      },
    ],
  }),
}));

describe('parseConfig', () => {
  it('reads damFolder from first cell of first row', () => {
    const block = document.createElement('div');
    block.innerHTML = '<div><div>/content/dam/demo</div><div>filmstrip</div><div>3</div></div>';
    const cfg = parseConfig(block);
    expect(cfg.damFolder).toBe('/content/dam/demo');
  });

  it('reads defaultEffect', () => {
    const block = document.createElement('div');
    block.innerHTML = '<div><div>/content/dam/demo</div><div>negative</div><div>4</div></div>';
    expect(parseConfig(block).defaultEffect).toBe('negative');
  });

  it('falls back to none for unknown effect', () => {
    const block = document.createElement('div');
    block.innerHTML = '<div><div>/content/dam/demo</div><div>bogus</div><div>4</div></div>';
    expect(parseConfig(block).defaultEffect).toBe('none');
  });

  it('reads columns as integer', () => {
    const block = document.createElement('div');
    block.innerHTML = '<div><div>/content/dam/demo</div><div>none</div><div>5</div></div>';
    expect(parseConfig(block).columns).toBe(5);
  });
});

describe('FILTERS', () => {
  it('has entries for all 7 expected effects', () => {
    const keys = ['none', 'negative', 'polaroid', 'filmstrip', 'hi-contrast', 'fisheye', 'glass-ball'];
    keys.forEach((k) => expect(FILTERS).toHaveProperty(k));
  });
});

describe('buildEffectStrip', () => {
  it('renders a pill for each filter key', () => {
    const strip = buildEffectStrip('none');
    const pills = strip.querySelectorAll('.ag-effect-pill');
    expect(pills.length).toBe(7);
  });

  it('marks the active pill with ag-effect-pill--active', () => {
    const strip = buildEffectStrip('filmstrip');
    const active = strip.querySelector('.ag-effect-pill--active');
    expect(active).not.toBeNull();
    expect(active.dataset.effect).toBe('filmstrip');
  });
});

describe('decorate', () => {
  it('removes original block table rows and inserts gallery structure', async () => {
    const block = document.createElement('div');
    block.innerHTML = '<div><div>/content/dam/demo</div><div>none</div><div>4</div></div>';
    await decorate(block);
    expect(block.querySelector('.ag-effect-strip')).not.toBeNull();
    expect(block.querySelector('.ag-grid')).not.toBeNull();
  });

  it('renders one .ag-item per asset returned from fetch', async () => {
    const block = document.createElement('div');
    block.innerHTML = '<div><div>/content/dam/demo</div><div>none</div><div>4</div></div>';
    await decorate(block);
    expect(block.querySelectorAll('.ag-item').length).toBe(2);
  });
});
