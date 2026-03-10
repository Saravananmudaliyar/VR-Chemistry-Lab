/**
 * script.js — ChemLab Simulator
 * Virtual Chemistry Laboratory — B.Tech Mini Project
 *
 * Sections:
 *  1. State variables
 *  2. Experiment data
 *  3. Registration / form validation
 *  4. Experiment loading (blackboard)
 *  5. Chemical selection
 *  6. Tool selection
 *  7. Table management (add / remove items)
 *  8. Start reaction (animations: bubbles, smoke, precipitate)
 *  9. Thermometer
 * 10. Drawer toggle
 * 11. Utility: toast, status bar
 * 12. Voice assistant (Web Speech API)
 * 13. Init
 */

/* ══════════════════════════════
   1. STATE VARIABLES
══════════════════════════════ */
let selectedChemicals = [];   // { id, name, color }
let selectedTools     = [];   // { name, icon }
let temperature       = 25;   // °C
let isReacting        = false;
let currentExperiment = 'acid_base';
let speechRecog       = null;

/* ══════════════════════════════
   2. EXPERIMENT DATA
══════════════════════════════ */
const experiments = {
  acid_base: {
    name:      '⚗ Acid – Base Reaction',
    overview:  'HCl + NaOH → NaCl + H₂O\nNeutralization reaction. Salt and water are formed.',
    chemicals: '• Hydrochloric Acid (HCl)\n• Sodium Hydroxide (NaOH)',
    tools:     '• Beaker  • Dropper  • Stirrer',
    steps: [
      'Take a clean beaker and place it on the table.',
      'Measure 10 mL of HCl using the measuring cylinder.',
      'Carefully pour HCl into the beaker.',
      'Add NaOH slowly, drop by drop, using the dropper.',
      'Stir the mixture gently with the glass rod.',
      'Observe — heat is released (exothermic reaction).',
      'Test with indicator: pH should be ≈ 7 (neutral).'
    ],
    reaction: { color: '#c8f0c8', effect: 'bubbles', formula: 'HCl + NaOH → NaCl + H₂O' }
  },

  precipitation: {
    name:      '🔵 Precipitation Reaction',
    overview:  'CuSO₄ + 2NaOH → Cu(OH)₂↓ + Na₂SO₄\nA blue precipitate forms at the bottom.',
    chemicals: '• Copper Sulfate (CuSO₄)\n• Sodium Hydroxide (NaOH)',
    tools:     '• Test Tube  • Dropper  • Stirrer',
    steps: [
      'Take a clean test tube.',
      'Add 5 mL of CuSO₄ (blue) solution to the tube.',
      'Slowly add NaOH using the dropper.',
      'Observe the formation of a blue precipitate.',
      'The precipitate is Copper(II) Hydroxide — Cu(OH)₂.',
      'Allow the precipitate to settle at the bottom.',
      'Record the color, texture, and amount of precipitate.'
    ],
    reaction: { color: '#a0c8f0', effect: 'precipitate', formula: 'CuSO₄ + 2NaOH → Cu(OH)₂↓ + Na₂SO₄' }
  },

  oxidation: {
    name:      '🟣 Oxidation Reaction',
    overview:  '2KMnO₄ + H₂SO₄ → ...\nKMnO₄ is a strong oxidizing agent. Deep purple color.',
    chemicals: '• Potassium Permanganate (KMnO₄)\n• Sulfuric Acid (H₂SO₄)',
    tools:     '• Beaker  • Measuring Cylinder  • Burner',
    steps: [
      'Wear safety goggles before beginning.',
      'Add dilute H₂SO₄ into the beaker (10 mL).',
      'Dissolve KMnO₄ crystals in 20 mL water separately.',
      'Slowly add KMnO₄ solution to the acid.',
      'Observe the deep purple color change.',
      'Gently heat with the Bunsen burner if reaction is slow.',
      'Record temperature and all color changes observed.'
    ],
    reaction: { color: '#e0b0f0', effect: 'smoke', formula: '2KMnO₄ + H₂SO₄ → K₂SO₄ + Mn²⁺ + H₂O' }
  },

  dissolution: {
    name:      '⚪ Dissolution Experiment',
    overview:  'NaCl(s) → Na⁺(aq) + Cl⁻(aq)\nNaCl dissolves in water forming saline solution.',
    chemicals: '• Sodium Chloride (NaCl)\n• Distilled Water',
    tools:     '• Beaker  • Stirrer  • Measuring Cylinder',
    steps: [
      'Measure 100 mL of distilled water in the cylinder.',
      'Pour the water into a clean beaker.',
      'Weigh out 5 g of NaCl crystals.',
      'Add NaCl slowly into the beaker of water.',
      'Stir continuously with the glass stirring rod.',
      'Observe the crystals dissolving completely.',
      'The resulting solution is 5% saline (salt water).'
    ],
    reaction: { color: '#d0eeff', effect: 'dissolve', formula: 'NaCl(s) → Na⁺(aq) + Cl⁻(aq)' }
  }
};

