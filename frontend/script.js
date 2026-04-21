/**
 * script.js — ChemLab Simulator  |  B.Tech Mini Project
 *
 * FIXES in this version:
 *  1. REACTION BUG: lookupReaction now uses ALL poured chemicals, not selectedChemicals
 *  2. POUR ANIMATION: chip first slides to vessel mouth, THEN tilts, THEN pours into vessel
 *  3. SHELF: all chemicals shown individually (3/row, scrollable), search bar filters them
 */

/* ══════════════════════════════════════════════════
   FULL DATABASE  (all from reactions.json)
══════════════════════════════════════════════════ */
let DB = {
  presets: {
    std10_decomp:       { label:'Decomp',  reactionKey:'CaCO3',           badge:'DECOMPOSITION', badgeColor:'#e0d8c0' },
    std10_displacement: { label:'Displace',reactionKey:'CuSO4+Mg',        badge:'DISPLACEMENT',  badgeColor:'#ff8844' },
    std10_neutral:      { label:'Neutral', reactionKey:'HCl+NaOH',        badge:'NEUTRALIZATION',badgeColor:'#a0f0c0' },
    std11_titration:    { label:'Titration',reactionKey:'CH3COOH+NaOH',   badge:'NEUTRALIZATION',badgeColor:'#a0f0c0' },
    std11_buffer:       { label:'Buffer',  reactionKey:'CH3COOH+NaHCO3',  badge:'CO₂ FIZZ',      badgeColor:'#c0f8c0' },
    std12_ester:        { label:'Ester',   reactionKey:'C2H5OH+CH3COOH',  badge:'ESTERIFICATION',badgeColor:'#f0d0a0' },
    std12_complex:      { label:'Complex', reactionKey:'CuSO4+NH4OH',     badge:'COMPLEX ION',   badgeColor:'#60a8ff' }
  }
};

/* ══════════════════════════════════════════════════
   EXPERIMENTS TABLE  (from experiments.json)
   Keyed by the preset ID used in HTML onclick.
══════════════════════════════════════════════════ */
/* ══════════════════════════════════════════════════
   MANUAL GUIDE — Step-by-step tracker on sideboard
══════════════════════════════════════════════════ */
const ManualGuide = {
  active: false,
  currentStep: 0,
  steps: [],
  presetId: null,

  start(presetId, expData) {
    this.active      = true;
    this.presetId    = presetId;
    this.currentStep = 0;
    this.steps       = expData ? expData.procedure : [];
    this._renderSideboard(expData);
    this._highlightStep(0);
  },

  _renderSideboard(expData) {
    if (!expData) return;
    document.getElementById('board-title').textContent    = '🧪 ' + expData.title;
    document.getElementById('board-overview').innerHTML   = '<b>Aim:</b> ' + expData.aim;
    document.getElementById('board-chemicals').innerHTML  = expData.chemicals.map(c => '• ' + c).join('<br>');
    document.getElementById('board-tools').textContent    = expData.equipment.join('  •  ');
    document.getElementById('board-safety').textContent   = 'Goggles  •  Gloves  •  Lab Coat';
    this._renderStepsPanel();
  },

  _renderStepsPanel() {
    const c = document.getElementById('board-steps');
    c.innerHTML = '';
    this.steps.forEach((s, i) => {
      const d = document.createElement('div');
      d.className           = 'step-item board-text manual-step';
      d.id                  = 'manual-step-' + i;
      d.style.animationDelay = (i * 0.1) + 's';
      d.style.cursor        = 'pointer';
      d.innerHTML = `<span class="step-num" id="step-num-${i}">${i+1}.</span><span>${s}</span>`;
      d.onclick = () => this.jumpToStep(i);
      c.appendChild(d);
    });
    this._highlightStep(this.currentStep);
  },

  _highlightStep(idx) {
    document.querySelectorAll('.manual-step').forEach((el, i) => {
      el.classList.remove('step-active', 'step-done');
      if (i < idx)  el.classList.add('step-done');
      if (i === idx) el.classList.add('step-active');
    });
    /* Scroll the active step into view */
    const active = document.getElementById('manual-step-' + idx);
    if (active) active.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },

  nextStep() {
    if (!this.active) return;
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      this._highlightStep(this.currentStep);
      /* Auto-advance tracker dot in status bar */
      setStatus('📍 Step ' + (this.currentStep + 1) + '/' + this.steps.length + ': ' + this.steps[this.currentStep]);
    }
  },

  jumpToStep(idx) {
    if (!this.active) return;
    this.currentStep = idx;
    this._highlightStep(idx);
    setStatus('📍 Step ' + (idx + 1) + '/' + this.steps.length + ': ' + this.steps[idx]);
  },

  complete(expData) {
    this.active = false;
    /* Mark all steps done */
    document.querySelectorAll('.manual-step').forEach(el => {
      el.classList.remove('step-active');
      el.classList.add('step-done');
    });
    /* Show outcome on board */
    if (expData) {
      const obs  = document.createElement('div');
      obs.className = 'board-text outcome-box';
      obs.innerHTML = '<br><b style="color:#f0c060">🔬 Outcome:</b><br>' + expData.outcome + '<br><small style="color:#a0f0a0">' + expData.conclusion + '</small>';
      document.getElementById('board-steps').appendChild(obs);
      obs.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    setStatus('✅ Experiment complete! Review the outcome on the blackboard.');
  },

  stop() {
    this.active = false;
    this.steps  = [];
  }
};

