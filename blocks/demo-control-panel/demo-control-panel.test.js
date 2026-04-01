// blocks/demo-control-panel/demo-control-panel.test.js
import decorate, { parseScenarios, parsePanelConfig } from './demo-control-panel.js';

function makeBlock(configRow, ...scenarioRows) {
  const block = document.createElement('div');
  const cfg = document.createElement('div');
  cfg.innerHTML = configRow.map(c => `<div>${c}</div>`).join('');
  block.appendChild(cfg);
  scenarioRows.forEach(row => {
    const div = document.createElement('div');
    div.innerHTML = row.map(c => `<div>${c}</div>`).join('');
    block.appendChild(div);
  });
  return block;
}

describe('parsePanelConfig', () => {
  it('reads stepInterval as integer', () => {
    const block = makeBlock(['1200', 'false']);
    expect(parsePanelConfig(block).stepInterval).toBe(1200);
  });

  it('defaults stepInterval to 900', () => {
    const block = makeBlock(['', 'false']);
    expect(parsePanelConfig(block).stepInterval).toBe(900);
  });

  it('reads enableSpeech as boolean', () => {
    const block = makeBlock(['900', 'true']);
    expect(parsePanelConfig(block).enableSpeech).toBe(true);
  });
});

describe('parseScenarios', () => {
  it('parses label and steps from rows 2+', () => {
    const block = makeBlock(
      ['900', 'false'],
      ['🎯 Social Campaign', 'step one', 'step two', 'step three'],
      ['💳 Credit Offer', 'alpha', 'beta'],
    );
    const scenarios = parseScenarios(block);
    expect(scenarios.length).toBe(2);
    expect(scenarios[0].label).toBe('🎯 Social Campaign');
    expect(scenarios[0].steps).toEqual(['step one', 'step two', 'step three']);
    expect(scenarios[1].steps.length).toBe(2);
  });
});

describe('decorate', () => {
  afterEach(() => {
    document.querySelectorAll('.dcp-hud').forEach(el => el.remove());
  });

  it('appends floating HUD to document body', () => {
    const block = makeBlock(
      ['900', 'false'],
      ['🎯 Social', 'step 1', 'step 2'],
    );
    decorate(block);
    expect(document.querySelector('.dcp-hud')).not.toBeNull();
  });

  it('renders one .dcp-badge per scenario', () => {
    const block = makeBlock(
      ['900', 'false'],
      ['🎯 Social', 'step 1', 'step 2'],
      ['💳 Credit', 'step a', 'step b'],
      ['🎬 Archive', 'step x'],
    );
    decorate(block);
    expect(document.querySelectorAll('.dcp-badge').length).toBe(3);
  });

  it('empties the block element itself', () => {
    const block = makeBlock(['900', 'false'], ['🎯 Social', 'step 1']);
    decorate(block);
    expect(block.innerHTML.trim()).toBe('');
  });
});