/* ══════════════════════════════
   3. REGISTRATION — FORM VALIDATION
══════════════════════════════ */

/**
 * Attach submit listener to registration form.
 * Validates name (non-empty) and roll number (exactly 4 digits).
 * On success → hides registration screen, shows lab.
 */
document.getElementById('reg-form').addEventListener('submit', function (e) {
  e.preventDefault();

  const nameInput = document.getElementById('student-name');
  const rollInput = document.getElementById('roll-number');
  const nameError = document.getElementById('name-error');
  const rollError = document.getElementById('roll-error');

  let valid = true;

  // Reset previous errors
  nameError.textContent = '';
  rollError.textContent = '';
  nameInput.classList.remove('input-error');
  rollInput.classList.remove('input-error');

  // Validate name
  const nameVal = nameInput.value.trim();
  if (!nameVal) {
    nameError.textContent = '⚠️ Name cannot be empty.';
    nameInput.classList.add('input-error');
    valid = false;
  }

  // Validate roll number: only digits, exactly 4
  const rollVal = rollInput.value.trim();
  if (!/^\d{4}$/.test(rollVal)) {
    rollError.textContent = '⚠️ Roll number must be exactly 4 digits (0–9).';
    rollInput.classList.add('input-error');
    valid = false;
  }

  if (!valid) return;

  // ── Registration Successful ──
  // Fill student badge in header
  document.getElementById('badge-name').textContent = nameVal;
  document.getElementById('badge-roll').textContent = 'Roll: ' + rollVal;

  // Transition: hide registration → show lab
  const regScreen = document.getElementById('registration-screen');
  const labRoom   = document.getElementById('lab-room');

  regScreen.style.transition = 'opacity 0.5s ease';
  regScreen.style.opacity = '0';

  setTimeout(() => {
    regScreen.style.display = 'none';
    labRoom.classList.remove('hidden');
    labRoom.style.opacity = '0';
    labRoom.style.transition = 'opacity 0.5s ease';
    setTimeout(() => { labRoom.style.opacity = '1'; }, 20);
  }, 500);

  showToast('👋 Welcome, ' + nameVal + '! Lab is ready.');
  setStatus('🔬 Welcome ' + nameVal + ' — Lab is ready. Select chemicals and tools to begin.');
});

/* ══════════════════════════════
   4. EXPERIMENT LOADING (BLACKBOARD)
══════════════════════════════ */

/**
 * Load experiment data onto the blackboard.
 * @param {string} id  - key in `experiments` object
 * @param {HTMLElement} btn - clicked button (for .active class)
 */