const EXPERIMENTS_TABLE = {
  'hydrogen_peroxide+manganese_dioxide': {
    title: 'Preparation of Oxygen Gas', class: 10,
    aim: 'To prepare and collect oxygen gas by the decomposition of hydrogen peroxide.',
    chemicals: ['Hydrogen Peroxide (H₂O₂)', 'Manganese Dioxide (MnO₂)'],
    equipment: ['Conical Flask', 'Delivery Tube', 'Gas Jar', 'Burette Stand'],
    procedure: [
      '☑ Set up the conical flask securely on the burette stand.',
      '☑ Measure and pour 50 mL of hydrogen peroxide into the flask.',
      '☑ Add a small spatula of manganese dioxide (catalyst) to the flask.',
      '☑ Connect the delivery tube and lead it into the gas jar filled with water.',
      '☑ Observe vigorous bubbling — oxygen gas being collected by water displacement.',
      '☑ Test the collected gas with a glowing splint — it should relight brightly.'
    ],
    outcome: 'Vigorous effervescence is observed. A glowing splint relights in the collected gas, confirming the presence of O₂.  The solution level in the gas jar drops as O₂ displaces water.',
    conclusion: 'Oxygen gas is produced by catalytic decomposition: 2H₂O₂ → 2H₂O + O₂↑ (MnO₂ catalyst).',
    effect: 'bubbles', liquidColor: '#d0ecff', bgColor: '#b0d8f8'
  },
  'calcium_carbonate+hydrochloric_acid': {
    title: 'Preparation of Carbon Dioxide', class: 10,
    aim: 'To prepare and collect carbon dioxide gas by reacting marble chips with dilute HCl.',
    chemicals: ['Calcium Carbonate (CaCO₃)', 'Hydrochloric Acid (HCl)'],
    equipment: ['Conical Flask', 'Delivery Tube', 'Gas Jar', 'Thistle Funnel'],
    procedure: [
      '☑ Place marble chips into the conical flask and set up the apparatus.',
      '☑ Fit the thistle funnel and delivery tube to the flask.',
      '☑ Pour dilute HCl through the thistle funnel onto the marble chips.',
      '☑ Observe vigorous bubbling as CO₂ gas is evolved.',
      '☑ Collect the gas by downward displacement of air in the gas jar.',
      '☑ Test the gas with lime water — it should turn milky white.'
    ],
    outcome: 'Brisk effervescence observed as CO₂ is produced. Lime water turns milky white (CaCO₃ precipitate formed), confirming the gas is CO₂. Marble chips visibly dissolve.',
    conclusion: 'CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂↑. Confirmed by limewater test.',
    effect: 'fizz', liquidColor: '#aed6f1', bgColor: '#d6eaf8'
  },
  'sulphuric_acid+zinc': {
    title: 'Preparation of Hydrogen Gas', class: 10,
    aim: 'To prepare hydrogen gas by the action of dilute sulphuric acid on zinc.',
    chemicals: ['Zinc (Zn)', 'Sulphuric Acid (H₂SO₄)'],
    equipment: ['Conical Flask', 'Delivery Tube', 'Test Tube', 'Thistle Funnel'],
    procedure: [
      '☑ Place zinc granules into the conical flask.',
      '☑ Fit the thistle funnel and gas collection tube.',
      '☑ Add dilute H₂SO₄ slowly through the thistle funnel.',
      '☑ Observe steady stream of colourless gas bubbling out.',
      '☑ Collect H₂ gas by upward displacement of air.',
      '☑ Apply burning splint at tube mouth — a sharp “pop” confirms hydrogen.'
    ],
    outcome: 'Steady bubbling of colourless, odourless gas. A small flame produces a sharp characteristic pop sound confirming hydrogen. Zinc granules gradually dissolve leaving a clear solution.',
    conclusion: 'Zn + H₂SO₄ → ZnSO₄ + H₂↑. The pop test is the classic confirmation for H₂.',
    effect: 'bubbles', liquidColor: '#d5d8dc', bgColor: '#eaf0fb'
  },
  'hydrochloric_acid+zinc': {
    title: 'Reaction of Acids with Metals', class: 10,
    aim: 'To study the reaction of dilute acids with metals like zinc.',
    chemicals: ['Zinc (Zn)', 'Hydrochloric Acid (HCl)'],
    equipment: ['Beaker', 'Test Tube', 'Tripod Stand', 'Burner'],
    procedure: [
      '☑ Place clean zinc pieces into a dry test tube.',
      '☑ Add 5 mL of dilute HCl carefully to the zinc.',
      '☑ Observe vigorous effervescence immediately.',
      '☑ Gently warm the tube if the reaction slows.',
      '☑ Test the evolved H₂ gas — burning splint produces a pop.'
    ],
    outcome: 'Vigorous bubbling (H₂ gas) is immediately visible. The solution warms slightly. Zinc gradually dissolves forming a colourless ZnCl₂ solution. Burning splint test produces a characteristic pop.',
    conclusion: 'Zn + 2HCl → ZnCl₂ + H₂↑. Metals above H in reactivity series displace H₂ from dilute acids.',
    effect: 'bubbles', liquidColor: '#aed6f1', bgColor: '#d6eaf8'
  },
  'baking_soda+distilled_water+lemon_juice+vinegar': {
    title: 'pH of Solutions Using Indicators', class: 10,
    aim: 'To determine the pH of common household substances using litmus and universal indicator.',
    chemicals: ['Lemon Juice', 'Baking Soda', 'Distilled Water', 'Vinegar'],
    equipment: ['Test Tubes', 'Dropper', 'pH Paper', 'Beaker'],
    procedure: [
      '☑ Label four test tubes A, B, C, D.',
      '☑ Add lemon juice to A, baking soda solution to B, distilled water to C, vinegar to D.',
      '☑ Add 2 drops of universal indicator to each tube.',
      '☑ Observe and record the colour change in each tube.',
      '☑ Match colours against the pH chart to determine pH values.'
    ],
    outcome: 'A (lemon juice): red-orange (pH ≈2–3). B (baking soda): blue-green (pH ≈8–9). C (distilled water): green (pH 7). D (vinegar): orange (pH ≈3–4). Clear colour differentiation confirms indicator change.',
    conclusion: 'Universal indicator changes colour with pH: red/orange = acidic, green = neutral, blue/violet = basic.',
    effect: 'dissolve', liquidColor: '#f0d060', bgColor: '#f9f0cc'
  },
  'distilled_water+sodium_sulphate': {
    title: 'Electrolysis of Water', class: 10,
    aim: 'To demonstrate the electrolysis of water into hydrogen and oxygen.',
    chemicals: ['Distilled Water (H₂O)', 'Sodium Sulphate (Na₂SO₄)'],
    equipment: ['Electrolytic Cell', 'Battery', 'Connecting Wires', 'Test Tubes'],
    procedure: [
      'Fill the electrolytic cell with water and dissolve sodium sulphate to increase conductivity.',
      'Connect the battery to the electrodes.',
      'Fill both test tubes with the solution and invert them over each electrode.',
      'Switch on the current and observe gas collection at each electrode.',
      'Collect and test both gases — H₂ at cathode, O₂ at anode.'
    ],
    conclusion: 'Water splits into H₂ (cathode, double volume) and O₂ (anode) during electrolysis.'
  },
  'common_salt+sodium_hydroxide+vegetable_oil': {
    title: 'Soap Saponification Reaction', class: 10,
    aim: 'To prepare soap by saponification of vegetable oil with NaOH.',
    chemicals: ['Vegetable Oil', 'Sodium Hydroxide (NaOH)', 'Common Salt (NaCl)'],
    equipment: ['Beaker', 'Burner', 'Tripod Stand', 'Glass Rod', 'Evaporating Dish'],
    procedure: [
      'Take 20 mL of vegetable oil in a beaker.',
      'Add 20 mL of concentrated NaOH solution.',
      'Heat the mixture while stirring continuously.',
      'Continue stirring until the mixture thickens (saponification).',
      'Add saturated common salt solution to precipitate the soap.',
      'Filter and collect the soap formed.'
    ],
    conclusion: 'Fats react with NaOH in a saponification reaction to produce soap and glycerol.'
  },
  'hydrochloric_acid+phenolphthalein+sodium_hydroxide': {
    title: 'Titration: HCl vs NaOH', class: 11,
    aim: 'To determine the strength of hydrochloric acid by titrating against standard NaOH solution.',
    chemicals: ['Hydrochloric Acid (HCl)', 'Sodium Hydroxide (NaOH)', 'Phenolphthalein'],
    equipment: ['Burette', 'Pipette', 'Conical Flask', 'Burette Stand', 'White Tile'],
    procedure: [
      'Fill the burette with standard NaOH solution (0.1 M).',
      'Pipette 20 mL of HCl into a conical flask.',
      'Add 2–3 drops of phenolphthalein indicator.',
      'Titrate slowly, swirling after each addition.',
      'Note the endpoint when the pink colour persists for 30 seconds.',
      'Repeat for concordant readings.'
    ],
    conclusion: 'At equivalence point, moles of acid equal moles of base; the indicator changes colour permanently.'
  },
  'copper_sulphate+potassium_iodide+sodium_thiosulphate+starch_solution': {
    title: 'Iodometric Titration', class: 11,
    aim: 'To estimate the amount of copper in a given solution by iodometric titration.',
    chemicals: ['Copper Sulphate (CuSO₄)', 'Potassium Iodide (KI)', 'Sodium Thiosulphate', 'Starch Solution'],
    equipment: ['Burette', 'Conical Flask', 'Pipette', 'Burette Stand'],
    procedure: [
      'Pipette the copper sulphate solution into a conical flask.',
      'Add excess KI solution — the solution turns brown (I₂ released).',
      'Fill the burette with sodium thiosulphate solution.',
      'Titrate until the brown colour fades to pale yellow.',
      'Add starch indicator — the solution turns blue.',
      'Continue titration until blue colour just disappears.'
    ],
    conclusion: 'Cu²⁺ oxidises I⁻ to I₂, which is then titrated with thiosulphate; starch acts as endpoint indicator.'
  },
  'distilled_water+iron_filings+sulphuric_acid': {
    title: 'Preparation of FeSO₄·7H₂O Crystals', class: 11,
    aim: 'To prepare crystals of ferrous sulphate from iron and dilute sulphuric acid.',
    chemicals: ['Iron Filings (Fe)', 'Sulphuric Acid (H₂SO₄)', 'Distilled Water'],
    equipment: ['Beaker', 'Burner', 'Funnel', 'Filter Paper', 'Evaporating Dish'],
    procedure: [
      'Add iron filings to dilute sulphuric acid in a beaker.',
      'Heat gently until effervescence stops (all iron is consumed).',
      'Filter the solution to remove excess iron.',
      'Evaporate the filtrate on a water bath to concentrate it.',
      'Allow to cool slowly — green crystals of FeSO₄·7H₂O appear.',
      'Filter and dry the crystals.'
    ],
    conclusion: 'Iron reacts with H₂SO₄ to form ferrous sulphate; crystallisation gives pale green monoclinic crystals.'
  },
  'acetone+petroleum_ether+spinach_extract': {
    title: 'Chromatography of Plant Pigments', class: 11,
    aim: 'To separate plant pigments using paper chromatography.',
    chemicals: ['Acetone', 'Petroleum Ether', 'Spinach Extract'],
    equipment: ['Chromatography Paper', 'Beaker', 'Pencil', 'Ruler'],
    procedure: [
      'Extract pigments by grinding spinach with acetone.',
      'Draw a baseline with pencil 2 cm from bottom of paper.',
      'Apply a concentrated spot of extract on the baseline.',
      'Place the paper in the chromatography jar with solvent (petroleum ether:acetone 9:1).',
      'Allow solvent to rise, then remove and mark solvent front.',
      'Calculate Rf values for each pigment band.'
    ],
    conclusion: 'Different plant pigments (chlorophyll a & b, carotenoids) are separated by their different Rf values.'
  },
  'calcium_chloride+copper_chloride+potassium_chloride+sodium_chloride': {
    title: 'Flame Test for Metal Ions', class: 11,
    aim: 'To identify metal ions by observing their characteristic flame colours.',
    chemicals: ['Sodium Chloride (NaCl)', 'Potassium Chloride (KCl)', 'Copper Chloride (CuCl₂)', 'Calcium Chloride (CaCl₂)'],
    equipment: ['Nichrome Wire', 'Bunsen Burner', 'Test Tubes', 'HCl (cleaning)'],
    procedure: [
      'Clean the nichrome wire by dipping in HCl and heating until no colour appears.',
      'Dip the wire in NaCl solution and hold in flame — observe yellow flame.',
      'Repeat with KCl — observe violet/lilac flame.',
      'Test CuCl₂ — observe blue-green flame.',
      'Test CaCl₂ — observe brick-red flame.',
      'Record all colours and match to the activity series.'
    ],
    conclusion: 'Each metal ion gives a characteristic flame colour due to electronic transitions at specific wavelengths.'
  },
  'ethanol+sulphuric_acid': {
    title: "Williamson's Ether Synthesis", class: 12,
    aim: 'To synthesise diethyl ether from ethanol using sulphuric acid (dehydration).',
    chemicals: ['Ethanol (C₂H₅OH)', 'Sulphuric Acid (H₂SO₄)'],
    equipment: ['Round Bottom Flask', 'Condenser', 'Burner', 'Retort Stand', 'Thermometer'],
    procedure: [
      'Set up the distillation apparatus with round bottom flask and condenser.',
      'Add 30 mL ethanol to the flask and cool with ice.',
      'Slowly add concentrated H₂SO₄ (10 mL) with swirling (acid into ethanol).',
      'Heat the mixture to 140°C — ether is produced by intermolecular dehydration.',
      'Collect the distillate in a flask kept in ice bath.',
      'Wash the ether with water to remove acid impurities.'
    ],
    conclusion: 'At 140°C, H₂SO₄ catalyses intermolecular dehydration of ethanol to form diethyl ether.'
  },
  'acetic_anhydride+distilled_water+phosphoric_acid+salicylic_acid': {
    title: 'Preparation of Aspirin', class: 12,
    aim: 'To synthesise aspirin (acetylsalicylic acid) from salicylic acid and acetic anhydride.',
    chemicals: ['Salicylic Acid', 'Acetic Anhydride', 'Phosphoric Acid', 'Distilled Water'],
    equipment: ['Conical Flask', 'Beaker', 'Burner', 'Thermometer', 'Filter Paper', 'Funnel'],
    procedure: [
      'Weigh 2 g of salicylic acid into a dry conical flask.',
      'Add 3 mL of acetic anhydride and 5 drops of phosphoric acid (catalyst).',
      'Heat at 85°C for 15 minutes with occasional swirling.',
      'Cool and add 20 mL distilled water cautiously (to decompose excess anhydride).',
      'Filter the white precipitate of aspirin under suction.',
      'Recrystallise from hot water and dry in an oven.'
    ],
    conclusion: 'Salicylic acid undergoes acetylation with acetic anhydride to yield acetylsalicylic acid (aspirin).'
  },
  'acetaldehyde+distilled_water+sodium_hydroxide': {
    title: 'Aldol Condensation', class: 12,
    aim: 'To carry out the aldol condensation of acetaldehyde in the presence of NaOH.',
    chemicals: ['Acetaldehyde (CH₃CHO)', 'Sodium Hydroxide (NaOH)', 'Distilled Water'],
    equipment: ['Conical Flask', 'Ice Bath', 'Thermometer', 'Separating Funnel'],
    procedure: [
      'Cool acetaldehyde to below 10°C in an ice bath.',
      'Add dilute NaOH solution (10%) dropwise with stirring.',
      'Maintain temperature below 20°C throughout the addition.',
      'Observe the formation of a yellow oily product (acetaldol = β-hydroxybutyraldehyde).',
      'Heat the product gently to 80°C to obtain crotonaldehyde by dehydration.',
      'Note the characteristic smell and yellow colour of the final product.'
    ],
    conclusion: 'NaOH catalyses self-condensation of acetaldehyde to form aldol; heating causes dehydration to crotonaldehyde.'
  },
  'ascorbic_acid+iodine_solution+lemon_juice+starch_solution': {
    title: 'Estimation of Vitamin C', class: 12,
    aim: 'To estimate the amount of vitamin C (ascorbic acid) in fruit juice by iodine titration.',
    chemicals: ['Iodine Solution', 'Starch Solution', 'Ascorbic Acid (standard)', 'Lemon Juice'],
    equipment: ['Burette', 'Conical Flask', 'Pipette', 'Burette Stand'],
    procedure: [
      'Prepare a standard iodine solution of known concentration (0.005 M).',
      'Pipette 10 mL of lemon juice into a conical flask.',
      'Add 1 mL of starch solution as indicator.',
      'Fill the burette with iodine solution.',
      'Titrate slowly until the blue-black colour persists for 30 seconds.',
      'Calculate the amount of ascorbic acid from the titration volume.'
    ],
    conclusion: 'Ascorbic acid reduces iodine; the endpoint is detected by the starch-iodine blue colour that persists.'
  },
  'hexane_1_6_diamine+hexanedioyl_chloride+sodium_carbonate': {
    title: 'Nylon 6,6 Synthesis', class: 12,
    aim: 'To synthesise nylon 6,6 at the interface of two immiscible solutions.',
    chemicals: ['Hexanedioyl Chloride (adipoyl chloride)', 'Hexane-1,6-diamine', 'Sodium Carbonate'],
    equipment: ['Beaker', 'Glass Rod', 'Forceps', 'Test Tube'],
    procedure: [
      'Dissolve hexane-1,6-diamine in water with sodium carbonate in a beaker.',
      'Carefully layer a solution of hexanedioyl chloride in cyclohexane on top.',
      'Use forceps to pull the nylon film forming at the interface gently.',
      'Wind the polymer thread continuously onto a glass rod.',
      'Wash the nylon with water and then acetone.',
      'Observe the strength and fibrous properties of the polymer formed.'
    ],
    conclusion: 'Condensation polymerisation at the interface produces nylon 6,6 fibres that can be drawn continuously.'
  },
  'fehling_solution+sodium_bicarbonate+tollens_reagent+unknown_organic': {
    title: 'Test for Functional Groups', class: 12,
    aim: 'To identify the functional groups present in unknown organic compounds.',
    chemicals: ['Unknown Organic Compound', 'Fehling Solution', "Tollens' Reagent", 'Sodium Bicarbonate'],
    equipment: ['Test Tubes', 'Test Tube Rack', 'Dropper', 'Burner', 'Water Bath'],
    procedure: [
      'Take the unknown organic compound in separate test tubes.',
      'Sodium bicarbonate test: add Na₂CO₃ — effervescence indicates carboxylic acid.',
      "Fehling's test: heat with Fehling solution — brick red precipitate indicates aldehyde.",
      "Tollens' test: heat with silver nitrate + ammonia — silver mirror indicates aldehyde.",
      'Lucas test (for alcohol type): note time for turbidity (tertiary = immediate).',
      'Record all observations systematically in the table.'
    ],
    conclusion: 'Different functional groups give characteristic positive tests allowing identification of unknown compounds.'
  }
};

