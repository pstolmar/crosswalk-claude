// blocks/card-reveal-hero/card-reveal-hero.test.js
import decorate, { parseTabs, parseHeroConfig, ANIMATION_PRESETS } from './card-reveal-hero.js';

function makeBlock(configRow, ...tabRows) {
  const block = document.createElement('div');
  const configDiv = document.createElement('div');
  configDiv.innerHTML = configRow.map(c => `<div>${c}</div>`).join('');
  block.appendChild(configDiv);
  tabRows.forEach(row => {
    const div = document.createElement('div');
    div.innerHTML = row.map(c => `<div>${c}</div>`).join('');
    block.appendChild(div);
  });
  return block;
}

describe('parseHeroConfig', () => {
  it('reads tabStyle', () => {
    const block = makeBlock(['underline', '1'], ['🎯', 'Assets', 'Heading', 'Body', 'CTA', '', '', 'bounce', 'sparkler']);
    expect(parseHeroConfig(block).tabStyle).toBe('underline');
  });

  it('defaults tabStyle to pill', () => {
    const block = makeBlock(['', '0'], ['🎯', 'Assets', 'H', 'B', 'CTA', '', '', 'bounce', 'none']);
    expect(parseHeroConfig(block).tabStyle).toBe('pill');
  });
});

describe('parseTabs', () => {
  it('parses all tab properties from rows 2+', () => {
    const block = makeBlock(
      ['pill', '0'],
      ['🎯', 'Assets', 'Heading A', 'Body A', 'CTA A', '/dam/panel.jpg', '/dam/popup.jpg', 'bounce', 'sparkler'],
      ['💳', 'Approval', 'Heading B', 'Body B', 'CTA B', '', '', 'slide-right', 'confetti'],
    );
    const tabs = parseTabs(block);
    expect(tabs.length).toBe(2);
    expect(tabs[0].icon).toBe('🎯');
    expect(tabs[0].label).toBe('Assets');
    expect(tabs[0].animationPreset).toBe('bounce');
    expect(tabs[0].celebrationVariant).toBe('sparkler');
    expect(tabs[1].celebrationVariant).toBe('confetti');
  });

  it('defaults animationPreset to bounce if unrecognised', () => {
    const block = makeBlock(['pill','0'], ['🎯','Assets','H','B','CTA','','','bogus','none']);
    expect(parseTabs(block)[0].animationPreset).toBe('bounce');
  });
});

describe('ANIMATION_PRESETS', () => {
  it('has entries for bounce, slide-right, drop-camera, flip', () => {
    ['bounce','slide-right','drop-camera','flip'].forEach(k => expect(ANIMATION_PRESETS).toHaveProperty(k));
  });
});

describe('decorate', () => {
  it('renders one .crh-tab per parsed tab', () => {
    const block = makeBlock(
      ['pill','0'],
      ['🎯','Assets','H1','B1','CTA1','','','bounce','sparkler'],
      ['💳','Approval','H2','B2','CTA2','','','bounce','confetti'],
    );
    decorate(block);
    expect(block.querySelectorAll('.crh-tab').length).toBe(2);
  });

  it('first tab is active on render', () => {
    const block = makeBlock(
      ['pill','0'],
      ['🎯','Assets','H','B','CTA','','','bounce','none'],
    );
    decorate(block);
    expect(block.querySelector('.crh-tab--active')).not.toBeNull();
  });

  it('clicking a tab updates active class and heading text', () => {
    const block = makeBlock(
      ['pill','0'],
      ['🎯','Assets','Heading A','Body A','CTA A','','','bounce','none'],
      ['💳','Approval','Heading B','Body B','CTA B','','','bounce','none'],
    );
    decorate(block);
    const tabs = block.querySelectorAll('.crh-tab');
    tabs[1].click();
    expect(tabs[1].classList.contains('crh-tab--active')).toBe(true);
    expect(tabs[0].classList.contains('crh-tab--active')).toBe(false);
    expect(block.querySelector('.crh-heading').textContent).toBe('Heading B');
  });
});