function loadExperiment(id, btn) {
  currentExperiment = id;
  const exp = experiments[id];

  // Update button active state
  document.querySelectorAll('.exp-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  // Update blackboard text
  document.getElementById('board-title').textContent     = exp.name;
  document.getElementById('board-overview').innerHTML    = exp.overview.replace(/\n/g, '<br>');
  document.getElementById('board-chemicals').innerHTML   = exp.chemicals.replace(/\n/g, '<br>');
  document.getElementById('board-tools').textContent     = exp.tools;

  // Render step list with staggered chalk-write animation
  renderSteps(exp.steps);

  setStatus('📖 Loaded: ' + exp.name);
  showToast('Experiment loaded: ' + exp.name);
}

/**
 * Build step items in #board-steps with animation delays.
 * @param {string[]} steps
 */
function renderSteps(steps) {
  const container = document.getElementById('board-steps');
  container.innerHTML = '';

  steps.forEach(function (step, i) {
    const div = document.createElement('div');
    div.className  = 'step-item board-text';
    div.style.animationDelay = (i * 0.13) + 's';
    div.innerHTML  =
      '<span class="step-num">' + (i + 1) + '.</span>' +
      '<span>' + step + '</span>';
    container.appendChild(div);
  });
}

/* ══════════════════════════════
   5. CHEMICAL SELECTION
══════════════════════════════ */

/**
 * Toggle a chemical bottle's selected state.
 * Adds/removes from selectedChemicals and from the table.
 * @param {HTMLElement} el - the .bottle div
 */
function selectChemical(el) {
  const id    = el.dataset.id;
  const name  = el.dataset.name;
  const color = el.dataset.color;

  el.classList.toggle('selected');

  if (el.classList.contains('selected')) {
    // Add to state and table
    if (!selectedChemicals.find(c => c.id === id)) {
      selectedChemicals.push({ id, name, color });
      addItemToTable('chemical', id, id, color, null);
      showToast('➕ Added: ' + name);
    }
  } else {
    // Remove from state and table
    selectedChemicals = selectedChemicals.filter(c => c.id !== id);
    removeItemFromTable(id);
  }

  updateStatusBar();
}

/* ══════════════════════════════
   6. TOOL SELECTION
══════════════════════════════ */

/**
 * Toggle a tool item's selected state.
 * @param {HTMLElement} el - the .tool-item div
 */
function selectTool(el) {
  const name = el.dataset.name;
  const icon = el.dataset.icon;

  el.classList.toggle('selected');

  if (el.classList.contains('selected')) {
    if (!selectedTools.find(t => t.name === name)) {
      selectedTools.push({ name, icon });
      addItemToTable('tool', name, name, null, icon);
      showToast('🔧 Added: ' + name);
    }
  } else {
    selectedTools = selectedTools.filter(t => t.name !== name);
    removeItemFromTable(name);
  }

  updateStatusBar();
}

/* ══════════════════════════════
   7. TABLE MANAGEMENT
══════════════════════════════ */

/**
 * Create a placed-item element inside the workspace.
 * @param {string} type    - 'chemical' | 'tool'
 * @param {string} id      - unique data-id for removal
 * @param {string} label   - display label text
 * @param {string|null} color - liquid color for bottles
 * @param {string|null} icon  - emoji icon for tools
 */
function addItemToTable(type, id, label, color, icon) {
  const workspace = document.getElementById('workspace');
  const rz        = document.getElementById('reaction-zone');

  // Hide placeholder hint when first item is added
  const hint = document.getElementById('rz-hint');
  if (hint) hint.style.display = 'none';

  // Build element
  const item = document.createElement('div');
  item.className   = 'placed-item';
  item.dataset.id  = id;

  if (type === 'chemical') {
    // Mini bottle visual
    item.innerHTML =
      '<div class="placed-bottle" style="border-color:' + color + '60">' +
        '<div class="placed-liquid" style="background:' + color + '"></div>' +
        '<div class="placed-glass-sheen"></div>' +
      '</div>' +
      '<div class="item-label">' + label + '</div>';
  } else {
    // Tool icon
    item.innerHTML =
      '<div style="font-size:2rem;filter:drop-shadow(0 2px 5px rgba(0,0,0,0.3))">' + icon + '</div>' +
      '<div class="item-label">' + label + '</div>';
  }

  // Insert before reaction-zone
  workspace.insertBefore(item, rz);
}

/**
 * Remove an item from the table by its data-id.
 * @param {string} id
 */
function removeItemFromTable(id) {
  const item = document.querySelector('#workspace .placed-item[data-id="' + id + '"]');
  if (item) item.remove();

  // Restore hint if table is now empty
  if (selectedChemicals.length === 0 && selectedTools.length === 0) {
    const hint = document.getElementById('rz-hint');
    if (hint) hint.style.display = '';
  }

  updateStatusBar();
}

/**
 * Clear everything from the table and reset selections.
 */
function clearTable() {
  selectedChemicals = [];
  selectedTools     = [];
  isReacting        = false;

  // Deselect all bottles and tools in the UI
  document.querySelectorAll('.bottle.selected').forEach(b => b.classList.remove('selected'));
  document.querySelectorAll('.tool-item.selected').forEach(t => t.classList.remove('selected'));

  // Remove placed items (but not reaction-zone)
  document.querySelectorAll('#workspace .placed-item').forEach(el => el.remove());

  // Reset reaction zone appearance
  const rz = document.getElementById('reaction-zone');
  rz.innerHTML = '<p id="rz-hint">📍 Select chemicals &amp; tools, then click <strong>Start Reaction</strong></p>';
  rz.style.background   = 'rgba(255,255,255,0.28)';
  rz.style.borderColor  = 'rgba(100,60,20,0.22)';

  setStatus('🧹 Table cleared — ready for a new experiment.');
  showToast('Table cleared!');
  updateStatusBar();
}

/* ══════════════════════════════
   8. START REACTION
══════════════════════════════ */

/**
 * Trigger the current experiment's reaction animation.
 * Requires at least 1 chemical to be on the table.
 */
function startReaction() {
  if (isReacting) return;

  if (selectedChemicals.length < 1) {
    showToast('⚠️ Add at least one chemical first!');
    return;
  }

  isReacting     = true;
  const exp      = experiments[currentExperiment];
  const rz       = document.getElementById('reaction-zone');

  setStatus('⚗️ Reaction in progress — ' + exp.name);
  showToast('🔬 Reaction started!');

  // Color transition on reaction zone
  rz.style.background  = exp.reaction.color + 'bb';
  rz.style.borderColor = exp.reaction.color;

  // Build beaker SVG with reaction label
  rz.innerHTML =
    '<div style="position:relative;width:92px;margin:0 auto">' +
      buildBeakerSVG(exp.reaction.color) +
      '<div id="bubble-container" style="position:absolute;bottom:18px;left:10px;right:10px;height:52px;overflow:hidden;pointer-events:none"></div>' +
    '</div>' +
    '<div style="font-family:\'Caveat\',cursive;color:#5a3a1a;font-size:0.88rem;text-align:center;margin-top:4px">' +
      exp.reaction.formula +
    '</div>';

  // Trigger particle effects based on experiment type
  const effect = exp.reaction.effect;
  if (effect === 'bubbles' || effect === 'dissolve') spawnBubbles();
  if (effect === 'smoke')                            spawnSmoke(rz);
  if (effect === 'precipitate')                      spawnPrecipitate(rz);

  // Reaction speed scales with temperature
  const duration = Math.max(1500, 4500 - (temperature - 25) * 40);

  setTimeout(function () {
    isReacting = false;
    setStatus('✅ Reaction complete — ' + exp.name + '. Observe the results.');
    showToast('✅ Reaction complete!');
  }, duration);
}

/**
 * Build an inline SVG of a beaker filled with the reaction color.
 * @param {string} color - CSS color
 * @returns {string} SVG markup
 */
function buildBeakerSVG(color) {
  return (
    '<svg viewBox="0 0 92 82" xmlns="http://www.w3.org/2000/svg" width="92" height="82">' +
      '<defs>' +
        '<linearGradient id="lq" x1="0%" y1="0%" x2="100%" y2="100%">' +
          '<stop offset="0%"   style="stop-color:' + color + ';stop-opacity:0.9"/>' +
          '<stop offset="100%" style="stop-color:' + color + ';stop-opacity:0.6"/>' +
        '</linearGradient>' +
        '<linearGradient id="gl" x1="0%" y1="0%" x2="100%" y2="0%">' +
          '<stop offset="0%"   style="stop-color:rgba(255,255,255,0.4)"/>' +
          '<stop offset="50%"  style="stop-color:rgba(255,255,255,0.05)"/>' +
          '<stop offset="100%" style="stop-color:rgba(255,255,255,0.2)"/>' +
        '</linearGradient>' +
      '</defs>' +
      '<path d="M22 8 L22 50 L8 72 L84 72 L70 50 L70 8 Z" fill="rgba(200,240,255,0.14)" stroke="rgba(100,180,220,0.7)" stroke-width="2"/>' +
      '<path d="M23 40 L23 50 L10 70 L82 70 L69 50 L69 40 Z" fill="url(#lq)" opacity="0.88"/>' +
      '<path d="M22 8 L22 50 L8 72 L84 72 L70 50 L70 8 Z" fill="url(#gl)"/>' +
      '<rect x="16" y="5" width="60" height="8" rx="3" fill="rgba(180,220,240,0.35)" stroke="rgba(100,180,220,0.7)" stroke-width="1.5"/>' +
    '</svg>'
  );
}

/* ── Reaction Particle Spawners ── */

/**
 * Spawn rising bubble particles inside the beaker.
 */
function spawnBubbles() {
  const bc = document.getElementById('bubble-container');
  if (!bc) return;

  const colors = [
    'rgba(255,255,255,0.75)',
    'rgba(200,240,255,0.65)',
    'rgba(220,255,220,0.65)'
  ];

  // Create 20 staggered bubbles
  for (let i = 0; i < 20; i++) {
    setTimeout(function () {
      if (!bc.parentElement) return;
      const size = 4 + Math.random() * 9;
      const b    = document.createElement('div');

      b.style.cssText =
        'position:absolute;' +
        'width:'  + size + 'px;' +
        'height:' + size + 'px;' +
        'border-radius:50%;' +
        'background:' + colors[Math.floor(Math.random() * colors.length)] + ';' +
        'left:' + (10 + Math.random() * 72) + '%;' +
        'bottom:0;' +
        'animation:rise-bubble ' + (0.8 + Math.random() * 1.3) + 's linear forwards;' +
        'border:1px solid rgba(255,255,255,0.4);';

      bc.appendChild(b);
      setTimeout(function () { b.remove(); }, 2200);
    }, i * 180);
  }
}

/**
 * Spawn rising smoke cloud particles over the reaction zone.
 * @param {HTMLElement} container - element to append smoke to
 */
function spawnSmoke(container) {
  for (let i = 0; i < 14; i++) {
    setTimeout(function () {
      const dx = (Math.random() - 0.5) * 64;
      const s  = document.createElement('div');

      s.style.cssText =
        'position:absolute;' +
        'width:'  + (18 + Math.random() * 22) + 'px;' +
        'height:' + (18 + Math.random() * 22) + 'px;' +
        'border-radius:50%;' +
        'background:rgba(200,200,220,0.38);' +
        'bottom:' + (38 + Math.random() * 22) + 'px;' +
        'left:'   + (28 + Math.random() * 32) + '%;' +
        '--dx:'   + dx + 'px;' +
        'animation:rise-smoke ' + (1.4 + Math.random()) + 's ease-out forwards;' +
        'pointer-events:none;z-index:5;';

      container.appendChild(s);
      setTimeout(function () { s.remove(); }, 2600);
    }, i * 240);
  }
}

/**
 * Spawn falling precipitate particles inside the reaction zone.
 * @param {HTMLElement} container
 */
function spawnPrecipitate(container) {
  // Inject keyframes once
  if (!document.getElementById('precip-kf')) {
    const s     = document.createElement('style');
    s.id        = 'precip-kf';
    s.textContent =
      '@keyframes fall-precipitate { to { transform:translateY(55px); opacity:0.25; } }';
    document.head.appendChild(s);
  }

  for (let i = 0; i < 22; i++) {
    setTimeout(function () {
      const p = document.createElement('div');
      p.style.cssText =
        'position:absolute;' +
        'width:'  + (2 + Math.random() * 5) + 'px;' +
        'height:' + (2 + Math.random() * 5) + 'px;' +
        'border-radius:2px;' +
        'background:rgba(30,112,184,0.85);' +
        'top:20px;' +
        'left:' + (10 + Math.random() * 78) + '%;' +
        'animation:fall-precipitate ' + (0.9 + Math.random() * 0.8) + 's ease-in forwards;' +
        'pointer-events:none;';
      container.appendChild(p);
      setTimeout(function () { p.remove(); }, 2000);
    }, i * 140);
  }
}

/* ══════════════════════════════
   9. THERMOMETER
══════════════════════════════ */

/**
 * Update thermometer fill height and displayed temperature.
 * Temperature range: 20°C – 100°C.
 * @param {string|number} val - value from the range input
 */
function updateTemp(val) {
  temperature = parseInt(val, 10);

  // Fill percentage (track is inside #thermo-track)
  const pct    = ((temperature - 20) / 80) * 100;
  const fillH  = 4 + pct * 0.92;

  const fill   = document.getElementById('thermo-fill');
  fill.style.height = fillH + '%';

  // Color shifts red as temperature rises
  const r = Math.min(255, 80  + temperature * 2.2);
  const b = Math.max(40,  240 - temperature * 2.2);
  fill.style.background =
    'linear-gradient(180deg, rgb(' + r + ',140,' + b + '), rgb(' + r + ',60,60))';

  // Update displays
  document.getElementById('temp-display').textContent  = temperature + '°C';
  document.getElementById('status-temp').textContent   = temperature + '°C';

  if (temperature >= 80) {
    setStatus('🌡️ High temperature (' + temperature + '°C) — reaction rate is increased!');
  }
}

/* ══════════════════════════════
   10. DRAWER TOGGLE
══════════════════════════════ */

/**
 * Open or close the tool drawer by toggling .open class.
 */
function toggleDrawer() {
  document.getElementById('tools-drawer').classList.toggle('open');
}

/* ══════════════════════════════
   11. UTILITIES
══════════════════════════════ */

/**
 * Update the bottom status bar message.
 * @param {string} msg
 */
function setStatus(msg) {
  document.getElementById('status-text').textContent = msg;
}

/**
 * Show a brief toast notification at the top of the screen.
 * @param {string} msg
 */
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(function () {
    t.classList.remove('show');
  }, 2600);
}