async function fetchDataset() {
    console.log('🔄 Loading dataset...');
    
    // First try: Backend endpoint Check
    try {
        const res = await fetch('http://localhost:8080/dataset');
        if (res.ok) {
            const data = await res.json();
            DB.chemicals = data.chemicals || {};
            DB.reactions = data.reactions || {};
            DB.shelfOrder = data.shelfOrder || [];
            buildShelf();
            console.log('✅ Loaded from backend');
            return;
        }
    } catch(e) {
        console.log('Backend not available natively');
    }

    // Second try: /dataset directly
    try {
        const res = await fetch('/dataset');
        if (res.ok) {
            const data = await res.json();
            DB.chemicals = data.chemicals || {};
            DB.reactions = data.reactions || {};
            DB.shelfOrder = data.shelfOrder || [];
            buildShelf();
            console.log('✅ Loaded from /dataset route');
            return;
        }
    } catch(e) {}

    // Third try: Correct relative path
    try {
        const response = await fetch('../data/reactions.json');
        if (response.ok) {
            const data = await response.json();
            DB.chemicals = data.chemicals || {};
            DB.reactions = data.reactions || {};
            DB.shelfOrder = data.shelfOrder || [];
            buildShelf();
            console.log('✅ Loaded from ../data/reactions.json');
            return;
        }
    } catch(e) {}
    
    // Fourth try: Fallback local location
    try {
        const response = await fetch('reactions.json');
        if (response.ok) {
            const data = await response.json();
            DB.chemicals = data.chemicals || {};
            DB.reactions = data.reactions || {};
            DB.shelfOrder = data.shelfOrder || [];
            buildShelf();
            console.log('✅ Loaded from reactions.json');
            return;
        }
    } catch(e) {}
    
    console.error('❌ Could not load dataset from anywhere!');
    showToast('⚠️ Could not load chemicals. Make sure reactions.json is accessible!');
}
/* ══════════════════════════════════════════════════
   STATE
══════════════════════════════════════════════════ */
let selectedChemicals = [];   // { id, name, color }
let selectedTools     = [];   // { name, icon, isSafety }
let pouredChemicals   = [];   // chemicals added to vessel — SINGLE SOURCE OF TRUTH for reaction lookup
let vesselType        = null;
let temperature       = 25;
let hasReacted        = false; // Tracks if the current vessel contents have been reacted
let isReacting        = false;
let isPouring         = false;
let speechRecog       = null;

/* ══════════════════════════════════════════════════
   BUG FIX 1: REACTION LOOKUP uses pouredChemicals
   When called from startReaction → uses all poured IDs
   When called from refreshBoard  → uses all selected IDs (preview only)
══════════════════════════════════════════════════ */
function createDefaultReaction(ids) {
  if (!ids || ids.length === 0) {
    return {
      title: "Unknown Reaction",
      formula: "No chemicals \u2192 ?",
      sub: "Add chemicals to observe an effect",
      badge: "EMPTY",
      badgeColor: "#cccccc",
      effect: "none",
      liquidColor: "rgba(200,240,255,0.1)",
      bgColor: "#eeeeee",
      overview: "No chemicals have been added yet.",
      chemNames: "",
      tools: "",
      safety: "",
      steps: [],
      observation: "Nothing to observe.",
      requiredSafety: ["Goggles"]
    };
  }
  const names = ids.map(id => DB.chemicals[id] ? DB.chemicals[id].name : id);
  return {
      title: "Chemical Mixture",
      formula: ids.join(" + ") + " \u2192 Mixture",
      sub: "No violent reaction | Stable Mixture",
      badge: "MIXTURE",
      badgeColor: "#a0a0a0",
      effect: "dissolve",
      liquidColor: "rgba(180,200,220,0.8)",
      bgColor: "#d0e0f0",
      overview: "These chemicals mix together without a strongly defined reaction in the database.",
      chemNames: names.map(n => '\u2022 ' + n).join('<br>'),
      tools: "\u2022 Beaker",
      safety: "\u2022 Goggles  \u2022 Gloves",
      steps: [
        "Mix the chemicals gently.",
        "Observe the mixture for any delayed changes."
      ],
      observation: "A stable mixture is formed with no immediate vigorous reaction. The outcome is safe.",
      requiredSafety: ["Goggles", "Gloves"]
  };
}

function lookupReaction(ids) {
  if (!ids || ids.length === 0) return createDefaultReaction([]);
  const sorted = [...ids].sort();
  const keys = [];

  // 1. Try the full combination key first
  keys.push(sorted.join('+'));

  // 2. Try all pairs if 3+ chemicals selected
  if (sorted.length >= 3) {
    for (let i = 0; i < sorted.length; i++)
      for (let j = i + 1; j < sorted.length; j++)
        keys.push([sorted[i], sorted[j]].sort().join('+'));
  }

  // 3. Try singles ONLY if there is exactly one chemical
  if (sorted.length === 1) {
    sorted.forEach(id => keys.push(id));
  }

  for (const k of keys) if (DB.reactions[k]) return DB.reactions[k];
  return DB.reactions['DEFAULT'] || createDefaultReaction(ids);
}

/* ══════════════════════════════════════════════════
   REGISTRATION
══════════════════════════════════════════════════ */
document.getElementById('reg-form').addEventListener('submit', function (e) {
  e.preventDefault();
  const nameIn  = document.getElementById('student-name');
  const rollIn  = document.getElementById('roll-number');
  const nameErr = document.getElementById('name-error');
  const rollErr = document.getElementById('roll-error');
  nameErr.textContent = ''; rollErr.textContent = '';
  nameIn.classList.remove('input-error'); rollIn.classList.remove('input-error');
  let valid = true;
  if (!nameIn.value.trim()) { nameErr.textContent = '⚠️ Name cannot be empty.'; nameIn.classList.add('input-error'); valid = false; }
  if (!/^\d{4}$/.test(rollIn.value.trim())) { rollErr.textContent = '⚠️ Roll number must be exactly 4 digits.'; rollIn.classList.add('input-error'); valid = false; }
  if (!valid) return;
  document.getElementById('badge-name').textContent = nameIn.value.trim();
  document.getElementById('badge-roll').textContent = 'Roll: ' + rollIn.value.trim();
  const reg = document.getElementById('registration-screen');
  const lab = document.getElementById('lab-room');
  reg.style.transition = 'opacity .5s'; reg.style.opacity = '0';
  setTimeout(() => {
    reg.style.display = 'none'; lab.classList.remove('hidden');
    lab.style.opacity = '0'; lab.style.transition = 'opacity .5s';
    setTimeout(() => { lab.style.opacity = '1'; }, 20);
  }, 500);
  showToast('👋 Welcome, ' + nameIn.value.trim() + '! Lab is ready.');
  setStatus('🔬 Select chemicals → pick a vessel → Pour → React!');
});

/* ══════════════════════════════════════════════════
   SHELF BUILDER — all 10 chemicals, 3 per row → scrollable
   BUG FIX 3: Each chemical is an independent bottle,
   groups by 3 into shelf planks for the shelf aesthetic.
══════════════════════════════════════════════════ */
function buildShelf() {
  const area = document.getElementById('shelf-scroll-area');
  area.innerHTML = '';
  const ids = DB.shelfOrder;
  const PER_ROW = 3;

  for (let i = 0; i < ids.length; i += PER_ROW) {
    const rowIds = ids.slice(i, i + PER_ROW);
    const unit = document.createElement('div');
    unit.className = 'shelf-unit';

    const bottlesRow = document.createElement('div');
    bottlesRow.className = 'bottles-row';

    rowIds.forEach(id => {
      const chem = DB.chemicals[id];
      const bottleDiv = document.createElement('div');
      bottleDiv.className  = 'bottle';
      bottleDiv.dataset.id   = id;
      bottleDiv.dataset.name = chem.name;
      bottleDiv.dataset.color= chem.color;
      bottleDiv.dataset.type = chem.type || '';
      bottleDiv.title        = chem.name + ' (' + chem.type + ')';
      bottleDiv.setAttribute('onclick', 'selectChemical(this)');

      /* Store searchable text in data attribute for filtering */
      bottleDiv.dataset.search = (chem.name + ' ' + chem.formula + ' ' + id + ' ' + (chem.type||'')).toLowerCase();

      bottleDiv.innerHTML = `
        <div class="bottle-cap" style="background:${chem.capColor}"></div>
        <div class="bottle-neck"></div>
        <div class="bottle-body">
          <div class="bottle-liquid" style="background:linear-gradient(180deg,${chem.color}88,${chem.color})"></div>
          <div class="bottle-sheen"></div>
        </div>
        <div class="bottle-label" title="${chem.name}">${chem.formula}</div>
        <div class="bottle-glow" style="background:${chem.color}"></div>`;
      bottlesRow.appendChild(bottleDiv);
    });

    unit.appendChild(bottlesRow);
    area.appendChild(unit);
  }
}

/* ══════════════════════════════════════════════════
   CHEMICAL SELECTION
══════════════════════════════════════════════════ */
function selectChemical(el) {
  const id    = el.dataset.id;
  const name  = el.dataset.name;
  const color = el.dataset.color;
  const chem  = DB.chemicals && DB.chemicals[id];
  const capColor = chem ? chem.capColor : color;

  if (el.classList.contains('selected')) {
    el.classList.remove('selected');
    selectedChemicals = selectedChemicals.filter(c => c.id !== id);
    /* Remove the chip from the selected strip */
    const chip = document.getElementById('chip-' + id);
    if (chip) chip.remove();
  } else {
    el.classList.add('selected');
    if (!selectedChemicals.find(c => c.id === id)) {
      selectedChemicals.push({ id, name, color, capColor });
      /* Add mini chip to the selected strip */
      const strip = document.getElementById('selected-chemical-display');
      const empty = document.getElementById('scd-empty');
      if (empty) empty.style.display = 'none';
      const chip = document.createElement('div');
      chip.id        = 'chip-' + id;
      chip.className = 'table-bottle';
      chip.style.borderColor = capColor || color;
      chip.innerHTML = `<div class="t-liquid" style="background:${color}"></div><div class="t-label">${id}</div>`;
      strip.appendChild(chip);
    }
  }

  document.getElementById('pour-chemical').disabled = selectedChemicals.length === 0;
  const previewIds = pouredChemicals.map(c => c.id).concat(selectedChemicals.filter(c => !pouredChemicals.find(p => p.id === c.id)).map(c => c.id));
  if (previewIds.length > 0) refreshBoardFromIds(previewIds);
  updateStatusBar();
}

/* ══════════════════════════════════════════════════
   SEARCH — filters bottles by name/formula/id
══════════════════════════════════════════════════ */
function filterBottles(query) {
  const q = query.trim().toLowerCase();
  const clearBtn = document.getElementById('chem-search-clear');
  const noResult = document.getElementById('search-no-result');
  clearBtn.style.display = q ? '' : 'none';

  const bottles = document.querySelectorAll('#shelf-scroll-area .bottle');
  let anyVisible = false;

  bottles.forEach(b => {
    const match = !q || b.dataset.search.includes(q);
    b.style.display = match ? '' : 'none';
    if (match) anyVisible = true;
  });

  /* Hide/show entire shelf-unit if all its bottles are hidden */
  document.querySelectorAll('#shelf-scroll-area .shelf-unit').forEach(unit => {
    const visibleBottles = unit.querySelectorAll('.bottle:not([style*="display: none"])');
    unit.style.display = visibleBottles.length === 0 ? 'none' : '';
  });

  noResult.classList.toggle('hidden', anyVisible);
}

