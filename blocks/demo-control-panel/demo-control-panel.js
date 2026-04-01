// blocks/demo-control-panel/demo-control-panel.js

const BADGE_COLORS = [
  { bg: 'rgba(79,110,247,0.15)', border: '#4f6ef7', color: '#a5b4fc' },
  { bg: 'rgba(168,85,247,0.15)', border: '#a855f7', color: '#d8b4fe' },
  { bg: 'rgba(234,179,8,0.15)', border: '#eab308', color: '#fde047' },
];

export function parsePanelConfig(block) {
  const cells = [...block.children[0].children];
  const raw = cells.map((c) => c.textContent.trim());
  return {
    stepInterval: parseInt(raw[0], 10) || 900,
    enableSpeech: raw[1] === 'true',
  };
}

export function parseScenarios(block) {
  const rows = [...block.children].slice(1);
  return rows.map((row) => {
    const cells = [...row.children];
    const label = cells[0]?.textContent.trim() || 'Scenario';
    const steps = cells.slice(1).map((c) => c.textContent.trim()).filter(Boolean);
    return { label, steps };
  });
}

function buildHud(scenarios) {
  const hud = document.createElement('div');
  hud.className = 'dcp-hud';

  const header = document.createElement('div');
  header.className = 'dcp-hud__header';
  header.innerHTML = `<span class="dcp-hud__title">Demo Scenarios</span>
    <button class="dcp-hud__minimize" title="Minimize">—</button>`;

  const body = document.createElement('div');
  body.className = 'dcp-hud__body';

  const badges = document.createElement('div');
  badges.className = 'dcp-badges';
  scenarios.forEach((scenario, i) => {
    const btn = document.createElement('button');
    btn.className = 'dcp-badge';
    btn.textContent = scenario.label;
    const col = BADGE_COLORS[i % BADGE_COLORS.length];
    btn.style.cssText = `background:${col.bg};border-color:${col.border};color:${col.color};`;
    btn.dataset.index = i;
    badges.appendChild(btn);
  });

  const statusRow = document.createElement('div');
  statusRow.className = 'dcp-status';
  statusRow.innerHTML = '<span class="dcp-pip"></span><span class="dcp-status__text">Click a scenario to run</span>';

  const planBox = document.createElement('div');
  planBox.className = 'dcp-plan';
  planBox.innerHTML = '<div class="dcp-plan__empty">—</div>';

  const footer = document.createElement('div');
  footer.className = 'dcp-footer';
  footer.innerHTML = `<button class="dcp-dev-toggle">Dev HUD</button>
    <button class="dcp-reset">Reset</button>`;

  const devHud = document.createElement('div');
  devHud.className = 'dcp-dev-hud dcp-dev-hud--hidden';
  devHud.innerHTML = `<dl>
    <dt>Service user</dt><dd>mermaid-process-service</dd>
    <dt>Workflow</dt><dd>/var/workflow/models/mermaid-promote</dd>
    <dt>I/O event</dt><dd><pre>{ "eventType": "asset.promoted" }</pre></dd>
    <dt>RDE</dt><dd><code>aio aem:rde:deploy</code></dd>
  </dl>`;

  body.append(badges, statusRow, planBox, footer, devHud);
  hud.append(header, body);
  return hud;
}

function getStepState(i, doneCount, runningIndex) {
  if (i < doneCount) return { state: 'done', icon: '✓' };
  if (i === runningIndex) return { state: 'run', icon: '⟳' };
  return { state: 'wait', icon: '◦' };
}

function renderPlan(planBox, steps, doneCount, runningIndex) {
  planBox.innerHTML = steps.map((step, i) => {
    const { state, icon } = getStepState(i, doneCount, runningIndex);
    return `<div class="dcp-step dcp-step--${state}">
      <span class="dcp-step__dot"></span>
      <span class="dcp-step__text">${icon} ${step}</span>
    </div>`;
  }).join('');
}

function runScenario(scenario, planBox, statusText, pip, config) {
  const { steps } = scenario;
  pip.classList.add('dcp-pip--live');
  statusText.textContent = `Running: ${scenario.label}…`;
  renderPlan(planBox, steps, 0, 0);

  if (config.enableSpeech && typeof speechSynthesis !== 'undefined') {
    const utter = new SpeechSynthesisUtterance(`Running ${scenario.label}`);
    speechSynthesis.speak(utter);
  }

  document.dispatchEvent(new CustomEvent('mermaid:scenario:start', { detail: { scenario: scenario.label } }));

  let stepsDone = 0;
  const timer = setInterval(() => {
    stepsDone += 1;
    if (stepsDone < steps.length) {
      renderPlan(planBox, steps, stepsDone, stepsDone);
    } else {
      renderPlan(planBox, steps, steps.length, -1);
      clearInterval(timer);
      pip.classList.remove('dcp-pip--live');
      statusText.textContent = '✓ Scenario complete';
      document.dispatchEvent(new CustomEvent('mermaid:scenario:complete', { detail: { scenario: scenario.label } }));
    }
  }, config.stepInterval);

  return timer;
}

export default function decorate(block) {
  const config = parsePanelConfig(block);
  const scenarios = parseScenarios(block);

  const hud = buildHud(scenarios);
  document.body.appendChild(hud);
  block.innerHTML = '';

  const planBox = hud.querySelector('.dcp-plan');
  const statusText = hud.querySelector('.dcp-status__text');
  const pip = hud.querySelector('.dcp-pip');

  let activeTimer = null;

  hud.querySelector('.dcp-badges').addEventListener('click', (e) => {
    const badge = e.target.closest('.dcp-badge');
    if (!badge) return;
    if (activeTimer) { clearInterval(activeTimer); activeTimer = null; }
    hud.querySelectorAll('.dcp-badge').forEach((b) => b.classList.remove('dcp-badge--running'));
    badge.classList.add('dcp-badge--running');
    const scenarioIndex = parseInt(badge.dataset.index, 10);
    activeTimer = runScenario(scenarios[scenarioIndex], planBox, statusText, pip, config);
  });

  hud.querySelector('.dcp-dev-toggle').addEventListener('click', () => {
    const d = hud.querySelector('.dcp-dev-hud');
    d.classList.toggle('dcp-dev-hud--hidden');
  });

  hud.querySelector('.dcp-reset').addEventListener('click', () => {
    if (activeTimer) { clearInterval(activeTimer); activeTimer = null; }
    hud.querySelectorAll('.dcp-badge').forEach((b) => b.classList.remove('dcp-badge--running'));
    pip.classList.remove('dcp-pip--live');
    statusText.textContent = 'Click a scenario to run';
    planBox.innerHTML = '<div class="dcp-plan__empty">—</div>';
    document.dispatchEvent(new CustomEvent('mermaid:scenario:reset'));
  });

  hud.querySelector('.dcp-hud__minimize').addEventListener('click', () => {
    hud.classList.toggle('dcp-hud--minimized');
  });

  let dragging = false; let ox = 0; let
    oy = 0;
  hud.querySelector('.dcp-hud__header').addEventListener('mousedown', (e) => {
    dragging = true;
    ox = e.clientX - hud.getBoundingClientRect().left;
    oy = e.clientY - hud.getBoundingClientRect().top;
  });
  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    hud.style.left = `${e.clientX - ox}px`;
    hud.style.top = `${e.clientY - oy}px`;
    hud.style.right = 'auto'; hud.style.bottom = 'auto';
  });
  document.addEventListener('mouseup', () => { dragging = false; });
}
