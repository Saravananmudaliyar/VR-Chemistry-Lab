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
const DB = {

  /* ── All 10 chemicals — each shown as its own bottle ── */
  chemicals: {
    HCl:     { id:'HCl',     name:'Hydrochloric Acid',     formula:'HCl',      color:'#78c5e8', capColor:'#c04444', type:'Strong Acid'     },
    NaOH:    { id:'NaOH',    name:'Sodium Hydroxide',      formula:'NaOH',     color:'#6dcc6d', capColor:'#3a8a3a', type:'Strong Base'     },
    H2SO4:   { id:'H2SO4',   name:'Sulfuric Acid',         formula:'H₂SO₄',    color:'#e8d84a', capColor:'#aa9a00', type:'Strong Acid'     },
    CuSO4:   { id:'CuSO4',   name:'Copper(II) Sulfate',    formula:'CuSO₄',    color:'#1e70b8', capColor:'#1a5a9a', type:'Salt'            },
    NaHCO3:  { id:'NaHCO3',  name:'Sodium Bicarbonate',    formula:'NaHCO₃',   color:'#e8f4e8', capColor:'#608860', type:'Weak Base'       },
    CH3COOH: { id:'CH3COOH', name:'Acetic Acid',           formula:'CH₃COOH',  color:'#f8f0d0', capColor:'#c0a030', type:'Weak Acid'       },
    NH4OH:   { id:'NH4OH',   name:'Ammonium Hydroxide',    formula:'NH₄OH',    color:'#d8f0d8', capColor:'#507850', type:'Weak Base'       },
    CaCO3:   { id:'CaCO3',   name:'Calcium Carbonate',     formula:'CaCO₃',    color:'#f5f0e8', capColor:'#c0b090', type:'Salt/Carbonate'  },
    Mg:      { id:'Mg',      name:'Magnesium Ribbon',      formula:'Mg',       color:'#d8d8d0', capColor:'#909090', type:'Reactive Metal'  },
    C2H5OH:  { id:'C2H5OH',  name:'Ethanol',               formula:'C₂H₅OH',   color:'#f0e8c8', capColor:'#b89040', type:'Organic Solvent' },
  },

  /* Shelf order: most-used basics first, then others.
     JS renders 3 per row automatically → 4 shelf planks for 10 chemicals */
  shelfOrder: ['HCl','NaOH','H2SO4','CuSO4','NaHCO3','CH3COOH','NH4OH','CaCO3','Mg','C2H5OH'],

  /* ── All reactions from reactions.json ── */
  reactions: {
    /* ── Singles (10) ── */
    'HCl': {title:'🧪 HCl — Strong Acid Dissociation',formula:'HCl(aq) → H⁺(aq) + Cl⁻(aq)',sub:'Strong acid | Fully ionizes | pH < 1 | Pungent fumes',badge:'DISSOCIATION',badgeColor:'#ffd080',effect:'bubbles',liquidColor:'#78c5e8',bgColor:'#b0e0f8',overview:'HCl is a strong acid that fully dissociates in water.\nReleases H⁺ and Cl⁻ ions. Produces pungent fumes. Used in titrations and metal cleaning.',chemNames:'• Hydrochloric Acid (HCl)',tools:'• Beaker  • pH Meter  • Measuring Cylinder',safety:'• Goggles  • Gloves  • Lab Coat  • Fume Hood',requiredSafety:['Goggles','Gloves','Lab Coat','Fume Hood'],steps:['Ensure fume hood is active before handling HCl.','Measure the required volume of dilute HCl (1M) carefully.','Transfer to a clean beaker using a glass funnel.','Observe: clear, colorless, pungent-smelling liquid.','Measure pH — should read < 2 on pH meter.','Test with blue litmus paper — turns red immediately.','Neutralize any waste with NaHCO₃ before disposal.'],observation:'Clear acidic solution. pH < 2. Pungent HCl fumes detected.'},
    'NaOH': {title:'🧪 NaOH — Strong Base Dissolution',formula:'NaOH(s) → Na⁺(aq) + OH⁻(aq)',sub:'Strong base | Fully dissociates | pH > 13 | Exothermic',badge:'DISSOCIATION',badgeColor:'#a0f080',effect:'dissolve',liquidColor:'#6dcc6d',bgColor:'#b8f0b8',overview:'NaOH dissolves in water with significant heat release.\nFully dissociates into Na⁺ and OH⁻ ions. Highly alkaline — pH > 13.',chemNames:'• Sodium Hydroxide (NaOH)',tools:'• Beaker  • Stirrer  • pH Meter  • Thermometer',safety:'• Goggles  • Gloves  • Lab Coat',requiredSafety:['Goggles','Gloves','Lab Coat'],steps:['Weigh out required amount of NaOH pellets.','Add pellets slowly to water — NEVER add water to NaOH.','Stir gently — significant heat is produced (exothermic).','Observe temperature rise on thermometer.','Measure pH — strongly alkaline (pH 13–14).','Test with red litmus paper — turns blue immediately.','Cool solution before using in further reactions.'],observation:'Highly alkaline solution. pH > 13. Slippery feel. Heat released.'},
    'H2SO4': {title:'🧪 H₂SO₄ — Strong Diprotic Acid',formula:'H₂SO₄ → 2H⁺(aq) + SO₄²⁻(aq)',sub:'Strong diprotic acid | Highly corrosive | ALWAYS add acid to water',badge:'DISSOCIATION',badgeColor:'#ffe080',effect:'smoke',liquidColor:'#d8c840',bgColor:'#f8f060',overview:'H₂SO₄ is a strong diprotic acid that fully ionizes in water.\nDilution is highly exothermic — ALWAYS add acid to water, never reverse!',chemNames:'• Sulfuric Acid (H₂SO₄)',tools:'• Beaker  • Measuring Cylinder  • Glass Rod  • Fume Hood',safety:'• Goggles  • Gloves  • Lab Coat  • Face Shield  • Fume Hood',requiredSafety:['Goggles','Gloves','Lab Coat','Face Shield','Fume Hood'],steps:['⚠️ Always add acid to water — never add water to acid!','Fill a beaker with the required volume of distilled water first.','Slowly pour concentrated H₂SO₄ down the side of the beaker.','Stir constantly with a glass rod — enormous heat produced.','Allow to cool to room temperature before proceeding.','Measure pH — very low (pH 0–1).','Handle with extreme care — highly corrosive at all concentrations.'],observation:'Highly corrosive. Extreme heat on dilution. pH ≈ 0.'},
    'CuSO4': {title:'🔵 CuSO₄ — Ionic Dissolution',formula:'CuSO₄(s) → Cu²⁺(aq) + SO₄²⁻(aq)',sub:'Ionic dissolution | Vivid blue Cu²⁺ solution | Weak acid | pH 3.5–4',badge:'DISSOLUTION',badgeColor:'#aadcff',effect:'dissolve',liquidColor:'#1e70b8',bgColor:'#a0c8f0',overview:'CuSO₄ dissolves in water to give a vivid blue solution.\nCu²⁺ ions are responsible for the characteristic blue color.',chemNames:'• Copper(II) Sulfate (CuSO₄)',tools:'• Beaker  • Stirrer  • Measuring Cylinder',safety:'• Goggles  • Gloves  • Lab Coat',requiredSafety:['Goggles','Gloves','Lab Coat'],steps:['Weigh 5g of CuSO₄·5H₂O blue crystals (blue vitriol).','Add crystals to 100 mL of distilled water in a beaker.','Stir continuously until crystals fully dissolve.','Observe: vivid blue solution due to Cu²⁺ ions.','Measure pH — slightly acidic (pH 3.5–4).','Test conductivity — strong electrolyte.','Record: color intensity, clarity, and temperature change.'],observation:'Vivid blue CuSO₄ solution. Cu²⁺ ions give characteristic color.'},
    'NaHCO3': {title:'⚪ NaHCO₃ — Thermal Decomposition',formula:'2NaHCO₃ → Na₂CO₃ + H₂O + CO₂↑',sub:'Thermal decomposition | CO₂ gas released on heating | Mild base | pH 8.3',badge:'DECOMPOSITION',badgeColor:'#c0f0c0',effect:'fizz',liquidColor:'#d8f0d8',bgColor:'#e8f8e8',overview:'NaHCO₃ decomposes on heating to release CO₂ gas.\nAlso dissolves in water to form a mildly alkaline solution. Used in baking.',chemNames:'• Sodium Bicarbonate (NaHCO₃)',tools:'• Test Tube  • Burner  • Limewater  • Delivery Tube',safety:'• Goggles  • Gloves',requiredSafety:['Goggles','Gloves'],steps:['Place a spatula of NaHCO₃ powder in a dry test tube.','Gently heat the test tube over a Bunsen burner.','Observe: bubbles of CO₂ gas are evolved.','Pass evolved gas through limewater — turns milky (confirms CO₂).','Residue is Na₂CO₃ (sodium carbonate).','Record temperature at which decomposition begins.','Note: used in baking as a leavening agent.'],observation:'CO₂ gas bubbles off on heating. Limewater turns milky.'},
    'CH3COOH': {title:'🧪 CH₃COOH — Weak Acid Equilibrium',formula:'CH₃COOH ⇌ CH₃COO⁻ + H⁺',sub:'Weak acid | Partial dissociation | Ka = 1.8×10⁻⁵ | Vinegar odor | pH ≈ 2.9',badge:'WEAK ACID',badgeColor:'#f0e080',effect:'bubbles',liquidColor:'#f0e8c0',bgColor:'#f8f4d8',overview:'CH₃COOH is a weak acid that only partially dissociates.\nEquilibrium favors the undissociated form. pH ≈ 2.9 at 5%.',chemNames:'• Acetic Acid (CH₃COOH)',tools:'• Beaker  • pH Meter  • Litmus Paper',safety:'• Goggles  • Gloves  • Lab Coat',requiredSafety:['Goggles','Gloves','Lab Coat'],steps:['Measure 10 mL of 5% acetic acid (vinegar strength) into a beaker.','Observe: clear, colorless, pungent smell of vinegar.','Measure pH — reads about 2.9 (weak acid).','Compare to HCl (same concentration): HCl is far more acidic.','Test with litmus — turns red (acidic).','Add NaOH drop by drop to observe neutralization.','Record equilibrium constant expression: Ka = [CH₃COO⁻][H⁺]/[CH₃COOH].'],observation:'Clear acidic solution. pH ≈ 2.9. Distinct vinegar odor.'},
    'NH4OH': {title:'🧪 NH₄OH — Weak Base',formula:'NH₄OH ⇌ NH₄⁺(aq) + OH⁻(aq)',sub:'Weak base | Partial ionization | pH ≈ 11 | Ammonia fumes',badge:'WEAK BASE',badgeColor:'#a8f0c0',effect:'smoke',liquidColor:'#a0d8a0',bgColor:'#c8f0c8',overview:'NH₄OH is a weak base with partial ionization in water.\nReleases ammonia fumes — fume hood required.',chemNames:'• Ammonium Hydroxide (NH₄OH)',tools:'• Beaker  • pH Meter  • Fume Hood',safety:'• Goggles  • Gloves  • Lab Coat  • Fume Hood',requiredSafety:['Goggles','Gloves','Lab Coat','Fume Hood'],steps:['Carry out all steps inside the fume hood.','Measure 10 mL of 10% NH₄OH solution into a beaker.','Observe: clear, colorless solution with pungent ammonia smell.','Measure pH — reads about 11 (weak base).','Test with red litmus paper — turns blue (alkaline).','Note: NH₃ gas is released — keep away from face.','Neutralize waste with dilute HCl before disposal.'],observation:'Clear alkaline solution. pH ≈ 11. Strong ammonia odor.'},
    'CaCO3': {title:'⚪ CaCO₃ — Thermal Decomposition',formula:'CaCO₃(s) → CaO(s) + CO₂(g)',sub:'Thermal decomposition | Requires >840°C | CO₂ released | Lime production',badge:'DECOMPOSITION',badgeColor:'#e0d8c0',effect:'fizz',liquidColor:'#e8e0d0',bgColor:'#f0ebe0',overview:'CaCO₃ decomposes at high temperature (>840°C) into CaO and CO₂.\nThis is the basis of lime production in industry.',chemNames:'• Calcium Carbonate (CaCO₃)',tools:'• Crucible  • Bunsen Burner  • Tongs  • Limewater',safety:'• Goggles  • Gloves  • Lab Coat',requiredSafety:['Goggles','Gloves','Lab Coat'],steps:['Place a small piece of calcium carbonate (marble chip) in a crucible.','Heat strongly and continuously with a Bunsen burner.','Pass any evolved gas through limewater — confirms CO₂.','The white residue is CaO (quicklime).','Add a drop of water to the residue — hisses and heats up (CaO + H₂O → Ca(OH)₂).','Test Ca(OH)₂ solution with litmus — turns blue (alkaline).','Record: temperature, time, and visual changes throughout.'],observation:'CO₂ gas evolved at high temp. White CaO (quicklime) remains.'},
    'Mg': {title:'🔥 Mg — Combustion in Air',formula:'2Mg(s) + O₂(g) → 2MgO(s)',sub:'Metal combustion | Blinding white flame | NEVER look directly | ΔH = −601 kJ/mol',badge:'COMBUSTION',badgeColor:'#fff0a0',effect:'flame',liquidColor:'#f0f0e0',bgColor:'#fffff0',overview:'Magnesium burns with an intensely bright white flame in air.\nProduces magnesium oxide (MgO) as white powder.',chemNames:'• Magnesium Ribbon (Mg)',tools:'• Crucible Tongs  • Bunsen Burner  • Heatproof Mat',safety:'• Goggles  • Gloves  • Lab Coat',requiredSafety:['Goggles','Gloves','Lab Coat'],steps:['⚠️ NEVER look directly at burning magnesium — causes eye damage.','Hold a 5 cm strip of magnesium ribbon with crucible tongs.','Ignite the tip of the ribbon in the edge of a Bunsen flame.','Hold away from you — blinding white light is produced.','Allow to burn completely — white MgO powder falls.','Collect white powder on a heatproof mat.','Test MgO with water + indicator — forms Mg(OH)₂, alkaline.'],observation:'Intense white flash. MgO white powder produced. Alkaline residue.'},
    'C2H5OH': {title:'🔥 Ethanol — Combustion',formula:'C₂H₅OH + 3O₂ → 2CO₂ + 3H₂O',sub:'Organic alcohol | Flammable | Blue flame | ΔH = −1367 kJ/mol',badge:'COMBUSTION',badgeColor:'#ffaa60',effect:'flame',liquidColor:'#f0e0a0',bgColor:'#f8f0d0',overview:'Ethanol is a flammable organic alcohol.\nBurns with a nearly invisible blue flame. Also used as solvent and fuel.',chemNames:'• Ethanol (C₂H₅OH)',tools:'• Evaporating Dish  • Crucible Tongs  • Burner  • Fume Hood',safety:'• Goggles  • Gloves  • Lab Coat  • Fume Hood',requiredSafety:['Goggles','Gloves','Lab Coat','Fume Hood'],steps:['Ensure no open flames in vicinity before handling.','Pour a small amount (2 mL) of ethanol into an evaporating dish.','Place dish on a heat-resistant mat in the fume hood.','Use a lit splint to ignite the ethanol from a safe distance.','Observe blue, near-invisible flame — CO₂ and H₂O produced.','Allow to burn out completely or smother with a lid.','Record observations: flame color, heat produced, residue.'],observation:'Blue nearly-invisible flame. CO₂ and H₂O produced. No residue.'},
    /* ── Pairs (45) ── */
    'HCl+NaOH': {title:'⚗ Acid–Base Neutralization',formula:'HCl + NaOH → NaCl + H₂O',sub:'Neutralization | Salt + Water | Exothermic | pH → 7',badge:'NEUTRALIZATION',badgeColor:'#a0f0c0',effect:'bubbles',liquidColor:'#a0e8a0',bgColor:'#c8f0c8',overview:'HCl + NaOH → NaCl + H₂O\nClassic strong acid–base neutralization. Salt and water formed. Highly exothermic — temperature rises noticeably.',chemNames:'• Hydrochloric Acid (HCl)\n• Sodium Hydroxide (NaOH)',tools:'• Beaker  • Dropper  • Stirrer  • pH Meter',safety:'• Goggles  • Gloves  • Lab Coat',requiredSafety:['Goggles','Gloves','Lab Coat'],steps:['Take a clean beaker and place it on the table.','Measure 10 mL of HCl (1M) using the measuring cylinder.','Carefully pour HCl into the beaker.','Add NaOH slowly, drop by drop, using the dropper.','Stir the mixture gently with the glass rod.','Observe — heat is released (exothermic reaction).','Test with universal indicator: pH should be ≈ 7 (neutral).'],observation:'Solution heats up then becomes clear and neutral. pH = 7.'},
    'H2SO4+HCl': {title:'⚠️ Strong Acid Mixture',formula:'HCl + H₂SO₄ → H₃O⁺ + HSO₄⁻  (mixed acid, no net reaction)',sub:'Mixed acid | No new compound | Highly corrosive | Fumes released',badge:'ACID MIX ⚠️',badgeColor:'#ffe080',effect:'smoke',liquidColor:'#d8c840',bgColor:'#f0e860',overview:'HCl and H₂SO₄ mix to form a highly corrosive acid solution.\nNo new compound forms — both acids coexist. Fumes released. Extremely dangerous.',chemNames:'• Hydrochloric Acid (HCl)\n• Sulfuric Acid (H₂SO₄)',tools:'• Beaker  • Measuring Cylinder  • Fume Hood',safety:'• Goggles  • Gloves  • Lab Coat  • Face Shield  • Fume Hood',requiredSafety:['Goggles','Gloves','Lab Coat','Face Shield','Fume Hood'],steps:['CAUTION: Never mix concentrated acids carelessly.','Ensure fume hood is active and all PPE worn.','Always add acid to water, never water to acid.','Add H₂SO₄ slowly into the container first.','Add HCl dropwise. Observe fuming.','Keep away from face — corrosive fumes.','Neutralize any spills immediately with NaHCO₃.'],observation:'Fuming, highly corrosive mixed acid. Extreme caution required!'},
    'CuSO4+HCl': {title:'🔄 Double Displacement — CuCl₂',formula:'CuSO₄ + 2HCl → CuCl₂ + H₂SO₄',sub:'Double Displacement | Blue-green CuCl₂ | Solution becomes more acidic',badge:'DISPLACEMENT',badgeColor:'#80e8d0',effect:'bubbles',liquidColor:'#30b890',bgColor:'#80e0c8',overview:'CuSO₄ reacts with HCl forming copper chloride (blue-green) and sulfuric acid.\nSolution becomes more acidic. Blue-green color indicates CuCl₂.',chemNames:'• Copper(II) Sulfate (CuSO₄)\n• Hydrochloric Acid (HCl)',tools:'• Beaker  • Dropper  • Stirrer  • pH Paper',safety:'• Goggles  • Gloves  • Lab Coat',requiredSafety:['Goggles','Gloves','Lab Coat'],steps:['Prepare CuSO₄ solution in a clean beaker.','Add dilute HCl slowly using a dropper.','Stir gently and observe color change.','Blue-green color indicates CuCl₂ formation.','Solution becomes more acidic (H₂SO₄ formed).','Test pH with indicator paper.','Record observations and color changes.'],observation:'Blue-green copper chloride (CuCl₂) solution forms. More acidic.'},
    'HCl+NaHCO3': {title:'🫧 CO₂ Fizz — HCl + NaHCO₃',formula:'HCl + NaHCO₃ → NaCl + H₂O + CO₂↑',sub:'Acid + Carbonate | Vigorous CO₂ fizz | Endothermic | Classic fizz test',badge:'CO₂ FIZZ',badgeColor:'#c0f8c0',effect:'fizz',liquidColor:'#c8f0c0',bgColor:'#e0f8e0',overview:'HCl reacts vigorously with NaHCO₃ producing CO₂ gas.\nSalt (NaCl) and water also formed. Used as classic CO₂ test with limewater.',chemNames:'• Hydrochloric Acid (HCl)\n• Sodium Bicarbonate (NaHCO₃)',tools:'• Beaker  • Dropper  • Limewater  • Delivery Tube',safety:'• Goggles  • Gloves',requiredSafety:['Goggles','Gloves'],steps:['Place a spatula of NaHCO₃ in a beaker.','Add dilute HCl slowly using a dropper.','Observe: vigorous fizzing/effervescence — CO₂ gas released.','Pass evolved gas through limewater — turns milky white.','Reaction proceeds until one reagent is exhausted.','Final solution is neutral NaCl in water.','This reaction is used in baking (acid + baking soda).'],observation:'Vigorous CO₂ fizzing. Limewater turns milky. Neutral NaCl remains.'},
    'CH3COOH+HCl': {title:'⚗ Mixed Acid Solution',formula:'HCl + CH₃COOH → H⁺-dominant mixed acid solution',sub:'Acid mixing | No net reaction | HCl dominates pH | Pungent mixed odor',badge:'ACID MIX',badgeColor:'#ffe080',effect:'bubbles',liquidColor:'#e0d8a0',bgColor:'#f0ecd0',overview:'HCl and CH₃COOH mix without reacting with each other.\nHCl dominates pH. Solution is more acidic than acetic acid alone.',chemNames:'• Hydrochloric Acid (HCl)\n• Acetic Acid (CH₃COOH)',tools:'• Beaker  • pH Meter',safety:'• Goggles  • Gloves  • Lab Coat',requiredSafety:['Goggles','Gloves','Lab Coat'],steps:['Measure 5 mL of dilute HCl into a beaker.','Add 5 mL of acetic acid solution.','Observe: no visible reaction — both are acids.','Measure pH — lower than acetic acid alone (HCl dominates).','The pungent odor is a mix of HCl fumes and vinegar.','This mixture is NOT a buffer.','Neutralize with NaOH for disposal.'],observation:'No visible reaction. Mixed acidic solution. HCl dominates pH.'},
    'HCl+NH4OH': {title:'⚗ NH₄OH + HCl — Ammonium Chloride',formula:'NH₄OH + HCl → NH₄Cl + H₂O',sub:'Weak Base–Strong Acid | Ammonium chloride (smelling salts) | pH ≈ 5',badge:'NEUTRALIZATION',badgeColor:'#a0f0c0',effect:'dissolve',liquidColor:'#c8e8d0',bgColor:'#e0f4e8',overview:'NH₄OH reacts with HCl forming ammonium chloride (smelling salts) and water.\nSolution is slightly acidic at equivalence (pH ≈ 5.1).',chemNames:'• Hydrochloric Acid (HCl)\n• Ammonium Hydroxide (NH₄OH)',tools:'• Beaker  • Dropper  • pH Meter  • Fume Hood',safety:'• Goggles  • Gloves  • Lab Coat  • Fume Hood',requiredSafety:['Goggles','Gloves','Lab Coat','Fume Hood'],steps:['Work in fume hood — NH₄OH releases ammonia.','Measure 10 mL NH₄OH into a beaker.','Add dilute HCl dropwise while stirring.','Ammonia smell decreases as HCl is added.','At equivalence: white NH₄Cl in solution.','Measure pH — slightly acidic (≈ 5.1).','NH₄Cl used in smelling salts and soldering flux.'],observation:'Ammonia odor reduces. NH₄Cl solution formed. pH ≈ 5.'},
    'CaCO3+HCl': {title:'🫧 Marble Chips + HCl',formula:'CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂↑',sub:'Acid + Carbonate | Vigorous CO₂ | Classic rate-of-reaction experiment',badge:'CO₂ FIZZ',badgeColor:'#c0f8c0',effect:'fizz',liquidColor:'#c8e8f0',bgColor:'#e0f4f8',overview:'CaCO₃ (marble chips) reacts with HCl to release CO₂ gas.\nClassic experiment for studying reaction rates — compare chips vs powder.',chemNames:'• Calcium Carbonate (CaCO₃)\n• Hydrochloric Acid (HCl)',tools:'• Conical Flask  • Measuring Cylinder  • Limewater  • Delivery Tube',safety:'• Goggles  • Gloves  • Lab Coat',requiredSafety:['Goggles','Gloves','Lab Coat'],steps:['Place 2g of marble chips (CaCO₃) in a conical flask.','Measure 20 mL of dilute HCl (2M) in a measuring cylinder.','Pour HCl into the flask — fizzing starts immediately.','Connect delivery tube to limewater — turns milky (CO₂ confirmed).','Observe: marble chips gradually dissolve.','Reaction slows as CaCO₃ is consumed.','Repeat with powder vs chips to compare reaction rates.'],observation:'Vigorous CO₂ fizzing. Marble chips dissolve in acid. Limewater turns milky.'},
    'HCl+Mg': {title:'⚡ Metal + Acid — H₂ Gas',formula:'Mg + 2HCl → MgCl₂ + H₂↑',sub:'Metal-Acid Reaction | Vigorous H₂ evolution | Squeaky pop test | Exothermic',badge:'H₂ GAS',badgeColor:'#80f0f0',effect:'fizz',liquidColor:'#80e8e8',bgColor:'#c0f4f4',overview:'Magnesium reacts vigorously with HCl releasing hydrogen gas.\nMgCl₂ solution remains. Squeaky pop test confirms H₂.',chemNames:'• Magnesium Ribbon (Mg)\n• Hydrochloric Acid (HCl)',tools:'• Test Tube  • Bunsen Burner  • Lighted Splint  • Tongs',safety:'• Goggles  • Gloves  • Lab Coat',requiredSafety:['Goggles','Gloves','Lab Coat'],steps:['Place a small strip of magnesium ribbon in a test tube.','Add dilute HCl (2M) — vigorous fizzing immediately.','Observe: bubbles of H₂ gas rising rapidly.','Collect H₂ gas by inverted test tube.','Apply a lighted splint to the mouth of the tube.','Hear the characteristic \'squeaky pop\' — confirms H₂.','Mg dissolves completely — MgCl₂ solution remains.'],observation:'Vigorous H₂ bubbling. Squeaky pop confirms H₂. Mg dissolves.'},
    'C2H5OH+HCl': {title:'⚗ Ethanol + HCl — Chloroethane Formation',formula:'C₂H₅OH + HCl → C₂H₅Cl + H₂O  (requires ZnCl₂ catalyst)',sub:'Substitution | Chloroethane gas | Requires catalyst | Organic chemistry',badge:'SUBSTITUTION',badgeColor:'#ffd0a0',effect:'smoke',liquidColor:'#d8d0a0',bgColor:'#ece8d0',overview:'Ethanol reacts with HCl in the presence of ZnCl₂ catalyst to form chloroethane.\nGaseous product — pungent sweet odor. Requires heating.',chemNames:'• Ethanol (C₂H₅OH)\n• Hydrochloric Acid (HCl)',tools:'• Round Flask  • Reflux Condenser  • ZnCl₂ catalyst  • Fume Hood',safety:'• Goggles  • Gloves  • Lab Coat  • Fume Hood',requiredSafety:['Goggles','Gloves','Lab Coat','Fume Hood'],steps:['Mix ethanol and concentrated HCl in a flask.','Add anhydrous ZnCl₂ as catalyst.','Heat gently in fume hood.','Collect gaseous C₂H₅Cl (b.p. 12°C) — sweet pungent odor.','Do NOT inhale — chloroethane is toxic.','Wash any residue with water.','Dispose carefully as chemical waste.'],observation:'Sweet pungent odor of chloroethane. Requires catalyst and heating.'},
    'H2SO4+NaOH': {title:'⚗ Neutralization — H₂SO₄ + NaOH',formula:'H₂SO₄ + 2NaOH → Na₂SO₄ + 2H₂O',sub:'Acid–Base Neutralization | Sodium sulfate salt | Strongly Exothermic',badge:'NEUTRALIZATION',badgeColor:'#a0f0c0',effect:'bubbles',liquidColor:'#c8e870',bgColor:'#d8f080',overview:'H₂SO₄ + 2NaOH → Na₂SO₄ + 2H₂O\nSodium sulfate (Glauber\'s salt) formed. Strongly exothermic — use caution.',chemNames:'• Sulfuric Acid (H₂SO₄)\n• Sodium Hydroxide (NaOH)',tools:'• Beaker  • Dropper  • Stirrer  • Thermometer',safety:'• Goggles  • Gloves  • Lab Coat  • Face Shield',requiredSafety:['Goggles','Gloves','Lab Coat','Face Shield'],steps:['Measure 10 mL of dilute H₂SO₄ carefully into a beaker.','Prepare NaOH solution (2M) in a separate container.','Add NaOH slowly and dropwise to the acid — not the reverse.','Stir constantly — strong heat is produced.','Monitor temperature with a thermometer.','Test with litmus until neutral (pH = 7).','Na₂SO₄ (Glauber\'s salt) remains on evaporation.'],observation:'Significant heat released. Sodium sulfate Na₂SO₄ in solution. pH → 7.'},
    'CuSO4+H2SO4': {title:'🔵 Acidified Copper Sulfate',formula:'CuSO₄ + H₂SO₄ → Cu²⁺ + 2HSO₄⁻  (acidified electrolyte)',sub:'Acidified solution | Prevents Cu(OH)₂ precipitation | Used in electroplating',badge:'ACIDIFIED SOL.',badgeColor:'#80d8ff',effect:'bubbles',liquidColor:'#2080c0',bgColor:'#80c8f0',overview:'H₂SO₄ acidifies CuSO₄ solution forming a stable electrolyte.\nThe acid prevents Cu(OH)₂ precipitation. Standard electrolyte for copper electroplating.',chemNames:'• Copper(II) Sulfate (CuSO₄)\n• Sulfuric Acid (H₂SO₄)',tools:'• Beaker  • Stirrer  • Measuring Cylinder',safety:'• Goggles  • Gloves  • Lab Coat  • Face Shield',requiredSafety:['Goggles','Gloves','Lab Coat','Face Shield'],steps:['Prepare CuSO₄ solution in a beaker.','Add dilute H₂SO₄ slowly and stir.','Observe — solution remains bright blue.','The acid prevents Cu(OH)₂ precipitation.','This is the standard electrolyte for Cu electroplating.','Measure pH — should be acidic (pH 2–4).','Use in electroplating or Daniell cell experiment.'],observation:'Bright blue acidified CuSO₄ solution. Stable for electroplating.'},
    'H2SO4+NaHCO3': {title:'🫧 H₂SO₄ + NaHCO₃ — Fire Extinguisher Reaction',formula:'H₂SO₄ + 2NaHCO₃ → Na₂SO₄ + 2H₂O + 2CO₂↑',sub:'Acid + Carbonate | Very vigorous CO₂ | Fire extinguisher principle',badge:'CO₂ FIZZ',badgeColor:'#c0f8c0',effect:'fizz',liquidColor:'#d0e8a0',bgColor:'#e8f4c0',overview:'H₂SO₄ reacts vigorously with NaHCO₃ releasing CO₂ gas rapidly.\nThis is the principle behind soda–acid fire extinguishers.',chemNames:'• Sulfuric Acid (H₂SO₄)\n• Sodium Bicarbonate (NaHCO₃)',tools:'• Beaker  • Dropper  • Limewater  • Fume Hood',safety:'• Goggles  • Gloves  • Lab Coat  • Face Shield',requiredSafety:['Goggles','Gloves','Lab Coat','Face Shield'],steps:['Add NaHCO₃ powder to a beaker.','Add dilute H₂SO₄ carefully and slowly.','Vigorous fizzing — CO₂ evolved rapidly.','Pass gas through limewater to confirm CO₂.','Heat NOT required — reaction is spontaneous.','This is the principle of soda–acid fire extinguisher.','Neutralize residue with water before disposal.'],observation:'Very vigorous CO₂ fizz. Na₂SO₄ solution remains. Limewater turns milky.'},
    'CH3COOH+H2SO4': {title:'⚗ Mixed Acid — CH₃COOH + H₂SO₄',formula:'CH₃COOH + H₂SO₄ → H₃O⁺ + CH₃COO⁻ + HSO₄⁻  (mixed acid solution)',sub:'Mixed acid | H₂SO₄ acts as dehydrating agent | No net reaction | Corrosive',badge:'ACID MIX',badgeColor:'#ffe080',effect:'smoke',liquidColor:'#d0c040',bgColor:'#e8d860',overview:'H₂SO₄ and CH₃COOH coexist as a mixed acid solution.\nH₂SO₄ can act as a dehydrating agent for acetic acid at high concentration. Corrosive.',chemNames:'• Acetic Acid (CH₃COOH)\n• Sulfuric Acid (H₂SO₄)',tools:'• Beaker  • Fume Hood  • pH Meter',safety:'• Goggles  • Gloves  • Lab Coat  • Face Shield  • Fume Hood',requiredSafety:['Goggles','Gloves','Lab Coat','Face Shield','Fume Hood'],steps:['Work entirely in the fume hood.','Measure small volumes of each acid.','Mix carefully — no vigorous reaction at room temperature.','Observe: pungent mixed acid fumes.','Measure pH — very acidic.','H₂SO₄ can dehydrate acetic acid at high concentrations.','Neutralize all waste carefully with NaHCO₃.'],observation:'Highly corrosive mixed acid. Pungent fumes. Very low pH.'},
    'H2SO4+NH4OH': {title:'⚗ NH₄OH + H₂SO₄ — Ammonium Sulfate Fertilizer',formula:'2NH₄OH + H₂SO₄ → (NH₄)₂SO₄ + 2H₂O',sub:'Weak Base–Strong Acid | Ammonium sulfate fertilizer | pH ≈ 5',badge:'NEUTRALIZATION',badgeColor:'#a0f0c0',effect:'dissolve',liquidColor:'#d0e8a0',bgColor:'#e8f4c8',overview:'NH₄OH + H₂SO₄ → (NH₄)₂SO₄ + H₂O\nAmmonium sulfate — an important nitrogen fertilizer — is formed.',chemNames:'• Ammonium Hydroxide (NH₄OH)\n• Sulfuric Acid (H₂SO₄)',tools:'• Beaker  • Dropper  • Fume Hood  • Evaporating Dish',safety:'• Goggles  • Gloves  • Lab Coat  • Face Shield  • Fume Hood',requiredSafety:['Goggles','Gloves','Lab Coat','Face Shield','Fume Hood'],steps:['Work in fume hood — NH₃ fumes from NH₄OH.','Add NH₄OH solution to a beaker.','Add dilute H₂SO₄ slowly and carefully.','Stir continuously — ammonia smell reduces.','At equivalence: colorless (NH₄)₂SO₄ solution.','Evaporate gently to obtain white crystalline (NH₄)₂SO₄.','Used commercially as nitrogen fertilizer.'],observation:'Colorless (NH₄)₂SO₄ solution. Ammonia smell gone. White crystals on evaporation.'},
    'CaCO3+H2SO4': {title:'🫧 CaCO₃ + H₂SO₄ — Self-Limiting Reaction',formula:'CaCO₃ + H₂SO₄ → CaSO₄↓ + H₂O + CO₂↑',sub:'Self-limiting | Insoluble CaSO₄ crust stops reaction | Brief CO₂ then stops',badge:'SELF-LIMITING',badgeColor:'#f0e8c0',effect:'fizz',liquidColor:'#e0dcc8',bgColor:'#ede8d8',overview:'CaCO₃ reacts with H₂SO₄ but quickly forms an insoluble CaSO₄ crust.\nThis crust stops further reaction — H₂SO₄ is unsuitable for gas preparation from carbonates.',chemNames:'• Calcium Carbonate (CaCO₃)\n• Sulfuric Acid (H₂SO₄)',tools:'• Beaker  • Spatula  • Fume Hood',safety:'• Goggles  • Gloves  • Lab Coat  • Face Shield',requiredSafety:['Goggles','Gloves','Lab Coat','Face Shield'],steps:['Place marble chips into a beaker.','Add dilute H₂SO₄ carefully.','Initial fizzing observed — CO₂ released briefly.','Fizzing stops quickly — insoluble CaSO₄ coats the marble.','This \'passivation\' prevents further reaction.','Compare with HCl — HCl reacts continuously, H₂SO₄ stops.','This demonstrates why dilute H₂SO₄ is unsuitable for gas preparation.'],observation:'Brief fizzing then stops. White CaSO₄ crust coats marble — self-limiting.'},
    'H2SO4+Mg': {title:'⚡ Magnesium + H₂SO₄ — Epsom Salt',formula:'Mg + H₂SO₄ → MgSO₄ + H₂↑',sub:'Metal-Acid Reaction | H₂ gas evolved | MgSO₄ (Epsom salt) formed',badge:'H₂ GAS',badgeColor:'#80f0f0',effect:'fizz',liquidColor:'#d0e870',bgColor:'#e8f8a0',overview:'Mg reacts with dilute H₂SO₄ releasing H₂ gas.\nMagnesium sulfate (Epsom salt, used in bath salts) remains in solution.',chemNames:'• Magnesium Ribbon (Mg)\n• Sulfuric Acid (H₂SO₄)',tools:'• Test Tube  • Lighted Splint  • Measuring Cylinder',safety:'• Goggles  • Gloves  • Lab Coat  • Face Shield',requiredSafety:['Goggles','Gloves','Lab Coat','Face Shield'],steps:['Place magnesium ribbon in a test tube.','Add dilute H₂SO₄ carefully.','Observe vigorous effervescence — H₂ gas evolved.','Test evolved gas with burning splint — squeaky pop.','Solution turns colorless — MgSO₄ (Epsom salt) forms.','Note: concentrated H₂SO₄ may produce SO₂ instead of H₂.','Dispose of MgSO₄ solution safely.'],observation:'Vigorous H₂ fizzing. Clear MgSO₄ (Epsom salt) solution forms.'},
    'C2H5OH+H2SO4': {title:'🧴 Ethanol + H₂SO₄ — Dehydration / Esterification Catalyst',formula:'C₂H₅OH + H₂SO₄ → C₂H₄ + H₂O  (170°C)  OR  H₂SO₄ acts as esterification catalyst',sub:'Dehydration at 170°C → Ethylene | Catalyst at 60°C for ester synthesis',badge:'DEHYDRATION',badgeColor:'#ffd0a0',effect:'smoke',liquidColor:'#d8c030',bgColor:'#e8d860',overview:'At 170°C: H₂SO₄ dehydrates ethanol to produce ethylene gas.\nAt ~60°C: H₂SO₄ acts as catalyst for esterification. Both require fume hood.',chemNames:'• Ethanol (C₂H₅OH)\n• Sulfuric Acid (H₂SO₄)',tools:'• Round Flask  • Thermometer  • Delivery Tube  • Fume Hood',safety:'• Goggles  • Gloves  • Lab Coat  • Face Shield  • Fume Hood',requiredSafety:['Goggles','Gloves','Lab Coat','Face Shield','Fume Hood'],steps:['Carry out entirely in fume hood.','Mix ethanol and conc. H₂SO₄ carefully (add acid to ethanol).','For dehydration: heat to 170°C — ethylene gas evolved.','For esterification catalyst: use at ~60°C with a carboxylic acid.','Observe: charring may occur (H₂SO₄ dehydrates organics).','Wash all glassware immediately after use.','Neutralize waste with NaHCO₃.'],observation:'Ethylene gas (dehydration at 170°C) or ester aroma (catalyst mode).'},
    'CuSO4+NaOH': {title:'🔵 Precipitation — Cu(OH)₂',formula:'CuSO₄ + 2NaOH → Cu(OH)₂↓ + Na₂SO₄',sub:'Double Displacement | Pale blue Cu(OH)₂ precipitate | Classic Cu²⁺ test',badge:'PRECIPITATION',badgeColor:'#88ccff',effect:'precipitate',liquidColor:'#4090d0',bgColor:'#a0c8f0',overview:'CuSO₄ + 2NaOH → Cu(OH)₂↓ + Na₂SO₄\nPale blue gelatinous precipitate of Cu(OH)₂ forms. Classic qualitative test for Cu²⁺ ions.',chemNames:'• Copper(II) Sulfate (CuSO₄)\n• Sodium Hydroxide (NaOH)',tools:'• Test Tube  • Dropper  • Stirrer',safety:'• Goggles  • Gloves  • Lab Coat',requiredSafety:['Goggles','Gloves','Lab Coat'],steps:['Take a clean test tube.','Add 5 mL of CuSO₄ (blue) solution.','Add NaOH solution slowly, drop by drop.','Observe: pale blue gelatinous precipitate — Cu(OH)₂.','Allow precipitate to settle at the bottom.','Heat the tube gently — precipitate turns black (CuO forms).','Record: initial color, precipitate color, and change on heating.'],observation:'Pale blue Cu(OH)₂ precipitate. Turns black CuO on heating.'},
    'CuSO4+NaHCO3': {title:'🔵 CuSO₄ + NaHCO₃ — Malachite (Basic Copper Carbonate)',formula:'2CuSO₄ + 4NaHCO₃ → Cu₂(OH)₂CO₃↓ + 4CO₂↑ + 2Na₂SO₄ + H₂O',sub:'Double Displacement | Green-blue malachite precipitate | CO₂ also evolved',badge:'PRECIPITATION',badgeColor:'#88ccff',effect:'precipitate',liquidColor:'#40a060',bgColor:'#80e0a0',overview:'CuSO₄ + NaHCO₃ forms basic copper carbonate (malachite — green mineral).\nCO₂ gas is also evolved. The green precipitate is the mineral malachite.',chemNames:'• Copper(II) Sulfate (CuSO₄)\n• Sodium Bicarbonate (NaHCO₃)',tools:'• Test Tube  • Dropper  • Delivery Tube',safety:'• Goggles  • Gloves  • Lab Coat',requiredSafety:['Goggles','Gloves','Lab Coat'],steps:['Add 5 mL of CuSO₄ solution to a test tube.','Add NaHCO₃ solution dropwise.','Observe: pale green-blue precipitate forms immediately.','CO₂ gas also evolved — fizzing visible.','Precipitate is basic copper carbonate Cu₂(OH)₂CO₃ (malachite).','Collect precipitate by filtration.','This is the natural mineral malachite.'],observation:'Green-blue malachite precipitate (Cu₂(OH)₂CO₃). CO₂ gas evolved.'},
    'CH3COOH+CuSO4': {title:'🔵 CuSO₄ + CH₃COOH — Copper Acetate',formula:'CuSO₄ + 2CH₃COOH → Cu(CH₃COO)₂ + H₂SO₄  (partial, slow)',sub:'Salt metathesis | Copper acetate in solution | Slow exchange reaction',badge:'METATHESIS',badgeColor:'#80d8ff',effect:'dissolve',liquidColor:'#2070a8',bgColor:'#90c8e8',overview:'CuSO₄ and CH₃COOH can form copper acetate in solution.\nReaction is slow and partial. Copper acetate has uses in dye manufacturing.',chemNames:'• Copper(II) Sulfate (CuSO₄)\n• Acetic Acid (CH₃COOH)',tools:'• Beaker  • Stirrer  • Hot Plate',safety:'• Goggles  • Gloves  • Lab Coat',requiredSafety:['Goggles','Gloves','Lab Coat'],steps:['Dissolve CuSO₄ in water in a beaker.','Add glacial acetic acid or concentrated CH₃COOH.','Heat gently with stirring.','Blue-green color maintained — Cu(CH₃COO)₂ forms.','Solution remains acidic due to H₂SO₄ also produced.','Cool and observe crystal formation on evaporation.','Copper acetate used in dyes and wood preservatives.'],observation:'Blue-green copper acetate solution. Slow exchange at room temperature.'},
    'CuSO4+NH4OH': {title:'🔷 Deep Blue Tetraammine Copper Complex',formula:'CuSO₄ + 4NH₄OH → [Cu(NH₃)₄]SO₄ + 4H₂O',sub:'Complex ion formation | Deep royal blue [Cu(NH₃)₄]²⁺ | Striking color change',badge:'COMPLEX ION',badgeColor:'#60a8ff',effect:'dissolve',liquidColor:'#1030c0',bgColor:'#4060e0',overview:'Excess NH₄OH reacts with CuSO₄ to form the intensely deep blue tetraammincopper(II) complex.\nDramatic color change from pale blue to deep royal blue.',chemNames:'• Copper(II) Sulfate (CuSO₄)\n• Ammonium Hydroxide (NH₄OH)',tools:'• Test Tube  • Dropper  • Fume Hood',safety:'• Goggles  • Gloves  • Lab Coat  • Fume Hood',requiredSafety:['Goggles','Gloves','Lab Coat','Fume Hood'],steps:['Add 5 mL of CuSO₄ solution to a test tube.','Add a few drops of NH₄OH — pale blue precipitate forms first.','Continue adding excess NH₄OH — precipitate dissolves.','Observe: dramatic change to intensely deep royal blue color.','This is the [Cu(NH₃)₄]²⁺ tetraammine complex ion.','Used as a qualitative test for Cu²⁺ ions.','Work in fume hood — ammonia fumes are released.'],observation:'Dramatic pale blue → deep royal blue. [Cu(NH₃)₄]²⁺ complex formed.'},
    'CaCO3+CuSO4': {title:'🔄 CaCO₃ + CuSO₄ — Double Displacement',formula:'CaCO₃ + CuSO₄ → CuCO₃↓ + CaSO₄↓  (both insoluble, slow)',sub:'Double Displacement | Two precipitates | Very slow reaction in dilute solution',badge:'PRECIPITATION',badgeColor:'#88ccff',effect:'precipitate',liquidColor:'#40a0c0',bgColor:'#80d0e0',overview:'CaCO₃ and CuSO₄ can theoretically undergo double displacement.\nBoth products (CuCO₃ and CaSO₄) are insoluble — reaction is very slow in dilute solution.',chemNames:'• Calcium Carbonate (CaCO₃)\n• Copper(II) Sulfate (CuSO₄)',tools:'• Beaker  • Stirrer  • Hot Plate',safety:'• Goggles  • Gloves  • Lab Coat',requiredSafety:['Goggles','Gloves','Lab Coat'],steps:['Add CuSO₄ solution to a beaker.','Add powdered CaCO₃ and stir.','Reaction is very slow at room temperature.','Heat may accelerate slightly.','Green-blue CuCO₃ and white CaSO₄ may form on evaporation.','Filter to collect precipitates.','This reaction demonstrates the common-ion effect.'],observation:'Very slow reaction. Green-blue CuCO₃ and white CaSO₄ precipitate on evaporation.'},
    'CuSO4+Mg': {title:'⚡ Single Displacement — Copper Deposition',formula:'Mg + CuSO₄ → MgSO₄ + Cu↓',sub:'Single Displacement | Copper metal deposits | Mg displaces Cu | Exothermic',badge:'DISPLACEMENT',badgeColor:'#ff8844',effect:'precipitate',liquidColor:'#a06020',bgColor:'#c08040',overview:'Magnesium (more reactive) displaces copper from CuSO₄ solution.\nRed-brown copper metal deposits on the Mg surface. Solution becomes colorless (MgSO₄).',chemNames:'• Magnesium Ribbon (Mg)\n• Copper(II) Sulfate (CuSO₄)',tools:'• Beaker  • Tongs  • Filter Paper',safety:'• Goggles  • Gloves  • Lab Coat',requiredSafety:['Goggles','Gloves','Lab Coat'],steps:['Pour CuSO₄ solution into a clean beaker.','Place a strip of Mg ribbon into the blue solution.','Observe immediately: red-brown copper deposits on Mg surface.','The blue color of the solution fades as Cu²⁺ is used up.','MgSO₄ (colorless) forms in solution.','Remove the Mg strip — coated with red-brown copper metal.','This demonstrates the reactivity series — Mg > Cu.'],observation:'Red-brown Cu metal deposits on Mg. Blue color fades — Mg is above Cu in reactivity series.'},
    'C2H5OH+CuSO4': {title:'🔵 Ethanol + CuSO₄ — No Significant Reaction',formula:'C₂H₅OH + CuSO₄ → No significant reaction at room temperature',sub:'No net reaction | Cu²⁺ may weakly coordinate with ethanol | Miscible liquids',badge:'NO REACTION',badgeColor:'#c0c0c0',effect:'dissolve',liquidColor:'#2878b8',bgColor:'#a8c8e8',overview:'Ethanol and aqueous CuSO₄ do not react significantly at room temperature.\nCu²⁺ ions remain in solution. The mixture remains blue.',chemNames:'• Ethanol (C₂H₅OH)\n• Copper(II) Sulfate (CuSO₄)',tools:'• Beaker  • Stirrer',safety:'• Goggles  • Gloves  • Lab Coat',requiredSafety:['Goggles','Gloves','Lab Coat'],steps:['Add CuSO₄ solution to a beaker.','Add ethanol and stir.','No visible reaction — solution remains blue.','No precipitate, no gas, no color change.','CuSO₄ can be used to detect water in ethanol (turns white anhydrous CuSO₄ blue).','Record: color, clarity, and any temperature change.','No significant chemical reaction has occurred.'],observation:'No reaction at room temperature. Blue solution maintained.'},
    'NaHCO3+NaOH': {title:'🧪 NaHCO₃ + NaOH — Sodium Carbonate Formation',formula:'NaHCO₃ + NaOH → Na₂CO₃ + H₂O',sub:'Base + Weak base salt | Na₂CO₃ (washing soda) formed | Mildly exothermic',badge:'NEUTRALIZATION',badgeColor:'#a0f0c0',effect:'dissolve',liquidColor:'#90d890',bgColor:'#c8f0c8',overview:'NaHCO₃ reacts with NaOH to form sodium carbonate (Na₂CO₃ — washing soda).\nSolution becomes strongly alkaline.',chemNames:'• Sodium Bicarbonate (NaHCO₃)\n• Sodium Hydroxide (NaOH)',tools:'• Beaker  • Stirrer  • pH Meter',safety:'• Goggles  • Gloves  • Lab Coat',requiredSafety:['Goggles','Gloves','Lab Coat'],steps:['Dissolve NaHCO₃ in water in a beaker.','Add NaOH solution and stir.','Observe: no visible reaction — solutions mix.','Measure pH — strongly alkaline (pH > 11).','Na₂CO₃ (sodium carbonate / washing soda) forms.','Evaporate gently to recover Na₂CO₃ crystals.','This is used industrially to produce washing soda.'],observation:'Strongly alkaline Na₂CO₃ solution formed. pH > 11.'},
    'CH3COOH+NaOH': {title:'⚗ Acetic Acid + NaOH — Titration',formula:'CH₃COOH + NaOH → CH₃COONa + H₂O',sub:'Weak Acid–Strong Base | Sodium acetate | Buffer region | pH > 7 at equivalence',badge:'NEUTRALIZATION',badgeColor:'#a0f0c0',effect:'bubbles',liquidColor:'#c0f0d0',bgColor:'#d8f8e8',overview:'CH₃COOH + NaOH → CH₃COONa + H₂O\nSodium acetate (a salt) formed. Slightly alkaline at equivalence point (pH ≈ 8.7). Shows buffer behavior.',chemNames:'• Acetic Acid (CH₃COOH)\n• Sodium Hydroxide (NaOH)',tools:'• Beaker  • Burette  • pH Meter  • Phenolphthalein Indicator',safety:'• Goggles  • Gloves  • Lab Coat',requiredSafety:['Goggles','Gloves','Lab Coat'],steps:['Add 10 mL of acetic acid to a beaker.','Add NaOH solution dropwise from a burette.','Monitor pH continuously — rises gradually (buffer action).','At half-equivalence point: pH = pKa = 4.76 (buffer).','At equivalence point: pH ≈ 8.7 (slightly alkaline).','Use phenolphthalein indicator — turns pink at equivalence.','Record the titration curve — note the buffer region.'],observation:'Gentle neutralization. Sodium acetate solution formed. pH > 7 at equivalence.'},
    'NH4OH+NaOH': {title:'🧪 NaOH + NH₄OH — Highly Alkaline Mix',formula:'NaOH + NH₄OH → Na⁺ + OH⁻ + NH₄⁺ + OH⁻  (highly alkaline, NH₃ released)',sub:'Base mixture | pH > 13 | Ammonia fumes intensify | No net reaction',badge:'BASE MIX',badgeColor:'#a0f0a0',effect:'smoke',liquidColor:'#80d080',bgColor:'#b0f0b0',overview:'Mixing NaOH and NH₄OH gives a highly alkaline solution.\nNaOH suppresses NH₄⁺ equilibrium, releasing more NH₃. Ammonia fumes intensify.',chemNames:'• Ammonium Hydroxide (NH₄OH)\n• Sodium Hydroxide (NaOH)',tools:'• Beaker  • Fume Hood  • pH Meter',safety:'• Goggles  • Gloves  • Lab Coat  • Fume Hood',requiredSafety:['Goggles','Gloves','Lab Coat','Fume Hood'],steps:['Work entirely inside the fume hood.','Measure NaOH solution into a beaker.','Add NH₄OH slowly while stirring.','Observe: pungent ammonia smell intensifies.','Measure pH — very high (pH > 13).','NaOH suppresses NH₄⁺ equilibrium, releasing more NH₃.','Dispose carefully — neutralize with dilute HCl.'],observation:'Highly alkaline solution. pH > 13. Strong ammonia odor released.'},
    'CaCO3+NaOH': {title:'🧪 CaCO₃ + NaOH — No Significant Reaction',formula:'CaCO₃ + 2NaOH → No reaction  (CaCO₃ is insoluble and unreactive with bases)',sub:'No reaction | CaCO₃ insoluble in base | Both are alkaline | Mixture only',badge:'NO REACTION',badgeColor:'#c0c0c0',effect:'dissolve',liquidColor:'#d0d8d0',bgColor:'#e8f0e8',overview:'CaCO₃ does not react significantly with NaOH under normal lab conditions.\nCaCO₃ is insoluble in alkaline solution. Both are basic — no acid-base reaction occurs.',chemNames:'• Calcium Carbonate (CaCO₃)\n• Sodium Hydroxide (NaOH)',tools:'• Beaker  • Stirrer',safety:'• Goggles  • Gloves  • Lab Coat',requiredSafety:['Goggles','Gloves','Lab Coat'],steps:['Add NaOH solution to a beaker.','Add CaCO₃ powder and stir.','Observe: no visible reaction — no gas, no precipitate dissolving.','CaCO₃ remains insoluble in alkaline solution.','Measure pH — alkaline (due to NaOH).','No chemical change has occurred.','Filter off undissolved CaCO₃.'],observation:'No reaction. CaCO₃ remains undissolved. Alkaline solution due to NaOH.'},
    'Mg+NaOH': {title:'⚗ Mg + NaOH — Very Slow Reaction',formula:'Mg + 2NaOH + 2H₂O → Na₂[Mg(OH)₄] + H₂↑  (very slow)',sub:'Very slow | Mg reacts slowly with concentrated NaOH | H₂ evolved slowly',badge:'SLOW REACTION',badgeColor:'#c8f0c0',effect:'bubbles',liquidColor:'#90d090',bgColor:'#c0e8c0',overview:'Mg reacts very slowly with concentrated NaOH solution, releasing H₂ gas.\nUnlike Al, Mg does not react readily with dilute alkalis at room temperature.',chemNames:'• Magnesium Ribbon (Mg)\n• Sodium Hydroxide (NaOH)',tools:'• Test Tube  • Concentrated NaOH  • Lighted Splint',safety:'• Goggles  • Gloves  • Lab Coat',requiredSafety:['Goggles','Gloves','Lab Coat'],steps:['Place Mg ribbon in a test tube.','Add concentrated NaOH solution (not dilute).','Observe: very slow or no visible reaction at room temperature.','Heat gently — very slow H₂ evolution may occur.','Test any evolved gas with a lighted splint — faint squeaky pop.','Note: Mg reacts much more slowly with alkali than with acid.','Record rate comparison with Mg + HCl.'],observation:'Very slow or no visible reaction. Mg is much less reactive with alkalis than acids.'},
    'C2H5OH+NaOH': {title:'🧪 Ethanol + NaOH — No Significant Reaction',formula:'C₂H₅OH + NaOH → No significant reaction  (alcohols are too weakly acidic)',sub:'No net reaction | Alcohols do not react with dilute NaOH | pKa ~16',badge:'NO REACTION',badgeColor:'#c0c0c0',effect:'dissolve',liquidColor:'#a8d8a8',bgColor:'#d0f0d0',overview:'Ethanol does not react with dilute NaOH under normal lab conditions.\nAlcohols have pKa ~16 — too weak to react with NaOH. No visible change occurs.',chemNames:'• Ethanol (C₂H₅OH)\n• Sodium Hydroxide (NaOH)',tools:'• Beaker  • Stirrer',safety:'• Goggles  • Gloves  • Lab Coat',requiredSafety:['Goggles','Gloves','Lab Coat'],steps:['Add NaOH solution to a beaker.','Add ethanol and stir.','No visible reaction — solutions mix freely.','No gas, no precipitate, no color change.','Alcohols are too weakly acidic (pKa ~16) to react with NaOH.','Measure pH — alkaline (due to NaOH remaining).','This is an important contrast to carboxylic acids, which do react.'],observation:'No reaction. Ethanol and NaOH mix without reacting.'},
    'CH3COOH+NaHCO3': {title:'🫧 Vinegar + Baking Soda',formula:'CH₃COOH + NaHCO₃ → CH₃COONa + H₂O + CO₂↑',sub:'Weak Acid + Carbonate | Gentle CO₂ fizz | Sodium acetate | Classic kitchen reaction',badge:'CO₂ FIZZ',badgeColor:'#c0f8c0',effect:'fizz',liquidColor:'#e0f0c8',bgColor:'#f0f8e0',overview:'CH₃COOH reacts with NaHCO₃ releasing CO₂ and forming sodium acetate.\nGentler than HCl reaction — classic kitchen chemistry (vinegar + baking soda).',chemNames:'• Acetic Acid (CH₃COOH)\n• Sodium Bicarbonate (NaHCO₃)',tools:'• Beaker  • Dropper  • Limewater',safety:'• Goggles  • Gloves',requiredSafety:['Goggles','Gloves'],steps:['Pour 10 mL of acetic acid into a beaker.','Add a spatula of NaHCO₃ powder slowly.','Observe: gentle fizzing — CO₂ released.','Pass gas through limewater — turns milky (confirms CO₂).','The vinegar smell decreases as acid is consumed.','Final solution: sodium acetate (CH₃COONa) — slightly alkaline.','This is exactly the \'vinegar + baking soda\' kitchen reaction.'],observation:'Gentle CO₂ fizz. Vinegar smell reduces. Sodium acetate solution formed.'},
    'NH4OH+NaHCO3': {title:'🧪 NH₄OH + NaHCO₃ — Alkaline Mixture',formula:'NH₄OH + NaHCO₃ → NH₄HCO₃ + NaOH  (partial) OR mixed alkaline solution',sub:'Two bases | Mildly alkaline mixture | No dramatic reaction | pH ~9',badge:'ALKALINE MIX',badgeColor:'#c0f0c0',effect:'dissolve',liquidColor:'#b0d8b0',bgColor:'#d0f0d0',overview:'NH₄OH and NaHCO₃ are both weakly alkaline.\nThey coexist without significant reaction. The solution is mildly alkaline.',chemNames:'• Ammonium Hydroxide (NH₄OH)\n• Sodium Bicarbonate (NaHCO₃)',tools:'• Beaker  • Stirrer  • pH Meter  • Fume Hood',safety:'• Goggles  • Gloves  • Lab Coat  • Fume Hood',requiredSafety:['Goggles','Gloves','Lab Coat','Fume Hood'],steps:['Work near fume hood — NH₄OH releases ammonia.','Add NaHCO₃ solution to a beaker.','Add NH₄OH slowly and stir.','No vigorous reaction — mild ammonia odor.','Measure pH — mildly alkaline (pH 8–9).','No precipitate, no gas evolved.','This mixture is used in some analytical procedures.'],observation:'Mild alkaline mixture. pH 8–9. Faint ammonia odor. No vigorous reaction.'},
    'CaCO3+NaHCO3': {title:'🧪 CaCO₃ + NaHCO₃ — No Reaction',formula:'CaCO₃ + NaHCO₃ → No significant reaction  (both are carbonates/basic salts)',sub:'No reaction | Both are carbonates | Neutral to slightly alkaline mixture',badge:'NO REACTION',badgeColor:'#c0c0c0',effect:'dissolve',liquidColor:'#e0e8e0',bgColor:'#f0f4f0',overview:'CaCO₃ and NaHCO₃ do not react with each other.\nBoth are carbonates/salts. The mixture is neutral to slightly alkaline.',chemNames:'• Calcium Carbonate (CaCO₃)\n• Sodium Bicarbonate (NaHCO₃)',tools:'• Beaker  • Stirrer',safety:'• Goggles  • Gloves',requiredSafety:['Goggles','Gloves'],steps:['Mix CaCO₃ powder with NaHCO₃ solution.','Stir thoroughly.','No gas, no precipitate, no color change.','Measure pH — slightly alkaline.','Both are stable carbonates — no reaction occurs.','This confirms that two bases/salts don\'t react with each other.','Filter off undissolved CaCO₃.'],observation:'No reaction. Both are alkaline — no acid-base reaction. Slightly alkaline mixture.'},
    'Mg+NaHCO3': {title:'🧪 Mg + NaHCO₃ — Very Slow / No Reaction',formula:'Mg + NaHCO₃ → No significant reaction at room temperature',sub:'No visible reaction | Mg does not react with weakly alkaline bicarbonate',badge:'NO REACTION',badgeColor:'#c0c0c0',effect:'dissolve',liquidColor:'#d0d8c8',bgColor:'#e8f0e0',overview:'Magnesium does not react with sodium bicarbonate solution under normal conditions.\nNaHCO₃ is too weakly acidic/basic to attack Mg metal at room temperature.',chemNames:'• Magnesium Ribbon (Mg)\n• Sodium Bicarbonate (NaHCO₃)',tools:'• Beaker  • Stirrer',safety:'• Goggles  • Gloves',requiredSafety:['Goggles','Gloves'],steps:['Place Mg ribbon in a beaker.','Add NaHCO₃ solution.','Observe: no visible reaction.','No gas, no color change, no precipitate.','NaHCO₃ is too weakly alkaline to react with Mg.','Compare with Mg + HCl — dramatic difference.','Mg remains unchanged — remove and dry.'],observation:'No visible reaction. Mg remains unchanged in NaHCO₃ solution.'},
    'C2H5OH+NaHCO3': {title:'🧪 Ethanol + NaHCO₃ — No Reaction',formula:'C₂H₅OH + NaHCO₃ → No reaction  (alcohols too weakly acidic for NaHCO₃)',sub:'No reaction | Alcohols (pKa ~16) too weak to react with NaHCO₃ | Carboxylic acids do',badge:'NO REACTION',badgeColor:'#c0c0c0',effect:'dissolve',liquidColor:'#e8e0c8',bgColor:'#f4f0e0',overview:'Ethanol does not react with NaHCO₃.\nThis is a key test: carboxylic acids fizz with NaHCO₃, but alcohols do not.',chemNames:'• Ethanol (C₂H₅OH)\n• Sodium Bicarbonate (NaHCO₃)',tools:'• Test Tube  • Dropper',safety:'• Goggles  • Gloves',requiredSafety:['Goggles','Gloves'],steps:['Add NaHCO₃ solution to a test tube.','Add a few drops of ethanol.','Observe: no fizzing — no CO₂ evolved.','No visible reaction occurs.','This distinguishes alcohols from carboxylic acids.','Compare with CH₃COOH + NaHCO₃ — that does fizz.','Important diagnostic test in organic chemistry.'],observation:'No reaction. No CO₂ evolved. Distinguishes alcohols from carboxylic acids.'},
    'CH3COOH+NH4OH': {title:'⚗ NH₄OH + CH₃COOH — see CH3COOH+NH4OH',formula:'CH₃COOH + NH₄OH → CH₃COONH₄ + H₂O',sub:'Weak Acid–Weak Base | Ammonium acetate | pH ≈ 7',badge:'NEUTRALIZATION',badgeColor:'#a0f0c0',effect:'dissolve',liquidColor:'#c8e8c0',bgColor:'#e0f4d8',overview:'CH₃COOH + NH₄OH → CH₃COONH₄ + H₂O\nAmmonium acetate (nearly neutral salt) formed.',chemNames:'• Acetic Acid (CH₃COOH)\n• Ammonium Hydroxide (NH₄OH)',tools:'• Beaker  • Dropper  • pH Meter  • Fume Hood',safety:'• Goggles  • Gloves  • Lab Coat  • Fume Hood',requiredSafety:['Goggles','Gloves','Lab Coat','Fume Hood'],steps:['Work near fume hood — NH₄OH releases ammonia.','Measure 10 mL of acetic acid.','Add NH₄OH slowly while stirring.','Ammonia odor decreases as reaction proceeds.','At equivalence: ammonium acetate formed.','Measure pH — close to 7.','Ammonium acetate used as buffer and food additive.'],observation:'Ammonium acetate solution formed. pH ≈ 7. Ammonia smell decreases.'},
    'CH3COOH+CaCO3': {title:'🫧 Marble Chips + Acetic Acid',formula:'CaCO₃ + 2CH₃COOH → Ca(CH₃COO)₂ + H₂O + CO₂↑',sub:'Acid + Carbonate | Gentle CO₂ | Slower than HCl | Rate comparison',badge:'CO₂ FIZZ',badgeColor:'#c0f8c0',effect:'fizz',liquidColor:'#e0f0d0',bgColor:'#f0f8e8',overview:'CaCO₃ reacts with acetic acid (weak acid) much more slowly than with HCl.\nCalcium acetate solution forms. Classic rate-of-reaction comparison experiment.',chemNames:'• Calcium Carbonate (CaCO₃)\n• Acetic Acid (CH₃COOH)',tools:'• Beaker  • Limewater  • Delivery Tube',safety:'• Goggles  • Gloves',requiredSafety:['Goggles','Gloves'],steps:['Place marble chips in a beaker.','Add 5% acetic acid solution.','Observe: gentle, slow fizzing — much slower than HCl.','Pass gas through limewater — confirms CO₂.','Calcium acetate remains in solution.','Compare rate with HCl reaction — weak acid is slower.','This demonstrates acid strength affects reaction rate.'],observation:'Gentle CO₂ fizz. Slower than HCl. Calcium acetate in solution.'},
    'CH3COOH+Mg': {title:'⚡ Magnesium + Acetic Acid',formula:'Mg + 2CH₃COOH → Mg(CH₃COO)₂ + H₂↑',sub:'Metal + Weak Acid | Slower H₂ than with HCl | Magnesium acetate formed',badge:'H₂ GAS',badgeColor:'#80f0f0',effect:'fizz',liquidColor:'#e8f0c0',bgColor:'#f4f8e0',overview:'Mg reacts with acetic acid (weak acid) more slowly than with HCl.\nH₂ gas and magnesium acetate are produced. Rate depends on acid concentration.',chemNames:'• Magnesium Ribbon (Mg)\n• Acetic Acid (CH₃COOH)',tools:'• Test Tube  • Lighted Splint',safety:'• Goggles  • Gloves  • Lab Coat',requiredSafety:['Goggles','Gloves','Lab Coat'],steps:['Place a strip of magnesium ribbon in a test tube.','Add 5% acetic acid solution.','Observe: slower and gentler fizzing vs HCl (weak acid).','H₂ gas is still confirmed by squeaky pop test.','Vinegar smell reduces as acetic acid is consumed.','Magnesium acetate solution remains — colorless.','Compare rate with HCl reaction — weaker acid = slower rate.'],observation:'Gentle H₂ fizz (slower than HCl). Magnesium acetate forms. Squeaky pop.'},
    'C2H5OH+CH3COOH': {title:'🧴 Esterification — Ethyl Acetate',formula:'C₂H₅OH + CH₃COOH ⇌ CH₃COOC₂H₅ + H₂O',sub:'Esterification | Fruity ethyl acetate aroma | Reversible | H₂SO₄ catalyst needed',badge:'ESTERIFICATION',badgeColor:'#f0d0a0',effect:'smoke',liquidColor:'#f0e0c0',bgColor:'#f8f0d8',overview:'C₂H₅OH + CH₃COOH ⇌ Ethyl acetate + H₂O (reversible equilibrium).\nFruity-smelling ethyl acetate ester formed. Requires H₂SO₄ catalyst and heat.',chemNames:'• Ethanol (C₂H₅OH)\n• Acetic Acid (CH₃COOH)',tools:'• Round Flask  • Reflux Condenser  • Burner  • H₂SO₄ catalyst  • Fume Hood',safety:'• Goggles  • Gloves  • Lab Coat  • Fume Hood',requiredSafety:['Goggles','Gloves','Lab Coat','Fume Hood'],steps:['Mix ethanol and acetic acid in a round-bottom flask.','Add a few drops of H₂SO₄ as catalyst.','Heat under reflux for 15 minutes.','Observe sweet fruity smell (ethyl acetate).','Separate ester layer on cooling.','Wash with NaHCO₃ solution to remove acid.','Collect and identify ethyl acetate by its fruity smell.'],observation:'Sweet fruity smell. Oily ethyl acetate ester layer separates on standing.'},
    'CaCO3+NH4OH': {title:'🧪 CaCO₃ + NH₄OH — No Reaction',formula:'CaCO₃ + NH₄OH → No reaction  (both alkaline, CaCO₃ insoluble in weak base)',sub:'No reaction | Both are basic | CaCO₃ insoluble | Alkaline mixture',badge:'NO REACTION',badgeColor:'#c0c0c0',effect:'dissolve',liquidColor:'#d0d8c8',bgColor:'#e8f0e0',overview:'CaCO₃ and NH₄OH do not react with each other.\nBoth are alkaline. CaCO₃ is insoluble in weak alkaline solution.',chemNames:'• Calcium Carbonate (CaCO₃)\n• Ammonium Hydroxide (NH₄OH)',tools:'• Beaker  • Stirrer  • Fume Hood',safety:'• Goggles  • Gloves  • Lab Coat  • Fume Hood',requiredSafety:['Goggles','Gloves','Lab Coat','Fume Hood'],steps:['Work near fume hood — NH₄OH releases ammonia.','Add NH₄OH solution to a beaker.','Add CaCO₃ powder and stir.','No vigorous reaction — mild ammonia odor.','CaCO₃ remains undissolved.','Measure pH — mildly alkaline.','Filter off undissolved CaCO₃.'],observation:'No reaction. CaCO₃ remains insoluble. Mildly alkaline mixture.'},
    'Mg+NH4OH': {title:'🧪 Mg + NH₄OH — Very Slow Reaction',formula:'Mg + 2NH₄OH → Mg(OH)₂↓ + 2NH₃↑ + H₂↑  (very slow, requires concentrated)',sub:'Very slow | Mg dissolves slowly in concentrated NH₄OH | H₂ and NH₃ evolved',badge:'SLOW REACTION',badgeColor:'#c8f0c0',effect:'bubbles',liquidColor:'#c0e0c0',bgColor:'#e0f0e0',overview:'Mg reacts very slowly with NH₄OH solution, releasing H₂ and ammonia.\nMg(OH)₂ white precipitate may form. Much slower than with mineral acids.',chemNames:'• Magnesium Ribbon (Mg)\n• Ammonium Hydroxide (NH₄OH)',tools:'• Test Tube  • Fume Hood  • Lighted Splint',safety:'• Goggles  • Gloves  • Lab Coat  • Fume Hood',requiredSafety:['Goggles','Gloves','Lab Coat','Fume Hood'],steps:['Work in fume hood — NH₄OH releases ammonia.','Place Mg ribbon in a test tube.','Add NH₄OH solution (concentrated if possible).','Observe: very slow bubbling — H₂ evolved very slowly.','Pungent ammonia odor present throughout.','White Mg(OH)₂ precipitate may form.','Compare rate with Mg + HCl — much slower.'],observation:'Very slow H₂ bubbling. Ammonia odor. Much slower than with mineral acids.'},
    'C2H5OH+NH4OH': {title:'🧪 Ethanol + NH₄OH — No Reaction',formula:'C₂H₅OH + NH₄OH → No significant reaction',sub:'No reaction | Both neutral/weakly alkaline | Miscible liquids | No chemical change',badge:'NO REACTION',badgeColor:'#c0c0c0',effect:'dissolve',liquidColor:'#d8e8c8',bgColor:'#eef4e8',overview:'Ethanol and NH₄OH do not react with each other.\nBoth are neutral to weakly alkaline. They mix freely as miscible liquids.',chemNames:'• Ethanol (C₂H₅OH)\n• Ammonium Hydroxide (NH₄OH)',tools:'• Test Tube  • Fume Hood',safety:'• Goggles  • Gloves  • Lab Coat  • Fume Hood',requiredSafety:['Goggles','Gloves','Lab Coat','Fume Hood'],steps:['Work near fume hood — NH₄OH releases ammonia.','Mix ethanol and NH₄OH in a test tube.','No visible reaction — solutions mix freely.','No gas, no precipitate, no color change.','Pungent ammonia odor present from NH₄OH.','Measure pH — mildly alkaline (due to NH₄OH).','No chemical reaction has occurred.'],observation:'No reaction. Miscible mixture. Mild ammonia odor from NH₄OH.'},
    'CaCO3+Mg': {title:'🧪 CaCO₃ + Mg — No Reaction at Room Temperature',formula:'CaCO₃ + Mg → No reaction at room temperature  (requires very high temperature)',sub:'No reaction at room temp | At very high temp Mg can reduce CaCO₃ | Solid-solid',badge:'NO REACTION',badgeColor:'#c0c0c0',effect:'dissolve',liquidColor:'#d0d0c0',bgColor:'#e8e8d8',overview:'CaCO₃ and Mg do not react at room temperature.\nAt very high temperatures, Mg can reduce CaCO₃, but this is not a standard lab reaction.',chemNames:'• Calcium Carbonate (CaCO₃)\n• Magnesium Ribbon (Mg)',tools:'• Beaker  • Stirrer',safety:'• Goggles  • Gloves  • Lab Coat',requiredSafety:['Goggles','Gloves','Lab Coat'],steps:['Place Mg ribbon and CaCO₃ powder together.','Add water to create a slurry.','Observe: no visible reaction.','No gas, no color change, no heat produced.','Both remain unchanged at room temperature.','Very high temperature (thermite conditions) needed for reaction.','Record: no observable change.'],observation:'No reaction at room temperature. Both remain unchanged.'},
    'C2H5OH+Mg': {title:'⚗ Ethanol + Mg — Slow Reaction (Sodium Ethoxide Analogy)',formula:'2C₂H₅OH + Mg → Mg(OC₂H₅)₂ + H₂↑  (very slow at room temperature)',sub:'Very slow | Mg reacts with alcohol to form magnesium ethoxide | H₂ evolved slowly',badge:'SLOW REACTION',badgeColor:'#c8f0c0',effect:'bubbles',liquidColor:'#d0c890',bgColor:'#e8e0b0',overview:'Mg reacts very slowly with ethanol to form magnesium ethoxide and H₂.\nMuch slower than Mg with water. Requires fresh Mg surface (remove oxide layer).',chemNames:'• Ethanol (C₂H₅OH)\n• Magnesium Ribbon (Mg)',tools:'• Test Tube  • Lighted Splint  • Fume Hood',safety:'• Goggles  • Gloves  • Lab Coat  • Fume Hood',requiredSafety:['Goggles','Gloves','Lab Coat','Fume Hood'],steps:['Work in fume hood — ethanol is flammable.','Clean Mg ribbon surface with sandpaper to remove oxide layer.','Place Mg in a test tube.','Add dry absolute ethanol.','Observe: very slow bubbling — H₂ evolved very slowly.','Warm gently to accelerate reaction.','Magnesium ethoxide (white solid) may form on evaporation.'],observation:'Very slow H₂ evolution. Magnesium ethoxide forms on complete reaction.'},
    'C2H5OH+CaCO3': {title:'🧪 CaCO₃ + Ethanol — No Reaction',formula:'CaCO₃ + C₂H₅OH → No reaction',sub:'No reaction | CaCO₃ insoluble in ethanol | No acid-base or redox reaction',badge:'NO REACTION',badgeColor:'#c0c0c0',effect:'dissolve',liquidColor:'#e0d8c0',bgColor:'#ece8d8',overview:'CaCO₃ does not react with ethanol.\nCaCO₃ is insoluble in organic solvents. No chemical reaction occurs.',chemNames:'• Calcium Carbonate (CaCO₃)\n• Ethanol (C₂H₅OH)',tools:'• Test Tube  • Stirrer',safety:'• Goggles  • Gloves  • Lab Coat',requiredSafety:['Goggles','Gloves','Lab Coat'],steps:['Add CaCO₃ powder to a test tube.','Add ethanol and stir.','Observe: CaCO₃ remains undissolved.','No gas, no color change, no heat.','CaCO₃ is insoluble in organic solvents.','Settle and observe: white powder at bottom.','No chemical reaction has occurred.'],observation:'No reaction. CaCO₃ remains insoluble in ethanol.'},
    /* ── Fallback ── */
    'DEFAULT': {title:'⚗ Unknown Combination',formula:'? + ? → Products (combination not in database)',sub:'Select a recognized chemical combination to see the reaction',badge:'UNKNOWN',badgeColor:'#c0c0c0',effect:'dissolve',liquidColor:'#b0b8c8',bgColor:'#d0d8e8',overview:'This chemical combination is not yet in the database.\nTry a different set of chemicals, or add this reaction to the dataset.',chemNames:'• (Selected chemicals)',tools:'• Beaker  • Stirrer',safety:'• Goggles  • Gloves',requiredSafety:['Goggles','Gloves'],steps:['This combination is not in the experiment database.','Consult a chemistry reference for this reaction.','Ensure all safety equipment is worn regardless.','Proceed only under qualified supervision.','To add this reaction: see the _meta.howToAddReaction field.'],observation:'Unknown reaction outcome for this combination.'},
  },

  presets: {
    acid_base:     { label:'Acid-Base',  reactionKey:'HCl+NaOH',        badge:'NEUTRALIZATION', badgeColor:'#a0f0c0' },
    precipitation: { label:'Precipitate',reactionKey:'CuSO4+NaOH',      badge:'PRECIPITATION',  badgeColor:'#88ccff' },
    co2_fizz:      { label:'CO₂ Fizz',   reactionKey:'HCl+NaHCO3',      badge:'CO₂ FIZZ',       badgeColor:'#c0f8c0' },
    metal_acid:    { label:'Metal+Acid', reactionKey:'Mg+HCl',           badge:'H₂ GAS',         badgeColor:'#80f0f0' },
    esterification:{ label:'Ester',      reactionKey:'C2H5OH+CH3COOH',  badge:'ESTERIFICATION', badgeColor:'#f0d0a0' },
  }
};