function clearSearch() {
  const inp = document.getElementById('chem-search');
  inp.value = '';
  filterBottles('');
  inp.focus();
}

/* ══════════════════════════════════════════════════
   SELECTED CHEMICAL DISPLAY — mini bottles in "SELECTED:" strip
══════════════════════════════════════════════════ */
function updateSelectedDisplay() {
  const c = document.getElementById('selected-chemical-display');
  if (!c) return;
  const empty = document.getElementById('scd-empty');
  
  // Remove existing bottles that aren't labels/empty
  Array.from(c.children).filter(el => !el.classList.contains('scd-label') && !el.classList.contains('scd-empty')).forEach(el => el.remove());
  
  if (empty) empty.style.display = selectedChemicals.length === 0 ? '' : 'none';
  
  selectedChemicals.forEach(chem => {
    let b = document.createElement('div');
    b.className = 'table-bottle';
    b.dataset.id = chem.id;
    b.style.borderColor = chem.capColor || chem.color;
    b.innerHTML = `<div class="t-liquid" style="background:${chem.color}"></div><div class="t-label">${chem.id}</div>`;
    c.appendChild(b);
  });
  updateStatusBar();
}

function refreshBoardFromIds(ids) {
  if (ids.length === 0) return;
  const rxn = lookupReaction(ids);
  
  if (!hasReacted) {
    updateWorkbenchBoard({
      badge: "PREPARING MIXTURE",
      badgeColor: "#cccccc",
      formula: ids.join(" + ") + " \u2192 ?",
      sub: "Add all required chemicals, select a vessel, and click ▶ React!"
    });
  } else {
    // If it already reacted and we are just refreshing (though theoretically we'd just want to keep the final board)
    updateWorkbenchBoard(rxn);
  }

  updateBlackboard(rxn);
  renderSafetyPanel(rxn.requiredSafety);
}

const typewriterTimeouts = { main: null, sub: null };

function typewriterEffect(elementId, text, speed = 40, timeoutRefObj, timeoutRefKey) {
  const element = document.getElementById(elementId);
  if(!element) return;
  element.innerHTML = '';
  let i = 0;
  if(timeoutRefObj[timeoutRefKey]) clearTimeout(timeoutRefObj[timeoutRefKey]);
  
  function type() {
    if (i < text.length) {
      element.innerHTML += text.charAt(i);
      i++;
      timeoutRefObj[timeoutRefKey] = setTimeout(type, speed + Math.random() * 20);
    }
  }
  type();
}

function updateWorkbenchBoard(rxn) {
  const badge = document.getElementById('eq-type-badge');
  badge.textContent       = rxn.badge;
  badge.style.color       = rxn.badgeColor;
  badge.style.borderColor = rxn.badgeColor;
  badge.style.background  = rxn.badgeColor + '22';
  
  typewriterEffect('eq-main', rxn.formula || '', 30, typewriterTimeouts, 'main');
  typewriterEffect('eq-sub', rxn.sub || '', 20, typewriterTimeouts, 'sub');
}

/* ══════════════════════════════════════════════════
   TOOL SELECTION
══════════════════════════════════════════════════ */
const VESSEL_TOOLS = ['Beaker', 'Test Tube', 'Flask'];

function selectTool(el) {
  const name     = el.dataset.name;
  const isSafety = el.dataset.safety === 'true';
  el.classList.toggle('selected');

  if (el.classList.contains('selected')) {
    if (!selectedTools.find(t => t.name === name)) {
      selectedTools.push({ name, isSafety });
      if (VESSEL_TOOLS.includes(name)) {
        VESSEL_TOOLS.forEach(vn => {
          if (vn !== name) {
            const ve = document.querySelector('.tool-item[data-name="' + vn + '"]');
            if (ve && ve.classList.contains('selected')) {
              ve.classList.remove('selected');
              selectedTools = selectedTools.filter(t => t.name !== vn);
            }
          }
        });
        vesselType = name;
        renderVessel(name, null);
        showToast('🧫 ' + name + ' placed on table');
      } else if (isSafety) {
        updateSafetyChip(name, true);
        showToast('🛡️ Safety gear: ' + name);
      } else {
        showToast('🔧 Tool added: ' + name);
      }
    }
  } else {
    selectedTools = selectedTools.filter(t => t.name !== name);
    if (VESSEL_TOOLS.includes(name)) { vesselType = null; clearVessel(); }
    if (isSafety) updateSafetyChip(name, false);
  }
  updateStatusBar();
}

/* ══════════════════════════════════════════════════
   VESSEL SVG — renders beaker/test-tube/flask
══════════════════════════════════════════════════ */
function renderVessel(type, layers) {
  const wrap = document.getElementById('vessel-wrap');
  const ph   = document.getElementById('vessel-placeholder');
  if (ph) ph.style.display = 'none';
  const old = document.getElementById('vessel-svg');
  if (old) old.remove();
  const svgMap = { 'Beaker': buildBeakerSVG, 'Test Tube': buildTestTubeSVG, 'Flask': buildFlaskSVG };
  const fn = svgMap[type];
  if (fn) wrap.insertAdjacentHTML('afterbegin', fn(layers));
}

function clearVessel() {
  const ph  = document.getElementById('vessel-placeholder');
  const svg = document.getElementById('vessel-svg');
  if (svg) svg.remove();
  if (ph)  ph.style.display = '';
}

function buildBeakerSVG(layers) {
  const col = layers && layers.length ? layers[layers.length-1].color : 'rgba(200,240,255,0.1)';
  const fh  = layers ? Math.min(layers.length * 16, 54) : 0;
  return `<svg id="vessel-svg" viewBox="0 0 100 100" width="90" height="90" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 8px 10px rgba(0,0,0,0.4));">
    <defs>
      <linearGradient id="bkLiq" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${col};stop-opacity:0.95"/>
        <stop offset="100%" style="stop-color:${col};stop-opacity:0.75"/>
      </linearGradient>
      <linearGradient id="bkGlass" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:rgba(255,255,255,0.6)"/>
        <stop offset="15%" style="stop-color:rgba(255,255,255,0.1)"/>
        <stop offset="85%" style="stop-color:rgba(255,255,255,0.05)"/>
        <stop offset="100%" style="stop-color:rgba(255,255,255,0.4)"/>
      </linearGradient>
    </defs>
    <!-- Liquid -->
    <path d="M22 ${90-fh} L22 82 Q22 92 32 92 L68 92 Q78 92 78 82 L78 ${90-fh} Z" fill="url(#bkLiq)"/>
    <!-- Glass back -->
    <path d="M22 10 L22 82 Q22 92 32 92 L68 92 Q78 92 78 82 L78 10 Z" fill="rgba(255,255,255,0.05)" stroke="rgba(180,220,255,0.8)" stroke-width="2.5"/>
    <path d="M22 10 L22 82 Q22 92 32 92 L68 92 Q78 92 78 82 L78 10 Z" fill="url(#bkGlass)"/>
    <!-- Rim -->
    <rect x="18" y="6" width="64" height="6" rx="3" fill="rgba(200,240,255,0.5)" stroke="rgba(180,220,255,0.9)" stroke-width="1.5"/>
    <line x1="72" y1="28" x2="78" y2="28" stroke="rgba(200,240,255,0.7)" stroke-width="1.5"/>
    <line x1="72" y1="44" x2="78" y2="44" stroke="rgba(200,240,255,0.7)" stroke-width="1.5"/>
    <line x1="72" y1="60" x2="78" y2="60" stroke="rgba(200,240,255,0.7)" stroke-width="1.5"/>
    <line x1="72" y1="76" x2="78" y2="76" stroke="rgba(200,240,255,0.7)" stroke-width="1.5"/>
    <!-- Specular Highlight -->
    <path d="M25 15 L25 80" stroke="rgba(255,255,255,0.7)" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.8"/>
  </svg>`;
}

function buildTestTubeSVG(layers) {
  const col = layers && layers.length ? layers[layers.length-1].color : 'rgba(200,240,255,0.1)';
  const fh  = layers ? Math.min(layers.length * 14, 54) : 0;
  return `<svg id="vessel-svg" viewBox="0 0 60 110" width="55" height="100" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 6px 8px rgba(0,0,0,0.3));">
    <defs>
      <linearGradient id="ttLiq" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${col};stop-opacity:0.95"/>
        <stop offset="100%" style="stop-color:${col};stop-opacity:0.75"/>
      </linearGradient>
      <linearGradient id="ttGlass" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:rgba(255,255,255,0.6)"/>
        <stop offset="15%" style="stop-color:rgba(255,255,255,0.1)"/>
        <stop offset="85%" style="stop-color:rgba(255,255,255,0.05)"/>
        <stop offset="100%" style="stop-color:rgba(255,255,255,0.4)"/>
      </linearGradient>
    </defs>
    <path d="M14 ${100-fh} L14 94 Q14 108 30 108 Q46 108 46 94 L46 ${100-fh} Z" fill="url(#ttLiq)"/>
    <path d="M14 6 L14 94 Q14 108 30 108 Q46 108 46 94 L46 6 Z" fill="rgba(255,255,255,0.05)" stroke="rgba(180,220,255,0.8)" stroke-width="2.5"/>
    <path d="M14 6 L14 94 Q14 108 30 108 Q46 108 46 94 L46 6 Z" fill="url(#ttGlass)"/>
    <rect x="10" y="3" width="40" height="6" rx="2" fill="rgba(200,240,255,0.5)" stroke="rgba(180,220,255,0.9)" stroke-width="1.5"/>
    <line x1="42" y1="30" x2="46" y2="30" stroke="rgba(200,240,255,0.7)" stroke-width="1.5"/>
    <line x1="42" y1="50" x2="46" y2="50" stroke="rgba(200,240,255,0.7)" stroke-width="1.5"/>
    <line x1="42" y1="70" x2="46" y2="70" stroke="rgba(200,240,255,0.7)" stroke-width="1.5"/>
    <!-- Specular -->
    <path d="M17 12 L17 90" stroke="rgba(255,255,255,0.7)" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.8"/>
  </svg>`;
}

function buildFlaskSVG(layers) {
  const col = layers && layers.length ? layers[layers.length-1].color : 'rgba(200,240,255,0.1)';
  const fh  = layers ? Math.min(layers.length * 12, 44) : 0;
  return `<svg id="vessel-svg" viewBox="0 0 100 110" width="88" height="100" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 8px 10px rgba(0,0,0,0.4));">
    <defs>
      <linearGradient id="flLiq" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${col};stop-opacity:0.95"/>
        <stop offset="100%" style="stop-color:${col};stop-opacity:0.75"/>
      </linearGradient>
      <linearGradient id="flGlass" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:rgba(255,255,255,0.6)"/>
        <stop offset="15%" style="stop-color:rgba(255,255,255,0.1)"/>
        <stop offset="85%" style="stop-color:rgba(255,255,255,0.05)"/>
        <stop offset="100%" style="stop-color:rgba(255,255,255,0.4)"/>
      </linearGradient>
    </defs>
    <path d="M18 ${100-fh} Q12 ${100-fh+6} 10 96 Q10 110 50 110 Q90 110 90 96 Q88 ${100-fh+6} 82 ${100-fh} Z" fill="url(#flLiq)"/>
    <path d="M38 10 L38 42 L10 96 Q10 110 50 110 Q90 110 90 96 L62 42 L62 10 Z" fill="rgba(255,255,255,0.05)" stroke="rgba(180,220,255,0.8)" stroke-width="2.5"/>
    <path d="M38 10 L38 42 L10 96 Q10 110 50 110 Q90 110 90 96 L62 42 L62 10 Z" fill="url(#flGlass)"/>
    <rect x="32" y="6" width="36" height="6" rx="2" fill="rgba(200,240,255,0.5)" stroke="rgba(180,220,255,0.9)" stroke-width="1.5"/>
    <!-- Specular Highlight -->
    <path d="M41 14 L41 40 L16 88" stroke="rgba(255,255,255,0.7)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.8"/>
  </svg>`;
}