/**
 * Refresh the "Items on table" counter in the status bar.
 */
function updateStatusBar() {
  document.getElementById('status-items').textContent =
    selectedChemicals.length + selectedTools.length;
}

/* ══════════════════════════════
   12. VOICE ASSISTANT (Web Speech API)
══════════════════════════════ */

/**
 * Toggle voice recognition on/off.
 * Uses webkitSpeechRecognition (Chrome) or SpeechRecognition.
 */
function toggleVoice() {
  const btn = document.getElementById('voice-btn');

  // Check browser support
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    showToast('⚠️ Voice commands not supported in this browser.');
    return;
  }

  // If already listening, stop
  if (speechRecog && btn.classList.contains('listening')) {
    speechRecog.stop();
    btn.classList.remove('listening');
    document.getElementById('voice-status').textContent = 'Click mic to speak';
    return;
  }

  // Start new recognition session
  const SR   = window.SpeechRecognition || window.webkitSpeechRecognition;
  speechRecog = new SR();
  speechRecog.lang             = 'en-US';
  speechRecog.interimResults   = false;
  speechRecog.maxAlternatives  = 1;

  btn.classList.add('listening');
  document.getElementById('voice-status').textContent = '🔴 Listening...';

  // On successful recognition
  speechRecog.onresult = function (e) {
    const cmd = e.results[0][0].transcript.toLowerCase().trim();
    document.getElementById('voice-status').textContent = '"' + cmd + '"';
    processVoiceCommand(cmd);
  };

  speechRecog.onerror = function () {
    btn.classList.remove('listening');
    document.getElementById('voice-status').textContent = 'Error — try again';
  };

  speechRecog.onend = function () {
    btn.classList.remove('listening');
    setTimeout(function () {
      document.getElementById('voice-status').textContent = 'Click mic to speak';
    }, 2200);
  };

  speechRecog.start();
}