/* ══════════════════════════════════════════════════
   STATE
══════════════════════════════════════════════════ */
let selectedChemicals = [];   // { id, name, color }
let selectedTools     = [];   // { name, icon, isSafety }
let pouredChemicals   = [];   // chemicals added to vessel — SINGLE SOURCE OF TRUTH for reaction lookup
let vesselType        = null;
let temperature       = 25;
let isReacting        = false;
let isPouring         = false;
let speechRecog       = null;

/* ══════════════════════════════════════════════════
   BUG FIX 1: REACTION LOOKUP uses pouredChemicals
   When called from startReaction → uses all poured IDs
   When called from refreshBoard  → uses all selected IDs (preview only)
══════════════════════════════════════════════════ */
function lookupReaction(ids) {
  if (!ids || ids.length === 0) return DB.reactions['DEFAULT'];
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
  //    If multiple chemicals are selected/poured and no combo found → DEFAULT
  //    This prevents the board from showing a single-chem reaction when
  //    the user has added two chemicals that have no reaction in the database.
  if (sorted.length === 1) {
    sorted.forEach(id => keys.push(id));
  }

  for (const k of keys) if (DB.reactions[k]) return DB.reactions[k];
  return DB.reactions['DEFAULT'];
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
  const container = document.getElementById('selected-chemical-display');
  const empty     = document.getElementById('scd-empty');
  container.querySelectorAll('.scd-chip').forEach(c => c.remove());

  if (selectedChemicals.length === 0) {
    if (empty) empty.style.display = '';
  } else {
    if (empty) empty.style.display = 'none';
    selectedChemicals.forEach(chem => {
      const cData = DB.chemicals[chem.id];
      const chip  = document.createElement('div');
      chip.className  = 'scd-chip';
      chip.id         = 'chip-' + chem.id;
      chip.dataset.id = chem.id;
      chip.title      = 'Click to deselect ' + chem.name;
      chip.innerHTML  = `
        <div class="scd-mini-bottle">
          <div class="scd-mini-cap"  style="background:${cData.capColor}"></div>
          <div class="scd-mini-neck"></div>
          <div class="scd-mini-body">
            <div class="scd-mini-liquid" style="background:linear-gradient(180deg,${chem.color}88,${chem.color});height:70%"></div>
            <div class="scd-mini-sheen"></div>
          </div>
        </div>
        <div class="scd-chip-label">${chem.id}</div>`;
      chip.onclick = () => {
        const el = document.querySelector('.bottle[data-id="' + chem.id + '"]');
        if (el) selectChemical(el);
      };
      container.appendChild(chip);
    });
  }
  document.getElementById('pour-chemical').disabled = selectedChemicals.length === 0 || isPouring;
}