/* ══════════════════════════════════════════════════
   BUG FIX 2: POUR ANIMATION — 3-phase realistic pour
   Phase 1: chip slides across table toward vessel mouth
   Phase 2: chip tilts at vessel mouth position
   Phase 3: liquid bezier stream pours into vessel, then splash
══════════════════════════════════════════════════ */
function pourChemical() {
  if (isPouring) return;
  if (selectedChemicals.length === 0) { showToast('⚠️ Select a chemical first!'); return; }
  if (!vesselType) { showToast('⚠️ Select a vessel (Beaker / Test Tube / Flask) first!'); return; }

  // FIX: Only pour chemicals that haven't been poured yet
  const toPour = selectedChemicals.filter(c => !pouredChemicals.find(p => p.id === c.id));
  if (toPour.length === 0) { showToast('⚠️ Already poured these chemicals!'); return; }

  isPouring = true;
  document.getElementById('pour-chemical').disabled  = true;
  document.getElementById('start-reaction').disabled = true;

  let idx = 0;
  function pourNext() {
    if (idx >= toPour.length) {
      /* All missing chemicals have been poured — commit to state */
      toPour.forEach(chem => {
        pouredChemicals.push({ ...chem });
      });

      updateBeakerContents();
      /* Board responds to actually poured mixture */
      hasReacted = false; // New mixture forces a new reaction prep state
      refreshBoardFromIds(pouredChemicals.map(c => c.id));
      renderVessel(vesselType, pouredChemicals);

      isPouring = false;
      document.getElementById('pour-chemical').disabled  = false;
      document.getElementById('start-reaction').disabled = false;
      showToast('💧 Poured: ' + toPour.map(c => c.id).join(' + '));
      setStatus('💧 Vessel contains: ' + pouredChemicals.map(c => c.id).join(' + ') + ' — click ▶ React!');
      updateStatusBar();
      return;
    }
    animateSinglePour(toPour[idx++], pourNext);
  }
  pourNext();
}

/* Realistic pour: glide to vessel side → tilt into mouth → stream → splash → return */
function animateSinglePour(chem, onDone) {
  /*
   * STRATEGY: We create an absolutely-positioned CLONE of the chip
   * directly on #lab-table (not inside the flex strip), so CSS
   * transforms work purely in table-local coordinates with no
   * flex/overflow clipping issues.
   *
   * The original chip stays in place (just dims slightly during the
   * animation). We animate the clone, then remove it when done.
   *
   * POUR SEQUENCE (realistic lab pour):
   *  1. Clone appears at chip's exact screen position
   *  2. Clone slides to the RIGHT SIDE of the vessel rim (upright)
   *  3. Clone TILTS clockwise, pivot = its own bottom-right corner,
   *     so the NECK swings left and into the vessel mouth
   *  4. Canvas stream flows from neck tip down into vessel
   *  5. Splash particles on landing
   *  6. Clone tilts back upright, fades out; original chip liquid drops
   */
  const chip = document.getElementById('chip-' + chem.id);
  if (!chip) { onDone(); return; }

  const table     = document.getElementById('lab-table');
  const tableRect = table.getBoundingClientRect();

  /* ── Where is the chip RIGHT NOW on screen? ── */
  const chipRect = chip.getBoundingClientRect();
  /* Chip position in table-local pixels */
  const chipLeft = chipRect.left - tableRect.left;
  const chipTop  = chipRect.top  - tableRect.top;
  const chipW    = chipRect.width;
  const chipH    = chipRect.height;

  /* ── Create absolute clone on #lab-table ── */
  const clone = chip.cloneNode(true);
  clone.id    = 'pour-clone-' + chem.id;
  clone.style.cssText = [
    'position:absolute',
    `left:${chipLeft}px`,
    `top:${chipTop}px`,
    `width:${chipW}px`,
    `height:${chipH}px`,
    'margin:0',
    'padding:0',
    'z-index:80',
    'pointer-events:none',
    'transition:none',
    'transform-origin:center center',
    'transform:none',
  ].join(';');
  /* Make sure table is positioned so absolute children work */
  table.style.position = 'relative';
  table.appendChild(clone);

  /* Dim the original */
  chip.style.opacity = '0.25';

  /* ── Vessel geometry (table-local) ── */
  const vessel     = document.getElementById('vessel-svg') || document.getElementById('vessel-placeholder');
  const vesselRect = vessel ? vessel.getBoundingClientRect() : tableRect;
  const rimLeft    = vesselRect.left  - tableRect.left;
  const rimRight   = vesselRect.right - tableRect.left;
  const rimTop     = vesselRect.top   - tableRect.top;
  const rimCX      = (rimLeft + rimRight) / 2;

  /*
   * ── Stage position (where clone goes BEFORE tilting) ──
   *
   * We want the clone to sit with its BASE touching the RIGHT rim of
   * the vessel and its NECK at rim-top height.  The clone's left edge
   * will be at rimRight (i.e., clone is to the RIGHT of vessel).
   *
   * Clone absolute coords (left, top) = top-left corner of clone element.
   */
  const GAP       = 6;                         /* small gap from rim edge */
  const stageLft  = rimRight + GAP;            /* clone.left  */
  const stageTop  = rimTop - chipH + chipH * 0.5; /* neck roughly at rim top */

  /* ── PHASE 1: smooth glide to stage position ── */
  requestAnimationFrame(() => {
    clone.style.transition = 'left 0.48s cubic-bezier(0.4,0,0.2,1), top 0.48s cubic-bezier(0.4,0,0.2,1)';
    clone.style.left       = stageLft + 'px';
    clone.style.top        = stageTop + 'px';
  });

  setTimeout(() => {
    /*
     * ── PHASE 2: tilt clockwise with pivot at BOTTOM-LEFT of clone ──
     *
     * Bottom-left = the base of the bottle sitting at the vessel rim.
     * Rotating CW ~95° brings the TOP-RIGHT (neck) swinging DOWN and
     * to the LEFT — into the vessel mouth.  This looks like a hand
     * holding the base and tipping the bottle forward over the rim.
     */
    clone.style.transition       = 'transform 0.42s ease-in-out';
    clone.style.transformOrigin  = 'left bottom';   /* pivot = base at rim */
    clone.style.transform        = 'rotate(-95deg)'; /* CCW so neck goes into vessel */

    setTimeout(() => {
      /*
       * ── PHASE 3: canvas pour stream ──
       *
       * After -95° CCW with pivot at (left, bottom):
       * The top-right corner (neck/cap) has swung DOWN and to the RIGHT,
       * landing roughly above the vessel center at rim height.
       *
       * Stream start ≈ vessel left rim, just inside.
       * Stream end   ≈ mid-vessel lower area.
       */
      const streamSX = rimLeft  + (rimRight - rimLeft) * 0.35;
      const streamSY = rimTop   + 8;
      const streamEX = rimCX    + (Math.random() - 0.5) * 8;
      const streamEY = rimTop   + vesselRect.height * 0.50;

      const canvas  = document.getElementById('pour-canvas');
      canvas.width  = table.offsetWidth;
      canvas.height = table.offsetHeight;
      const ctx     = canvas.getContext('2d');

      /* Gravity-arc bezier: starts at rim lip, curves down into vessel */
      const cp1x = streamSX + 10;
      const cp1y = streamSY + (streamEY - streamSY) * 0.25;
      const cp2x = streamEX + 5;
      const cp2y = streamEY - 20;

      const STREAM_MS = 720;
      const t0        = performance.now();
      const particles = [];

      function drawFrame(now) {
        const t = Math.min((now - t0) / STREAM_MS, 1);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (t < 1) {
          /* Progressive stream via line-dash trick */
          const totalLen = estimateBezierLength(streamSX, streamSY, cp1x, cp1y, cp2x, cp2y, streamEX, streamEY);
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(streamSX, streamSY);
          ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, streamEX, streamEY);
          ctx.setLineDash([totalLen * t, totalLen]);
          ctx.strokeStyle = chem.color;
          ctx.lineWidth   = 4 + Math.sin(t * Math.PI) * 2.5;
          ctx.lineCap     = 'round';
          ctx.globalAlpha = 0.9;
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();

          /* Drip dots along stream */
          for (let k = 0; k < 3; k++) {
            const dt = Math.max(0, t - k * 0.07);
            if (dt <= 0) continue;
            const [px, py] = bezierPoint(streamSX, streamSY, cp1x, cp1y, cp2x, cp2y, streamEX, streamEY, dt);
            ctx.beginPath();
            ctx.arc(px + (Math.random()-0.5)*2, py + (Math.random()-0.5)*2, 2+Math.random()*2.5, 0, Math.PI*2);
            ctx.fillStyle   = chem.color;
            ctx.globalAlpha = 0.75;
            ctx.fill();
          }
          ctx.globalAlpha = 1;
          requestAnimationFrame(drawFrame);

        } else {
          /* Splash particles at landing */
          for (let k = 0; k < 10; k++) {
            const ang = (Math.PI * 2 * k / 10) + (Math.random() - 0.5) * 0.5;
            const spd = 2 + Math.random() * 4;
            particles.push({
              x: streamEX, y: streamEY,
              vx: Math.cos(ang) * spd,
              vy: Math.sin(ang) * spd - 2.5,
              life: 1, r: 1.5 + Math.random() * 2.5
            });
          }
          let sf = 0;
          function splash() {
            sf++;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
              p.x  += p.vx;
              p.y  += p.vy;
              p.vy += 0.32;
              p.life -= 0.06;
              if (p.life > 0) {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle   = chem.color;
                ctx.globalAlpha = p.life * 0.9;
                ctx.fill();
              }
            });
            ctx.globalAlpha = 1;

            if (sf < 22 && particles.some(p => p.life > 0)) {
              requestAnimationFrame(splash);
            } else {
              ctx.clearRect(0, 0, canvas.width, canvas.height);

              /* ── Phase 4: clone tilts back upright then fades ── */
              clone.style.transition      = 'transform 0.38s ease-in-out, opacity 0.30s ease';
              clone.style.transformOrigin = 'left bottom';
              clone.style.transform       = 'rotate(0deg)';

              setTimeout(() => {
                /* Slide clone back to original chip position and fade */
                clone.style.transition = 'left 0.35s ease, top 0.35s ease, opacity 0.35s ease';
                clone.style.left       = chipLeft + 'px';
                clone.style.top        = chipTop  + 'px';
                clone.style.opacity    = '0';

                setTimeout(() => {
                  clone.remove();
                  /* Restore original chip, lower its liquid level */
                  chip.style.opacity    = '1';
                  const miniLiq = chip.querySelector('.scd-mini-liquid');
                  if (miniLiq) {
                    const cur = parseFloat(miniLiq.style.height) || 70;
                    miniLiq.style.height = Math.max(cur - 22, 6) + '%';
                    miniLiq.style.transition = 'height 0.4s ease';
                  }
                  onDone();
                }, 380);
              }, 400);
            }
          }
          requestAnimationFrame(splash);
        }
      }
      requestAnimationFrame(drawFrame);

    }, 450); /* after tilt */
  }, 520);   /* after glide */
}

/* Bezier math helpers */
function bezierPoint(x0, y0, cx1, cy1, cx2, cy2, x1, y1, t) {
  const m = 1 - t;
  return [
    m*m*m*x0 + 3*m*m*t*cx1 + 3*m*t*t*cx2 + t*t*t*x1,
    m*m*m*y0 + 3*m*m*t*cy1 + 3*m*t*t*cy2 + t*t*t*y1
  ];
}
function estimateBezierLength(x0,y0,cx1,cy1,cx2,cy2,x1,y1,steps=20) {
  let len=0, [px,py]=[x0,y0];
  for (let i=1;i<=steps;i++) {
    const [qx,qy]=bezierPoint(x0,y0,cx1,cy1,cx2,cy2,x1,y1,i/steps);
    len+=Math.hypot(qx-px,qy-py); [px,py]=[qx,qy];
  }
  return len;
}

