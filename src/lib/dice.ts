// D&D 5e dice rolling system

export interface DiceRoll {
  id: string;
  playerId: string;
  playerName: string;
  characterName: string;
  type: 'attack' | 'skill' | 'saving-throw' | 'ability-check' | 'damage' | 'initiative' | 'spell';
  label: string;
  formula: string;
  result: number;
  details: string;
  timestamp: Date;
  critical?: 'success' | 'failure';
}

export interface RollResult {
  total: number;
  rolls: number[];
  modifier: number;
  formula: string;
  details: string;
  critical?: 'success' | 'failure';
}

// Main dice rolling function
export function rollDice(formula: string, modifier: number = 0): RollResult {
  const diceRegex = /(\d+)d(\d+)/g;
  const rolls: number[] = [];
  let formulaDisplay = formula;
  let total = modifier;
  let details = '';

  // Reset regex state
  diceRegex.lastIndex = 0;

  // Process each dice in the formula
  let match;
  while ((match = diceRegex.exec(formula)) !== null) {
    const [countStr, sidesStr] = match;
    const count = parseInt(countStr);
    const sides = parseInt(sidesStr);
    
    const diceRolls: number[] = [];
    for (let i = 0; i < count; i++) {
      const roll = Math.floor(Math.random() * sides) + 1;
      diceRolls.push(roll);
      total += roll;
    }
    
    rolls.push(...diceRolls);
    
    // Add roll details
    if (details) details += ' + ';
    details += `${count}d${sides}[${diceRolls.join(', ')}]`;
  }

  // Add modifier details
  if (modifier !== 0) {
    details += ` + ${modifier}`;
    formulaDisplay += modifier > 0 ? `+${modifier}` : `${modifier}`;
  } else {
    formulaDisplay = formula;
  }

  return {
    total,
    rolls,
    modifier,
    formula: formulaDisplay,
    details: details || '0'
  };
}

// Alternative function that doesn't use regex to avoid state issues
export function rollDiceSimple(formula: string, modifier: number = 0): RollResult {
  // Manual parsing of dice formula (e.g., "1d4", "2d6")
  const parts = formula.split('d');
  if (parts.length !== 2) {
    // If not a valid dice formula, return just the modifier
    return {
      total: modifier,
      rolls: [],
      modifier,
      formula: formula,
      details: modifier !== 0 ? `+ ${modifier}` : ''
    };
  }

  const count = parseInt(parts[0]) || 1;
  const sides = parseInt(parts[1]) || 6;
  
  const rolls: number[] = [];
  let total = modifier;
  
  for (let i = 0; i < count; i++) {
    const roll = Math.floor(Math.random() * sides) + 1;
    rolls.push(roll);
    total += roll;
  }

  const details = `${count}d${sides}[${rolls.join(', ')}]${modifier !== 0 ? ` + ${modifier}` : ''}`;
  const formulaDisplay = `${formula}${modifier > 0 ? `+${modifier}` : modifier < 0 ? `${modifier}` : ''}`;

  return {
    total,
    rolls,
    modifier,
    formula: formulaDisplay,
    details
  };
}

// d20 roll with advantage/disadvantage
export function rollD20(advantage: 'none' | 'advantage' | 'disadvantage' = 'none'): RollResult {
  if (advantage === 'none') {
    // Use direct roll instead of rollDice to avoid regex issues
    const roll = Math.floor(Math.random() * 20) + 1;
    return {
      total: roll,
      rolls: [roll],
      modifier: 0,
      formula: '1d20',
      details: `1d20[${roll}]`,
      critical: roll === 20 ? 'success' : roll === 1 ? 'failure' : undefined
    };
  }

  // Roll two separate d20s
  const roll1 = Math.floor(Math.random() * 20) + 1;
  const roll2 = Math.floor(Math.random() * 20) + 1;
  
  const chosenRoll = advantage === 'advantage' 
    ? Math.max(roll1, roll2)
    : Math.min(roll1, roll2);

  const critical = chosenRoll === 20 ? 'success' : chosenRoll === 1 ? 'failure' : undefined;

  return {
    total: chosenRoll,
    rolls: [chosenRoll],
    modifier: 0,
    formula: advantage === 'advantage' ? '1d20 (Vantagem)' : '1d20 (Desvantagem)',
    details: advantage === 'advantage' 
      ? `d20[${roll1}, ${roll2}] → ${chosenRoll}`
      : `d20[${roll1}, ${roll2}] → ${chosenRoll}`,
    critical
  };
}

// Attack roll
export function rollAttack(
  proficiencyBonus: number,
  abilityMod: number,
  magicBonus: number = 0,
  advantage: 'none' | 'advantage' | 'disadvantage' = 'none'
): RollResult {
  const d20Roll = rollD20(advantage);
  const totalModifier = proficiencyBonus + abilityMod + magicBonus;
  
  return {
    ...d20Roll,
    total: d20Roll.total + totalModifier,
    modifier: totalModifier,
    formula: d20Roll.formula + (totalModifier > 0 ? `+${totalModifier}` : `${totalModifier}`),
    details: d20Roll.details + (totalModifier !== 0 ? ` + ${totalModifier}` : '')
  };
}

// Skill check or ability test roll
export function rollSkillCheck(
  abilityMod: number,
  proficiencyBonus: number = 0,
  expertise: boolean = false,
  advantage: 'none' | 'advantage' | 'disadvantage' = 'none'
): RollResult {
  const d20Roll = rollD20(advantage);
  const totalProficiency = expertise ? proficiencyBonus * 2 : proficiencyBonus;
  const totalModifier = abilityMod + totalProficiency;
  
  return {
    ...d20Roll,
    total: d20Roll.total + totalModifier,
    modifier: totalModifier,
    formula: d20Roll.formula + (totalModifier > 0 ? `+${totalModifier}` : `${totalModifier}`),
    details: d20Roll.details + (totalModifier !== 0 ? ` + ${totalModifier}` : '')
  };
}

// Damage roll
export function rollDamage(dice: string, abilityMod: number = 0, critical: boolean = false): RollResult {
  const baseRoll = rollDiceSimple(dice, abilityMod);
  const criticalDice = critical ? rollDiceSimple(dice, 0) : { total: 0, rolls: [], modifier: 0, formula: '', details: '' };
  
  const total = baseRoll.total + criticalDice.total;
  const allRolls = [...baseRoll.rolls, ...criticalDice.rolls];
  
  let details = baseRoll.details;
  if (critical && criticalDice.rolls.length > 0) {
    details += ` + CRIT[${criticalDice.rolls.join(', ')}]`;
  }

  return {
    total,
    rolls: allRolls,
    modifier: baseRoll.modifier,
    formula: baseRoll.formula,
    details
  };
}

// Initiative roll
export function rollInitiative(abilityMod: number): RollResult {
  const d20Roll = rollD20();
  
  return {
    ...d20Roll,
    total: d20Roll.total + abilityMod,
    modifier: abilityMod,
    formula: d20Roll.formula + (abilityMod > 0 ? `+${abilityMod}` : `${abilityMod}`),
    details: d20Roll.details + (abilityMod !== 0 ? ` + ${abilityMod}` : '')
  };
}