/* ══════════════════════════════════════════════════
   CHEMICAL SELECTION
══════════════════════════════════════════════════ */
function selectChemical(el) {
  const id    = el.dataset.id;
  const name  = el.dataset.name;
  const color = el.dataset.color;
  el.classList.toggle('selected');
  if (el.classList.contains('selected')) {
    if (!selectedChemicals.find(c => c.id === id)) {
      selectedChemicals.push({ id, name, color });
      showToast('➕ ' + name + ' selected');
    }
  } else {
    selectedChemicals = selectedChemicals.filter(c => c.id !== id);
  }
  /*
   * BOARD UPDATE RULE:
   *   - If nothing has been poured yet  → show preview of selected chemicals
   *   - If chemicals are already poured → board must stay locked to the
   *     POURED combination, not flip back to a single selected chemical
   */
  if (pouredChemicals.length === 0) {
    refreshBoardFromIds(selectedChemicals.map(c => c.id));
  }
  updateSelectedDisplay();
  updateStatusBar();
}

function refreshBoardFromIds(ids) {
  if (ids.length === 0) return;
  const rxn = lookupReaction(ids);
  updateWorkbenchBoard(rxn);
  updateBlackboard(rxn);
  renderSafetyPanel(rxn.requiredSafety);
}

function updateWorkbenchBoard(rxn) {
  const badge = document.getElementById('eq-type-badge');
  badge.textContent       = rxn.badge;
  badge.style.color       = rxn.badgeColor;
  badge.style.borderColor = rxn.badgeColor;
  badge.style.background  = rxn.badgeColor + '22';
  document.getElementById('eq-main').textContent = rxn.formula;
  document.getElementById('eq-sub').textContent  = rxn.sub;
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
  return `<svg id="vessel-svg" viewBox="0 0 100 100" width="90" height="90" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bkLiq" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${col};stop-opacity:0.88"/>
        <stop offset="100%" style="stop-color:${col};stop-opacity:0.62"/>
      </linearGradient>
      <linearGradient id="bkGlass" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:rgba(255,255,255,0.38)"/>
        <stop offset="50%" style="stop-color:rgba(255,255,255,0.04)"/>
        <stop offset="100%" style="stop-color:rgba(255,255,255,0.18)"/>
      </linearGradient>
    </defs>
    <path d="M22 ${90-fh} L22 82 L8 92 L92 92 L78 82 L78 ${90-fh} Z" fill="url(#bkLiq)"/>
    <path d="M22 10 L22 82 L8 92 L92 92 L78 82 L78 10 Z" fill="rgba(200,240,255,0.10)" stroke="rgba(100,180,220,0.7)" stroke-width="2"/>
    <path d="M22 10 L22 82 L8 92 L92 92 L78 82 L78 10 Z" fill="url(#bkGlass)"/>
    <rect x="16" y="6" width="68" height="9" rx="3" fill="rgba(180,220,240,0.32)" stroke="rgba(100,180,220,0.7)" stroke-width="1.5"/>
    <line x1="74" y1="28" x2="78" y2="28" stroke="rgba(100,180,220,0.55)" stroke-width="1"/>
    <line x1="74" y1="44" x2="78" y2="44" stroke="rgba(100,180,220,0.55)" stroke-width="1"/>
    <line x1="74" y1="60" x2="78" y2="60" stroke="rgba(100,180,220,0.55)" stroke-width="1"/>
    <line x1="74" y1="76" x2="78" y2="76" stroke="rgba(100,180,220,0.55)" stroke-width="1"/>
  </svg>`;
}

