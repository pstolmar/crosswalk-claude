// blocks/card-reveal-hero/card-reveal-hero.js
import { fireSparkler, fireConfetti, fireBalloons, clearFx } from '../shared/fx-canvas.js';

export const ANIMATION_PRESETS = {
  'bounce':      'animation: crhSpringIn 0.55s cubic-bezier(0.34,1.56,0.64,1) both',
  'slide-right': 'animation: crhSlideRight 0.4s ease-out both',
  'drop-camera': 'animation: crhDropCamera 0.6s cubic-bezier(0.22,1,0.36,1) both',
  'flip':        'animation: crhFlip 0.45s ease-out both',
};

export function parseHeroConfig(block) {
  const cells = [...block.querySelectorAll(':scope > div:first-child > div')];
  const raw = cells.map(c => c.textContent.trim());
  const validStyles = ['pill','underline','card'];
  return {
    tabStyle: validStyles.includes(raw[0]) ? raw[0] : 'pill',
    defaultTab: parseInt(raw[1], 10) || 0,
  };
}

export function parseTabs(block) {
  const rows = [...block.children].slice(1);
  return rows.map(row => {
    const cells = [...row.children];
    const t = i => cells[i]?.textContent.trim() || '';
    const imgSrc = i => cells[i]?.querySelector('img')?.src || cells[i]?.textContent.trim() || '';
    const validPresets = Object.keys(ANIMATION_PRESETS);
    const validCelebrations = ['sparkler','confetti','balloons','none'];
    return {
      icon:              t(0),
      label:             t(1),
      heading:           t(2),
      bodyText:          t(3),
      ctaLabel:          t(4),
      ctaHref:           cells[4]?.querySelector('a')?.href || '#',
      panelImage:        imgSrc(5),
      popupImage:        imgSrc(6),
      popupLabel:        '',
      animationPreset:   validPresets.includes(t(7)) ? t(7) : 'bounce',
      celebrationVariant: validCelebrations.includes(t(8)) ? t(8) : 'none',
    };
  });
}

function buildTabs(tabs, config) {
  const nav = document.createElement('nav');
  nav.className = `crh-tabs crh-tabs--${config.tabStyle}`;
  tabs.forEach((tab, i) => {
    const btn = document.createElement('button');
    btn.className = 'crh-tab' + (i === config.defaultTab ? ' crh-tab--active' : '');
    btn.dataset.index = i;
    btn.innerHTML = `<span class="crh-tab__icon">${tab.icon}</span><span class="crh-tab__label">${tab.label}</span>`;
    nav.appendChild(btn);
  });
  return nav;
}

function buildPanel(tab) {
  const panel = document.createElement('div');
  panel.className = 'crh-panel';

  const left = document.createElement('div');
  left.className = 'crh-panel__left';
  left.innerHTML = `
    <h2 class="crh-heading">${tab.heading}</h2>
    <p class="crh-body">${tab.bodyText}</p>
    <a class="crh-cta" href="${tab.ctaHref}">${tab.ctaLabel}</a>`;

  const right = document.createElement('div');
  right.className = 'crh-panel__right';

  const mainPanel = document.createElement('div');
  mainPanel.className = 'crh-main-panel';
  if (tab.panelImage) {
    const img = document.createElement('img');
    img.src = tab.panelImage;
    img.alt = tab.label + ' panel';
    mainPanel.appendChild(img);
  } else {
    mainPanel.innerHTML = `<div class="crh-main-panel__placeholder"><span>${tab.label}</span></div>`;
  }

  const popupCard = document.createElement('div');
  popupCard.className = 'crh-popup';
  if (tab.popupImage) {
    const img = document.createElement('img');
    img.src = tab.popupImage;
    img.alt = tab.label + ' card';
    popupCard.appendChild(img);
  } else {
    popupCard.innerHTML = `<div class="crh-popup__placeholder"></div>`;
  }

  right.append(mainPanel, popupCard);
  panel.append(left, right);
  return panel;
}

function triggerCelebration(variant, mainPanelEl) {
  clearFx();
  if (variant === 'sparkler') fireSparkler(mainPanelEl);
  else if (variant === 'confetti') fireConfetti();
  else if (variant === 'balloons') fireBalloons();
}

function applyPopupAnimation(popupEl, preset) {
  popupEl.style.cssText = '';
  void popupEl.offsetWidth; // force reflow
  popupEl.style.cssText = ANIMATION_PRESETS[preset] || ANIMATION_PRESETS.bounce;
}

export default function decorate(block) {
  const config = parseHeroConfig(block);
  const tabs = parseTabs(block);
  if (!tabs.length) return;

  // Clamp defaultTab to valid range
  const activeIdx = Math.min(Math.max(0, config.defaultTab), tabs.length - 1);

  block.innerHTML = '';

  const nav = buildTabs(tabs, { ...config, defaultTab: activeIdx });
  const panelContainer = document.createElement('div');
  panelContainer.className = 'crh-panel-container';

  let currentPanel = buildPanel(tabs[activeIdx]);
  panelContainer.appendChild(currentPanel);
  block.append(nav, panelContainer);

  // Fire initial celebration after paint
  if (typeof requestAnimationFrame !== 'undefined') {
    requestAnimationFrame(() => {
      const popup = currentPanel.querySelector('.crh-popup');
      const mainPanelEl = currentPanel.querySelector('.crh-main-panel');
      if (popup) applyPopupAnimation(popup, tabs[activeIdx].animationPreset);
      triggerCelebration(tabs[activeIdx].celebrationVariant, mainPanelEl);
    });
  }

  nav.addEventListener('click', e => {
    const btn = e.target.closest('.crh-tab');
    if (!btn) return;
    const idx = parseInt(btn.dataset.index, 10);
    if (btn.classList.contains('crh-tab--active')) return;

    nav.querySelectorAll('.crh-tab').forEach(t => t.classList.remove('crh-tab--active'));
    btn.classList.add('crh-tab--active');

    const tab = tabs[idx];
    currentPanel.remove();
    currentPanel = buildPanel(tab);
    panelContainer.appendChild(currentPanel);

    const popup = currentPanel.querySelector('.crh-popup');
    const mainPanelEl = currentPanel.querySelector('.crh-main-panel');
    if (popup) applyPopupAnimation(popup, tab.animationPreset);
    triggerCelebration(tab.celebrationVariant, mainPanelEl);
  });
}