/* ══════════════════════════════════════════════════
   BEAKER CONTENTS (layers display in vessel zone)
══════════════════════════════════════════════════ */
function updateBeakerContents() {
  const bc = document.getElementById('beaker-contents');
  bc.innerHTML = '';
  pouredChemicals.forEach(chem => {
    const layer = document.createElement('div');
    layer.className            = 'bc-layer-in-vessel';
    layer.style.background     = chem.color + 'cc';
    layer.style.color          = '#fff';
    layer.style.textShadow     = '0 1px 3px rgba(0,0,0,.5)';
    layer.textContent          = chem.id;
    bc.appendChild(layer);
  });
}

/* ══════════════════════════════════════════════════
   CLEAR TABLE
══════════════════════════════════════════════════ */
function clearTable() {
  selectedChemicals = []; selectedTools = []; pouredChemicals = [];
  vesselType = null; isReacting = false; isPouring = false; hasReacted = false;

  document.querySelectorAll('.bottle.selected').forEach(b => b.classList.remove('selected'));
  document.querySelectorAll('.tool-item.selected').forEach(t => t.classList.remove('selected'));

  /* Reset pour canvas */
  const canvas = document.getElementById('pour-canvas');
  const ctx    = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  clearVessel();
  document.getElementById('beaker-contents').innerHTML = '';

  const rz = document.getElementById('reaction-zone');
  rz.innerHTML     = '<p id="rz-hint">💧 Select chemicals → Pour → click <strong>▶ React</strong></p>';
  rz.style.background  = 'rgba(255,255,255,.22)';
  rz.style.borderColor = 'rgba(100,60,20,.2)';

  const rr = document.getElementById('reaction-result');
  if (rr) rr.classList.remove('show');

  document.getElementById('pour-chemical').disabled  = true;
  document.getElementById('start-reaction').disabled = true;

  updateSelectedDisplay();
  updateStatusBar();
  showToast('Table cleared!');
  setStatus('🧹 Table cleared — select chemicals to begin.');
}

/* ══════════════════════════════════════════════════
   START REACTION
   BUG FIX 1: Uses pouredChemicals for lookup, NOT selectedChemicals
══════════════════════════════════════════════════ */
async function startReaction() {
  if (isReacting) return;

  /* CRITICAL FIX: reaction is determined by what's IN the vessel */
  const pourIds = pouredChemicals.map(c => c.id);
  if (pourIds.length < 1) { showToast('⚠️ Pour at least one chemical first!'); return; }

  let rxn;
  try {
    const res = await fetch('http://localhost:8080/react', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chemicals: pourIds })
    });
    rxn = await res.json();
    if (rxn.reaction_occurred === false) {
      rxn = DB.reactions['DEFAULT'] || createDefaultReaction(pourIds);
    }
  } catch(e) {
    console.error("Backend /react failed", e);
    rxn = lookupReaction(pourIds);
  }

  const missing = getMissingSafety(rxn);

  if (missing.length > 0) {
    showSafetyModal(missing);
    missing.forEach(m => {
      const chip = document.getElementById('sc-' + m.replace(/\s+/g,'-'));
      if (chip) { chip.classList.add('required-missing'); setTimeout(() => chip.classList.remove('required-missing'), 500); }
    });
    return;
  }

  isReacting = true;
  const rz = document.getElementById('reaction-zone');

  /* ── Find experiment data for rich outcome ── */
  const sortedPourKey = [...pourIds].sort().join('+');
  const expData = EXPERIMENTS_TABLE[sortedPourKey] ||
                  Object.entries(EXPERIMENTS_TABLE).find(([k]) =>
                    [...pourIds].sort().join('+') === k.split('+').sort().join('+')
                  )?.[1] || null;

  /* Prefer experiment-table colors/effect over DB rxn */
  const liqColor  = (expData && expData.liquidColor)  || rxn.liquidColor  || '#a0d8ef';
  const bgCol     = (expData && expData.bgColor)      || rxn.bgColor      || '#cce5ff';
  const effect    = (expData && expData.effect)       || rxn.effect       || 'bubbles';
  const obsText   = (expData && expData.outcome)      || rxn.observation  || 'Reaction observed.';
  const concl     = (expData && expData.conclusion)   || rxn.sub          || 'Conclusion: Stable mixture created.';

  setStatus('⚗️ Reaction in progress…');
  showToast('🔬 Reaction started!');
  rz.style.background  = bgCol + 'bb';
  rz.style.borderColor = bgCol;
  
  hasReacted = true;
  
  /* Instantly update Workbench Front Board with the final formula and Conclusion */
  updateWorkbenchBoard({
    badge: (expData && expData.badge) || rxn.badge || "COMPLETED",
    badgeColor: (expData && expData.badgeColor) || rxn.badgeColor || "#a0f0c0",
    formula: rxn.formula,
    sub: concl
  });

  /* Render animated reaction beaker */
  rz.innerHTML =
    '<div style="position:relative;width:100px;margin:0 auto">' +
      buildReactionBeakerSVG(liqColor, bgCol) +
      '<div id="bubble-container" style="position:absolute;bottom:14px;left:6px;right:6px;height:60px;overflow:hidden;pointer-events:none"></div>' +
    '</div>' +
    '<div style="font-family:\'Caveat\',cursive;color:#2a1a00;font-size:.9rem;font-weight:700;text-align:center;margin-top:4px;letter-spacing:.5px">' + rxn.formula + '</div>' +
    '<div id="obs-text" style="font-family:\'Caveat\',cursive;color:#1a4a2a;font-size:.72rem;text-align:center;opacity:0;transition:opacity 1.2s ease;margin-top:3px;line-height:1.4;max-width:240px">' + obsText + '</div>';

  /* Update vessel color to match reaction */
  renderVessel(vesselType || 'Beaker', [{ color: liqColor }]);

  /* ── Particle effects based on experiment type ── */
  if (effect === 'bubbles')     { spawnBubbles(liqColor); }
  if (effect === 'fizz')        { spawnFizz(rz, liqColor); spawnBubbles(liqColor); }
  if (effect === 'smoke')       { spawnSmoke(rz); }
  if (effect === 'precipitate') { spawnPrecipitate(rz, liqColor); }
  if (effect === 'flame')       { spawnFlame(rz); spawnSmoke(rz); }
  if (effect === 'dissolve')    { spawnDissolve(rz, liqColor); }

  const dur = Math.max(2000, 5000 - (temperature - 25) * 40);
  setTimeout(() => { const ot = document.getElementById('obs-text'); if (ot) ot.style.opacity = '1'; }, dur * 0.4);

  setTimeout(() => {
    isReacting = false;
    showToast('✅ Reaction complete!');
    setStatus('✅ Done — see outcome on blackboard.');
    showReactionResult(rxn, obsText, concl);

    /* ── Update blackboard with rich experiment outcome ── */
    if (expData) {
      document.getElementById('board-title').textContent = '🔬 ' + expData.title;
      document.getElementById('board-overview').innerHTML =
        '<b>Aim:</b> ' + expData.aim;
      renderSteps(expData.procedure);
      /* Append outcome section */
      const outBox = document.createElement('div');
      outBox.className = 'board-text outcome-box';
      outBox.innerHTML =
        '<br><b class="chalk-outcome-label">🔬 Observed Outcome:</b><br>' +
        expData.outcome +
        '<br><b class="chalk-outcome-label">📝 Conclusion:</b><br>' +
        expData.conclusion;
      document.getElementById('board-steps').appendChild(outBox);
      /* Scroll to outcome */
      setTimeout(() => outBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 300);
    } else {
      updateBlackboard(rxn);
    }

    /* Complete manual guide if active */
    if (ManualGuide.active) ManualGuide.complete(expData);

    window.lastReaction = { ids: pourIds, rxn, expData };
  }, dur);
}

function buildReactionBeakerSVG(liq, glow) {
  return `<svg viewBox="0 0 92 82" width="92" height="82" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 8px 10px rgba(0,0,0,0.4));">
    <defs>
      <linearGradient id="rlq" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${liq};stop-opacity:0.95"/>
        <stop offset="100%" style="stop-color:${liq};stop-opacity:0.75"/>
      </linearGradient>
      <linearGradient id="rgl" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:rgba(255,255,255,0.6)"/>
        <stop offset="15%" style="stop-color:rgba(255,255,255,0.1)"/>
        <stop offset="85%" style="stop-color:rgba(255,255,255,0.05)"/>
        <stop offset="100%" style="stop-color:rgba(255,255,255,0.4)"/>
      </linearGradient>
    </defs>
    <ellipse cx="46" cy="76" rx="28" ry="6" fill="${glow}" opacity="0.4"/>
    <path d="M22 8 L22 50 Q22 72 46 72 Q70 72 70 50 L70 8 Z" fill="rgba(255,255,255,0.05)" stroke="rgba(180,220,255,0.8)" stroke-width="2.5"/>
    <path d="M23 40 L23 50 Q23 70 46 70 Q69 70 69 50 L69 40 Z" fill="url(#rlq)"/>
    <path d="M22 8 L22 50 Q22 72 46 72 Q70 72 70 50 L70 8 Z" fill="url(#rgl)"/>
    <rect x="16" y="5" width="60" height="6" rx="3" fill="rgba(200,240,255,0.5)" stroke="rgba(180,220,255,0.9)" stroke-width="1.5"/>
    <path d="M25 12 L25 60" stroke="rgba(255,255,255,0.7)" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.8"/>
  </svg>`;
}

function showReactionResult(rxn, obsOverride, conclOverride) {
  const rr = document.getElementById('reaction-result');
  if (!rr) return;
  const badge = document.getElementById('rr-badge');
  badge.textContent        = rxn.badge || 'REACTION';
  badge.style.background   = (rxn.badgeColor || '#a0f0c0') + '33';
  badge.style.border       = '1.5px solid ' + (rxn.badgeColor || '#a0f0c0');
  badge.style.color        = '#1a3a00';
  document.getElementById('rr-formula').textContent = rxn.formula || '';
  document.getElementById('rr-obs').innerHTML =
    '<b>👁 Outcome:</b> ' + (obsOverride || rxn.observation || '') +
    (conclOverride ? '<br><b>📝</b> ' + conclOverride : '');
  rr.classList.add('show');
}