function buildTestTubeSVG(layers) {
  const col = layers && layers.length ? layers[layers.length-1].color : 'rgba(200,240,255,0.1)';
  const fh  = layers ? Math.min(layers.length * 14, 54) : 0;
  return `<svg id="vessel-svg" viewBox="0 0 60 110" width="55" height="100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="ttLiq" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${col};stop-opacity:0.88"/>
        <stop offset="100%" style="stop-color:${col};stop-opacity:0.62"/>
      </linearGradient>
      <linearGradient id="ttGlass" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:rgba(255,255,255,0.38)"/>
        <stop offset="50%" style="stop-color:rgba(255,255,255,0.04)"/>
      </linearGradient>
    </defs>
    <path d="M14 ${100-fh} L14 94 Q30 106 46 94 L46 ${100-fh} Z" fill="url(#ttLiq)"/>
    <path d="M14 6 L14 94 Q30 108 46 94 L46 6 Z" fill="rgba(200,240,255,0.10)" stroke="rgba(100,180,220,0.7)" stroke-width="2"/>
    <path d="M14 6 L14 94 Q30 108 46 94 L46 6 Z" fill="url(#ttGlass)"/>
    <rect x="10" y="3" width="40" height="8" rx="2" fill="rgba(180,220,240,0.32)" stroke="rgba(100,180,220,0.7)" stroke-width="1.5"/>
    <line x1="43" y1="30" x2="46" y2="30" stroke="rgba(100,180,220,0.55)" stroke-width="0.8"/>
    <line x1="43" y1="50" x2="46" y2="50" stroke="rgba(100,180,220,0.55)" stroke-width="0.8"/>
    <line x1="43" y1="70" x2="46" y2="70" stroke="rgba(100,180,220,0.55)" stroke-width="0.8"/>
  </svg>`;
}