/**
 * Parse a voice command string and trigger the appropriate action.
 * @param {string} cmd - lower-case transcribed text
 */
function processVoiceCommand(cmd) {
  showToast('🎤 "' + cmd + '"');

  // ── Chemical selections ──
  if (cmd.includes('hydrochloric') || cmd.includes('h c l') || cmd.includes('hcl')) {
    document.querySelector('.hcl').click();
  } else if (cmd.includes('sodium hydroxide') || cmd.includes('naoh')) {
    document.querySelector('.naoh').click();
  } else if (cmd.includes('copper') || cmd.includes('cuso4') || cmd.includes('copper sulfate')) {
    document.querySelector('.cuso4').click();
  } else if (cmd.includes('sulfuric') || cmd.includes('h2so4') || cmd.includes('sulphuric')) {
    document.querySelector('.h2so4').click();
  } else if (cmd.includes('permanganate') || cmd.includes('kmno4') || cmd.includes('potassium')) {
    document.querySelector('.kmno4').click();
  } else if (cmd.includes('sodium chloride') || cmd.includes('nacl') || cmd.includes('salt')) {
    document.querySelector('.nacl').click();
  }

  // ── Tool selections ──
  else if (cmd.includes('beaker')) {
    document.querySelector('.tool-item[data-name="Beaker"]').click();
  } else if (cmd.includes('test tube') || cmd.includes('tube')) {
    document.querySelector('.tool-item[data-name="Test Tube"]').click();
  } else if (cmd.includes('flask')) {
    document.querySelector('.tool-item[data-name="Flask"]').click();
  } else if (cmd.includes('burner') || cmd.includes('bunsen')) {
    document.querySelector('.tool-item[data-name="Burner"]').click();
  } else if (cmd.includes('dropper')) {
    document.querySelector('.tool-item[data-name="Dropper"]').click();
  } else if (cmd.includes('stirrer') || cmd.includes('stir') || cmd.includes('rod')) {
    document.querySelector('.tool-item[data-name="Stirrer"]').click();
  } else if (cmd.includes('cylinder') || cmd.includes('measuring')) {
    document.querySelector('.tool-item[data-name="Cylinder"]').click();
  } else if (cmd.includes('goggles') || cmd.includes('safety')) {
    document.querySelector('.tool-item[data-name="Goggles"]').click();
  }

  // ── Lab actions ──
  else if (cmd.includes('start') || cmd.includes('react') || cmd.includes('begin experiment')) {
    startReaction();
  } else if (cmd.includes('clear') || cmd.includes('reset') || cmd.includes('clean table')) {
    clearTable();
  }

  // ── Experiment selection ──
  else if (cmd.includes('acid') && cmd.includes('base')) {
    loadExperiment('acid_base', document.querySelectorAll('.exp-btn')[0]);
  } else if (cmd.includes('precipitation') || cmd.includes('precipitate')) {
    loadExperiment('precipitation', document.querySelectorAll('.exp-btn')[1]);
  } else if (cmd.includes('oxidation') || cmd.includes('oxidize')) {
    loadExperiment('oxidation', document.querySelectorAll('.exp-btn')[2]);
  } else if (cmd.includes('dissolution') || cmd.includes('dissolve')) {
    loadExperiment('dissolution', document.querySelectorAll('.exp-btn')[3]);
  }

  // ── Unknown command ──
  else {
    showToast('❓ Command not recognized: "' + cmd + '"');
    setStatus('❓ Voice command not recognized. Try: "Select Beaker", "Start Reaction", "Clear Table"');
  }
}

/* ══════════════════════════════
   13. INITIALISATION
══════════════════════════════ */

// Run once DOM is fully loaded
document.addEventListener('DOMContentLoaded', function () {

  // Open tool drawer by default
  document.getElementById('tools-drawer').classList.add('open');

  // Initialize thermometer visual
  updateTemp(25);

  // Load default experiment onto the blackboard
  loadExperiment('acid_base', document.querySelector('.exp-btn.active'));

  // Block non-digit input in roll number field (allow backspace, delete, arrows)
  document.getElementById('roll-number').addEventListener('keydown', function (e) {
    const allowed = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
    if (!allowed.includes(e.key) && !/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  });
});