/* ══════════════════════════════════════════════════
   PARTICLE EFFECTS
══════════════════════════════════════════════════ */
function spawnBubbles() {
  const bc = document.getElementById('bubble-container'); if (!bc) return;
  const cls = ['rgba(255,255,255,0.75)','rgba(200,240,255,0.65)','rgba(220,255,220,0.65)'];
  for (let i=0;i<20;i++) setTimeout(() => {
    if (!bc.parentElement) return;
    const sz=4+Math.random()*9, b=document.createElement('div');
    b.style.cssText=`position:absolute;width:${sz}px;height:${sz}px;border-radius:50%;background:${cls[~~(Math.random()*3)]};left:${10+Math.random()*72}%;bottom:0;animation:riseBubble ${0.8+Math.random()*1.3}s linear forwards;border:1px solid rgba(255,255,255,.4)`;
    bc.appendChild(b); setTimeout(()=>b.remove(),2200);
  }, i*180);
}
function spawnSmoke(c) {
  for (let i=0;i<14;i++) setTimeout(()=>{
    const dx=(Math.random()-.5)*64,s=document.createElement('div');
    s.style.cssText=`position:absolute;width:${18+Math.random()*22}px;height:${18+Math.random()*22}px;border-radius:50%;background:rgba(200,200,220,.38);bottom:${38+Math.random()*22}px;left:${28+Math.random()*32}%;--dx:${dx}px;animation:riseSmoke ${1.4+Math.random()}s ease-out forwards;pointer-events:none;z-index:5`;
    c.appendChild(s); setTimeout(()=>s.remove(),2600);
  },i*240);
}
function spawnPrecipitate(c) {
  for (let i=0;i<22;i++) setTimeout(()=>{
    const p=document.createElement('div');
    p.style.cssText=`position:absolute;width:${2+Math.random()*5}px;height:${2+Math.random()*5}px;border-radius:2px;background:rgba(30,112,184,.85);top:20px;left:${10+Math.random()*78}%;animation:fallPrecip ${0.9+Math.random()*.8}s ease-in forwards;pointer-events:none`;
    c.appendChild(p); setTimeout(()=>p.remove(),2000);
  },i*140);
}
function spawnFizz(c) {
  for (let i=0;i<26;i++) setTimeout(()=>{
    const b=document.createElement('div');
    b.style.cssText=`position:absolute;width:${3+Math.random()*6}px;height:${3+Math.random()*6}px;border-radius:50%;background:rgba(220,255,220,.85);left:${10+Math.random()*72}%;bottom:${10+Math.random()*20}px;animation:fizz ${0.6+Math.random()*1}s ease-out forwards;pointer-events:none`;
    c.appendChild(b); setTimeout(()=>b.remove(),1800);
  },i*100);
}
function spawnFlame(c) {
  for (let i=0;i<18;i++) setTimeout(()=>{
    const cols=['#ff9500','#ff6000','#ffcc00','#ff3000'];
    const f=document.createElement('div');
    f.style.cssText=`position:absolute;width:${12+Math.random()*14}px;height:${14+Math.random()*16}px;border-radius:50% 50% 30% 30%;background:${cols[~~(Math.random()*4)]};bottom:${18+Math.random()*16}px;left:${30+Math.random()*28}%;--dx:${(Math.random()-.5)*30}px;animation:riseSmoke ${0.8+Math.random()*.7}s ease-out forwards;opacity:.85;pointer-events:none;z-index:5`;
    c.appendChild(f); setTimeout(()=>f.remove(),1600);
  },i*150);
}

/* ══════════════════════════════════════════════════
   EXPERIMENT PRESETS
══════════════════════════════════════════════════ */
function loadPreset(id, btn) {
  const preset = DB.presets[id]; if (!preset) return;
  const rxn    = DB.reactions[preset.reactionKey] || DB.reactions['DEFAULT'];
  document.querySelectorAll('.exp-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const badge = document.getElementById('eq-type-badge');
  badge.textContent       = preset.badge;
  badge.style.color       = preset.badgeColor;
  badge.style.borderColor = preset.badgeColor;
  badge.style.background  = preset.badgeColor + '22';
  document.getElementById('eq-main').textContent = rxn.formula;
  document.getElementById('eq-sub').textContent  = rxn.sub;
  updateBlackboard(rxn);
  renderSafetyPanel(rxn.requiredSafety);
  setStatus('📖 Loaded: ' + rxn.title);
  showToast('Preset: ' + rxn.title);
}

function updateBlackboard(rxn) {
  document.getElementById('board-title').textContent   = rxn.title;
  document.getElementById('board-overview').innerHTML  = rxn.overview.replace(/\n/g,'<br>');
  document.getElementById('board-chemicals').innerHTML = (rxn.chemNames||'').replace(/\n/g,'<br>');
  document.getElementById('board-tools').textContent   = rxn.tools || '';
  document.getElementById('board-safety').textContent  = rxn.safety || '';
  renderSteps(rxn.steps || []);
}
function renderSteps(steps) {
  const c = document.getElementById('board-steps'); c.innerHTML = '';
  steps.forEach((s, i) => {
    const d = document.createElement('div');
    d.className = 'step-item board-text';
    d.style.animationDelay = (i * 0.12) + 's';
    d.innerHTML = '<span class="step-num">' + (i+1) + '.</span><span>' + s + '</span>';
    c.appendChild(d);
  });
}

/* ══════════════════════════════════════════════════
   SAFETY
══════════════════════════════════════════════════ */
function renderSafetyPanel(required) {
  const c = document.getElementById('safety-items-list'); if (!c) return;
  c.innerHTML = '';
  const icons = { Goggles:'🥽', Gloves:'🧤', 'Lab Coat':'🥼', 'Face Shield':'🛡️', 'Fume Hood':'💨' };
  (required||[]).forEach(item => {
    const chip = document.createElement('span');
    chip.className = 'safety-chip';
    chip.id        = 'sc-' + item.replace(/\s+/g,'-');
    chip.innerHTML = (icons[item]||'⚠️') + ' ' + item;
    if (selectedTools.find(t => t.name === item)) chip.classList.add('equipped');
    c.appendChild(chip);
  });
}
function updateSafetyChip(name, equipped) {
  const chip = document.getElementById('sc-' + name.replace(/\s+/g,'-'));
  if (chip) chip.classList.toggle('equipped', equipped);
}
function getMissingSafety(rxn) {
  if (!rxn) return ['Goggles','Gloves'];
  return (rxn.requiredSafety||[]).filter(s => !selectedTools.find(t => t.name === s));
}
function showSafetyModal(missing) {
  const icons = { Goggles:'🥽', Gloves:'🧤', 'Lab Coat':'🥼', 'Face Shield':'🛡️', 'Fume Hood':'💨' };
  const c = document.getElementById('sm-items'); c.innerHTML = '';
  missing.forEach(m => {
    const chip = document.createElement('span'); chip.className = 'sm-chip';
    chip.textContent = (icons[m]||'⚠️') + ' ' + m; c.appendChild(chip);
  });
  document.getElementById('safety-modal').classList.add('show');
}
function closeSafetyModal() { document.getElementById('safety-modal').classList.remove('show'); }

/* ══════════════════════════════════════════════════
   THERMOMETER / DRAWER / UTILITIES / VOICE
══════════════════════════════════════════════════ */
function updateTemp(val) {
  temperature = parseInt(val, 10);
  const pct = ((temperature-20)/80)*100;
  const fill = document.getElementById('thermo-fill');
  fill.style.height = (4+pct*.92)+'%';
  const r = Math.min(255,80+temperature*2.2), b = Math.max(40,240-temperature*2.2);
  fill.style.background = `linear-gradient(180deg,rgb(${r},140,${b}),rgb(${r},60,60))`;
  document.getElementById('temp-display').textContent = temperature+'°C';
  document.getElementById('status-temp').textContent  = temperature+'°C';
  if (temperature>=80) setStatus(`🌡️ High temp (${temperature}°C) — reaction rate increased!`);
}
function toggleDrawer() { document.getElementById('tools-drawer').classList.toggle('open'); }
function setStatus(msg) { document.getElementById('status-text').textContent = msg; }
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2600);
}
function updateStatusBar() {
  document.getElementById('status-items').textContent  = selectedChemicals.length;
  document.getElementById('status-poured').textContent = pouredChemicals.length;
}

function toggleVoice() {
  const btn = document.getElementById('voice-btn');
  if (!('webkitSpeechRecognition' in window)&&!('SpeechRecognition' in window)) { showToast('⚠️ Voice not supported.'); return; }
  if (speechRecog && btn.classList.contains('listening')) { speechRecog.stop(); btn.classList.remove('listening'); document.getElementById('voice-status').textContent='Click mic to speak'; return; }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  speechRecog = new SR(); speechRecog.lang='en-US'; speechRecog.interimResults=false;
  btn.classList.add('listening'); document.getElementById('voice-status').textContent='🔴 Listening...';
  speechRecog.onresult = e => {
    const cmd = e.results[0][0].transcript.toLowerCase().trim();
    document.getElementById('voice-status').textContent = '"'+cmd+'"';
    processVoice(cmd);
  };
  speechRecog.onerror = () => { btn.classList.remove('listening'); document.getElementById('voice-status').textContent='Error — try again'; };
  speechRecog.onend   = () => { btn.classList.remove('listening'); setTimeout(()=>{document.getElementById('voice-status').textContent='Click mic to speak';},2200); };
  speechRecog.start();
}
function processVoice(cmd) {
  showToast('🎤 "'+cmd+'"');
  let matched = false;
  Object.values(DB.chemicals).forEach(chem => {
    if (cmd.includes(chem.name.toLowerCase())||cmd.includes(chem.id.toLowerCase())) {
      const el = document.querySelector('.bottle[data-id="'+chem.id+'"]');
      if (el) { el.click(); matched=true; }
    }
  });
  if (matched) return;
  if (cmd.includes('beaker'))              document.querySelector('.tool-item[data-name="Beaker"]')?.click();
  else if (cmd.includes('test'))           document.querySelector('.tool-item[data-name="Test Tube"]')?.click();
  else if (cmd.includes('flask'))          document.querySelector('.tool-item[data-name="Flask"]')?.click();
  else if (cmd.includes('pour'))           pourChemical();
  else if (cmd.includes('start')||cmd.includes('react')) startReaction();
  else if (cmd.includes('clear')||cmd.includes('reset')) clearTable();
  else showToast('❓ Not recognized: "'+cmd+'"');
}