function buildFlaskSVG(layers) {
  const col = layers && layers.length ? layers[layers.length-1].color : 'rgba(200,240,255,0.1)';
  const fh  = layers ? Math.min(layers.length * 12, 44) : 0;
  return `<svg id="vessel-svg" viewBox="0 0 100 110" width="88" height="100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="flLiq" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${col};stop-opacity:0.88"/>
        <stop offset="100%" style="stop-color:${col};stop-opacity:0.62"/>
      </linearGradient>
      <linearGradient id="flGlass" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:rgba(255,255,255,0.35)"/>
        <stop offset="50%" style="stop-color:rgba(255,255,255,0.04)"/>
      </linearGradient>
    </defs>
    <path d="M18 ${100-fh} Q12 ${100-fh+6} 10 96 Q50 108 90 96 Q88 ${100-fh+6} 82 ${100-fh} Z" fill="url(#flLiq)"/>
    <path d="M38 10 L38 42 L10 96 Q50 110 90 96 L62 42 L62 10 Z" fill="rgba(200,240,255,0.10)" stroke="rgba(100,180,220,0.7)" stroke-width="2"/>
    <path d="M38 10 L38 42 L10 96 Q50 110 90 96 L62 42 L62 10 Z" fill="url(#flGlass)"/>
    <rect x="32" y="6" width="36" height="8" rx="2" fill="rgba(180,220,240,0.32)" stroke="rgba(100,180,220,0.7)" stroke-width="1.5"/>
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

  isPouring = true;
  document.getElementById('pour-chemical').disabled  = true;
  document.getElementById('start-reaction').disabled = true;

  let idx = 0;
  function pourNext() {
    if (idx >= selectedChemicals.length) {
      /* All selected chemicals have been poured — commit to state */
      selectedChemicals.forEach(chem => {
        if (!pouredChemicals.find(p => p.id === chem.id))
          pouredChemicals.push({ ...chem });
      });

      updateBeakerContents();
      /* BUG FIX 1: board/blackboard uses POURED chemicals */
      refreshBoardFromIds(pouredChemicals.map(c => c.id));
      renderVessel(vesselType, pouredChemicals);

      isPouring = false;
      document.getElementById('pour-chemical').disabled  = false;
      document.getElementById('start-reaction').disabled = false;
      showToast('💧 Poured: ' + selectedChemicals.map(c => c.id).join(' + '));
      setStatus('💧 Vessel contains: ' + pouredChemicals.map(c => c.id).join(' + ') + ' — click ▶ React!');
      updateStatusBar();
      return;
    }
    animateSinglePour(selectedChemicals[idx++], pourNext);
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
  vesselType = null; isReacting = false; isPouring = false;

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

  loadPreset('acid_base', document.querySelector('.exp-btn.active'));
  updateSelectedDisplay();
  updateStatusBar();
  showToast('Table cleared!');
  setStatus('🧹 Table cleared — select chemicals to begin.');
}

/* ══════════════════════════════════════════════════
   START REACTION
   BUG FIX 1: Uses pouredChemicals for lookup, NOT selectedChemicals
══════════════════════════════════════════════════ */
function startReaction() {
  if (isReacting) return;

  /* CRITICAL FIX: reaction is determined by what's IN the vessel */
  const pourIds = pouredChemicals.map(c => c.id);
  if (pourIds.length < 1) { showToast('⚠️ Pour at least one chemical first!'); return; }

  const rxn     = lookupReaction(pourIds);   /* ← uses poured, not selected */
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
  setStatus('⚗️ Reaction in progress — ' + rxn.title);
  showToast('🔬 Reaction started!');
  rz.style.background  = rxn.bgColor + 'bb';
  rz.style.borderColor = rxn.bgColor;

  /* Render reaction beaker in zone */
  rz.innerHTML =
    '<div style="position:relative;width:92px;margin:0 auto">' +
      buildReactionBeakerSVG(rxn.liquidColor, rxn.bgColor) +
      '<div id="bubble-container" style="position:absolute;bottom:16px;left:8px;right:8px;height:52px;overflow:hidden;pointer-events:none"></div>' +
    '</div>' +
    '<div style="font-family:\'Caveat\',cursive;color:#5a3a1a;font-size:.85rem;text-align:center;margin-top:3px">' + rxn.formula + '</div>' +
    '<div id="obs-text" style="font-family:\'Caveat\',cursive;color:#3a5a2a;font-size:.7rem;text-align:center;opacity:0;transition:opacity 1s;margin-top:2px">' + rxn.observation + '</div>';

  /* Update vessel to reaction color */
  renderVessel(vesselType || 'Beaker', [{ color: rxn.liquidColor }]);

  /* Particle effects */
  const eff = rxn.effect;
  if (eff === 'bubbles' || eff === 'dissolve') spawnBubbles();
  if (eff === 'smoke')                          spawnSmoke(rz);
  if (eff === 'precipitate')                    spawnPrecipitate(rz);
  if (eff === 'fizz')                           spawnFizz(rz);
  if (eff === 'flame')                          spawnFlame(rz);

  const dur = Math.max(1500, 4500 - (temperature - 25) * 40);
  setTimeout(() => { const ot = document.getElementById('obs-text'); if (ot) ot.style.opacity = '1'; }, dur * 0.5);
  setTimeout(() => {
    isReacting = false;
    setStatus('✅ Done — ' + rxn.title + ': ' + rxn.observation);
    showToast('✅ Reaction complete!');
    showReactionResult(rxn);
    /* Update blackboard with FINAL reaction */
    updateBlackboard(rxn);
  }, dur);
}

function buildReactionBeakerSVG(liq, glow) {
  return `<svg viewBox="0 0 92 82" width="92" height="82" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="rlq" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${liq};stop-opacity:0.9"/>
        <stop offset="100%" style="stop-color:${liq};stop-opacity:0.6"/>
      </linearGradient>
      <linearGradient id="rgl" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:rgba(255,255,255,0.4)"/>
        <stop offset="50%" style="stop-color:rgba(255,255,255,0.05)"/>
        <stop offset="100%" style="stop-color:rgba(255,255,255,0.2)"/>
      </linearGradient>
    </defs>
    <ellipse cx="46" cy="76" rx="28" ry="6" fill="${glow}" opacity="0.3"/>
    <path d="M22 8 L22 50 L8 72 L84 72 L70 50 L70 8 Z" fill="rgba(200,240,255,0.13)" stroke="rgba(100,180,220,0.75)" stroke-width="2"/>
    <path d="M23 40 L23 50 L10 70 L82 70 L69 50 L69 40 Z" fill="url(#rlq)" opacity="0.88"/>
    <path d="M22 8 L22 50 L8 72 L84 72 L70 50 L70 8 Z" fill="url(#rgl)"/>
    <rect x="16" y="5" width="60" height="8" rx="3" fill="rgba(180,220,240,0.35)" stroke="rgba(100,180,220,0.7)" stroke-width="1.5"/>
  </svg>`;
}

function showReactionResult(rxn) {
  const rr = document.getElementById('reaction-result');
  if (!rr) return;
  const badge = document.getElementById('rr-badge');
  badge.textContent        = rxn.badge;
  badge.style.background   = rxn.badgeColor + '33';
  badge.style.border       = '1.5px solid ' + rxn.badgeColor;
  badge.style.color        = '#3a1a00';
  document.getElementById('rr-formula').textContent = rxn.formula;
  document.getElementById('rr-obs').textContent     = '👁 ' + rxn.observation;
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
  buildShelf();
  document.getElementById('tools-drawer').classList.add('open');
  updateTemp(25);
  loadPreset('acid_base', document.querySelector('.exp-btn.active'));
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