/* ══════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  fetchDataset();
  document.getElementById('tools-drawer').classList.add('open');
  updateTemp(25);
  /* Do NOT call loadPreset here — the overlay must only appear after login */
  document.getElementById('pour-chemical').disabled  = true;
  document.getElementById('start-reaction').disabled = true;
  updateSelectedDisplay();
  document.getElementById('chem-search-clear').style.display = 'none';

  document.getElementById('roll-number').addEventListener('keydown', e => {
    if (!['Backspace','Delete','ArrowLeft','ArrowRight','Tab'].includes(e.key) && !/^\d$/.test(e.key)) e.preventDefault();
  });
  document.getElementById('safety-modal').addEventListener('click', e => {
    if (e.target === document.getElementById('safety-modal')) closeSafetyModal();
  });
});
function saveExperimentReport() {
  if (!window.lastReaction) {
    showToast("⚠️ No experiment has been performed yet!");
    return;
  }
  
  const rxn = window.lastReaction.rxn;
  const name = document.getElementById('badge-name').textContent || 'Student';
  const roll = document.getElementById('badge-roll').textContent || 'Unknown';
  const date = new Date().toLocaleString();
  
  const reportContent = `===========================================
VR CHEMISTRY LAB - EXPERIMENT REPORT
===========================================
Date: ${date}
Student Name: ${name}
Roll: ${roll}

-------------------------------------------
EXPERIMENT DETAILS
-------------------------------------------
Title: ${rxn.title}
Chemical Equation: ${rxn.formula}
Reagents Used: 
${rxn.chemNames ? rxn.chemNames.replace(/<br>/g, '\n') : ''}

-------------------------------------------
OBSERVATIONS
-------------------------------------------
${rxn.observation || 'No observations recorded.'}

-------------------------------------------
SAFETY PRECAUTIONS TAKEN
-------------------------------------------
${(rxn.requiredSafety || []).join(', ')}

===========================================
End of Report
`;

  const blob = new Blob([reportContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `LabReport_${name.replace(/\s+/g, '_')}_${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast("💾 Experiment Report Saved!");
}

/* ══════════════════════════════════════════════════
   TUTORIAL MANAGER (Guided Step-by-Step Flow)
══════════════════════════════════════════════════ */
const TutorialManager = {
  active: false,
  step: 0,
  presetId: null,
  reactionKey: null,
  requiredChems: [],
  currentChemIndex: 0,
  _utterance: null,

  /* ── Voice ─────────────────────────────────── */
  speak: function(text) {
    if (!('speechSynthesis' in window)) { console.warn('TTS not supported'); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang  = 'en-US';
    u.rate  = 0.92;
    u.pitch = 1.05;
    /* Pick a natural voice if available */
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => /Google US English|Samantha|Alex|Karen/i.test(v.name));
    if (preferred) u.voice = preferred;
    this._utterance = u;
    window.speechSynthesis.speak(u);
    /* Show a subtle toast so the user sees what is being said */
    showToast('🎙️ ' + text.slice(0, 80) + (text.length > 80 ? '…' : ''));
  },

  /* ── Highlight helpers ──────────────────────── */
  highlightTool: function(name) {
    const el = document.querySelector('.tool-item[data-name="' + name + '"]');
    if (el) el.classList.add('tutorial-highlight');
  },
  highlightBottle: function(id) {
    const el = document.querySelector('.bottle[data-id="' + id + '"]');
    if (el) { el.classList.add('tutorial-highlight'); el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
  },
  highlightButton: function(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('tutorial-highlight');
  },
  clearHighlights: function() {
    document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));
  },

  /* ── Experiment data from table ─────────────── */
  getExpData: function(presetId) {
    /* Sort the key to match the EXPERIMENTS_TABLE keys robustly */
    const sorted = presetId.split('+').sort().join('+');
    /* Try direct match or sorted match */
    return EXPERIMENTS_TABLE[presetId] || EXPERIMENTS_TABLE[sorted] || null;
  },

  /* ── Core start ─────────────────────────────── */
  start: function(presetId) {
    this.active   = true;
    this.step     = -1;
    this.presetId = presetId;

    /* Resolve reaction key: might be a DB.presets key or a direct chemical-id combo */
    const preset = DB.presets && DB.presets[presetId];
    this.reactionKey = preset ? preset.reactionKey : presetId;

    /* Build list of required chemicals from the reaction key */
    this.requiredChems    = this.reactionKey.split('+');
    this.currentChemIndex = 0;

    clearTable();

    /* Show experiment info on blackboard */
    const expData = this.getExpData(presetId);
    if (expData) {
      document.getElementById('board-title').textContent     = '🧪 ' + expData.title;
      document.getElementById('board-overview').innerHTML    = '<b>Aim:</b> ' + expData.aim;
      document.getElementById('board-chemicals').innerHTML   = expData.chemicals.map(c => '• ' + c).join('<br>');
      document.getElementById('board-tools').textContent     = expData.equipment.join('  •  ');
      document.getElementById('board-safety').textContent    = 'Goggles  •  Gloves  •  Lab Coat';
      renderSteps(expData.procedure);
    } else {
      const rxn = DB.reactions[this.reactionKey] || {};
      document.getElementById('board-title').textContent   = 'Lab Guide: ' + (rxn.title || 'Experiment');
      document.getElementById('board-overview').innerHTML  = '<b>Follow the voice assistant\'s instructions.</b>';
    }

    setTimeout(() => {
      const title = expData ? expData.title : (DB.reactions[this.reactionKey]?.title || 'this experiment');
      this.speak(
        `Welcome! We will now perform: ${title}. ` +
        `First, please equip your safety gear: put on Goggles, Gloves, and Lab Coat from the Lab Tools drawer.`
      );
      this.highlightTool('Goggles');
      this.highlightTool('Gloves');
      this.highlightTool('Lab Coat');
    }, 600);
  },

  checkSafety: function() {
    const hasGoggles = selectedTools.some(t => t.name === 'Goggles');
    const hasGloves  = selectedTools.some(t => t.name === 'Gloves');
    const hasCoat    = selectedTools.some(t => t.name === 'Lab Coat');
    if (hasGoggles && hasGloves && hasCoat) {
      this.clearHighlights();
      this.step = 0;
      setTimeout(() => {
        this.speak('Safety gear equipped. Excellent! Now, pick up a Beaker from the Lab Tools drawer and place it on the table.');
        this.highlightTool('Beaker');
      }, 800);
    }
  },

  onToolSelected: function(name) {
    if (!this.active) return;
    if (this.step === -1 && ['Goggles', 'Gloves', 'Lab Coat'].includes(name)) {
      this.checkSafety();
    } else if (this.step === 0 && name === 'Beaker') {
      this.clearHighlights();
      this.step = 1;
      const nextChem = this.requiredChems[this.currentChemIndex];
      const chemName = (DB.chemicals && DB.chemicals[nextChem] && DB.chemicals[nextChem].name) || nextChem.replace(/_/g, ' ');
      setTimeout(() => {
        this.speak(`Great! Beaker is on the table. Now, find ${chemName} on the chemical storage shelf on the left and click it to select it.`);
        this.highlightBottle(nextChem);
      }, 500);
    }
  },

  onChemSelected: function(id) {
    if (!this.active) return;
    if (this.step === 1 && id === this.requiredChems[this.currentChemIndex]) {
      this.clearHighlights();
      this.step = 2;
      const chemName = (DB.chemicals && DB.chemicals[id] && DB.chemicals[id].name) || id.replace(/_/g, ' ');
      this.speak(`${chemName} selected. Now click the Pour button to add it into the beaker.`);
      this.highlightButton('pour-chemical');
    }
  },

  onChemPoured: function() {
    if (!this.active || this.step !== 2) return;
    this.clearHighlights();
    this.currentChemIndex++;
    if (this.currentChemIndex < this.requiredChems.length) {
      this.step = 1;
      const nextChem = this.requiredChems[this.currentChemIndex];
      const chemName = (DB.chemicals && DB.chemicals[nextChem] && DB.chemicals[nextChem].name) || nextChem.replace(/_/g, ' ');
      setTimeout(() => {
        this.speak(`Well done! Now find and select ${chemName} from the shelf.`);
        this.highlightBottle(nextChem);
      }, 1200);
    } else {
      this.step = 3;
      setTimeout(() => {
        this.speak('All chemicals added to the beaker. Now click the React button to start the reaction!');
        this.highlightButton('start-reaction');
      }, 1200);
    }
  },

  onReactionStarted: function() {
    if (!this.active || this.step !== 3) return;
    this.step = 4;
    this.clearHighlights();
    this.speak('The reaction has started! Observe the changes carefully in the beaker.');
    setTimeout(() => {
      const expData = this.getExpData(this.presetId);
      const rxn = DB.reactions && DB.reactions[this.reactionKey];
      const conclusion = (expData && expData.conclusion) || (rxn && rxn.observation) || 'Observe the results carefully.';
      this.speak('Conclusion: ' + conclusion + ' Experiment complete! You may now save your report.');
      this.active = false;
    }, 6000);
  }
};

/* --- Overrides --- */

const origSelectTool = window.selectTool;
window.selectTool = function(el) {
  origSelectTool(el);
  if (el.classList.contains('selected')) {
    TutorialManager.onToolSelected(el.dataset.name);
  }
};

const origSelectChemical = window.selectChemical;
window.selectChemical = function(el) {
  origSelectChemical(el);
  if (el.classList.contains('selected')) {
    TutorialManager.onChemSelected(el.dataset.id);
  }
};

// Hook pour completion explicitly
const origPourChemical = window.pourChemical;
window.pourChemical = function() {
  const wasNotPouring = !isPouring;
  origPourChemical();
  
  if (wasNotPouring && isPouring) {
    // A pour has started. Wait until it finishes to trigger the tutorial.
    let checkPourIdx = setInterval(() => {
      if (!isPouring) {
        clearInterval(checkPourIdx);
        // Inform tutorial manager of the newly poured chemical
        TutorialManager.onChemPoured();
      }
    }, 500);
  }
};

const origStartReaction = window.startReaction;
window.startReaction = async function() {
  await origStartReaction();
  TutorialManager.onReactionStarted();
};

/* ══════════════════════════════════════════════════
   loadPreset — shows choice overlay ONLY when lab is visible
══════════════════════════════════════════════════ */
window.loadPreset = function(id, btn) {
  /* Mark active button */
  document.querySelectorAll('.exp-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  /* Only show tutorial overlay when the lab room is visible (after login) */
  const lab = document.getElementById('lab-room');
  if (!lab || lab.classList.contains('hidden') || lab.style.display === 'none') {
    /* Lab not visible yet — just load the experiment data quietly */
    _applyPresetManually(id);
    return;
  }

  /* Lab is visible — show the guide/manual choice overlay */
  let overlay = document.getElementById('tutorial-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'tutorial-overlay';
    document.body.appendChild(overlay);
  }
  overlay.innerHTML = `
    <div class="tu-card">
      <div class="tu-title">🧪 Experiment Selected</div>
      <p>Would you like the Voice Assistant to guide you step-by-step through this experiment?</p>
      <div class="tu-buttons">
        <button class="tu-btn tu-btn-yes" onclick="startTutorialChoice('${id}', true)">🎙️ YES — Guide Me!</button>
        <button class="tu-btn tu-btn-no"  onclick="startTutorialChoice('${id}', false)">📖 No, I'll do it manually</button>
      </div>
    </div>
  `;
  overlay.style.display = 'flex';
};

function _applyPresetManually(id) {
  /* Shows experiment data on blackboard AND starts the ManualGuide step tracker */
  const expData = EXPERIMENTS_TABLE[id] || _findExpByKey(id);
  if (expData) {
    ManualGuide.start(id, expData);
    setStatus('📍 Step 1/' + expData.procedure.length + ': ' + expData.procedure[0]);
    return;
  }
  /* Fallback to DB-based preset */
  if (!DB || !DB.presets) return;
  const preset = DB.presets[id]; if (!preset) return;
  const rxn = (DB.reactions && DB.reactions[preset.reactionKey]) || (DB.reactions && DB.reactions['DEFAULT']);
  if (!rxn) return;
  const badge = document.getElementById('eq-type-badge');
  badge.textContent       = preset.badge || 'EXPERIMENT';
  badge.style.color       = preset.badgeColor || '#a0f0c0';
  badge.style.borderColor = preset.badgeColor || '#a0f0c0';
  badge.style.background  = (preset.badgeColor || '#a0f0c0') + '22';
  document.getElementById('eq-main').textContent = rxn.formula;
  document.getElementById('eq-sub').textContent  = rxn.sub;
  updateBlackboard(rxn);
  renderSafetyPanel(rxn.requiredSafety);
  setStatus('📖 Loaded: ' + rxn.title);
}

/* Helper: find experiment entry by loosely sorted key */
function _findExpByKey(id) {
  const sorted = id.split('+').sort().join('+');
  return EXPERIMENTS_TABLE[sorted] ||
    Object.entries(EXPERIMENTS_TABLE).find(
      ([k]) => k.split('+').sort().join('+') === sorted
    )?.[1] || null;
}

window.startTutorialChoice = function(id, useTutorial) {
  const overlay = document.getElementById('tutorial-overlay');
  if (overlay) overlay.style.display = 'none';
  if (useTutorial) {
    ManualGuide.stop(); /* stop manual guide if running */
    TutorialManager.start(id);
  } else {
    _applyPresetManually(id); /* also starts ManualGuide */
    showToast('📖 Manual mode — follow the highlighted steps on the blackboard!');
  }
};

/* ── Hook ManualGuide step advance on Pour completion ──── */
const _mgOrigPour = window.pourChemical;
window.pourChemical = function() {
  _mgOrigPour && _mgOrigPour();
  /* Advance manual guide step when a chemical is poured */
  setTimeout(() => {
    if (ManualGuide.active) ManualGuide.nextStep();
  }, 2800);
};

/* ManualGuide reaction completion is handled inside startReaction
   via ManualGuide.complete(expData) — no extra hook needed here. */

function exitLab() {
    const labRoom = document.getElementById("lab-room");
    const regScreen = document.getElementById("registration-screen");

    labRoom.style.transition = "opacity 0.3s ease";
    labRoom.style.opacity = "0";

    setTimeout(() => {
        labRoom.classList.add("hidden");
        labRoom.style.opacity = "";
        labRoom.style.transition = "";

        regScreen.classList.remove("hidden");
        regScreen.style.opacity = "0";
        regScreen.style.transition = "opacity 0.3s ease";

        requestAnimationFrame(() => {
            regScreen.style.opacity = "1";
        });

        setTimeout(() => {
            regScreen.style.opacity = "";
            regScreen.style.transition = "";
        }, 300);
    }, 300);
}