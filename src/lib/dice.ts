// Sistema de rolagem de dados D&D 5e

export interface DiceRoll {
  id: string;
  playerId: string;
  playerName: string;
  characterName: string;
  type: 'attack' | 'skill' | 'saving-throw' | 'ability-check' | 'damage' | 'initiative';
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

// Função principal de rolagem de dados
export function rollDice(formula: string, modifier: number = 0): RollResult {
  const diceRegex = /(\d+)d(\d+)/g;
  const rolls: number[] = [];
  let formulaDisplay = formula;
  let total = modifier;
  let details = '';

  // Processar cada dado na fórmula
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
    
    // Adicionar detalhes da rolagem
    if (details) details += ' + ';
    details += `${count}d${sides}[${diceRolls.join(', ')}]`;
  }

  // Adicionar modificador aos detalhes
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

// Rolagem de d20 com vantagem/desvantagem
export function rollD20(advantage: 'none' | 'advantage' | 'disadvantage' = 'none'): RollResult {
  if (advantage === 'none') {
    return rollDice('1d20');
  }

  const roll1 = rollDice('1d20');
  const roll2 = rollDice('1d20');
  
  const chosenRoll = advantage === 'advantage' 
    ? Math.max(roll1.rolls[0], roll2.rolls[0])
    : Math.min(roll1.rolls[0], roll2.rolls[0]);

  const critical = chosenRoll === 20 ? 'success' : chosenRoll === 1 ? 'failure' : undefined;

  return {
    total: chosenRoll,
    rolls: [chosenRoll],
    modifier: 0,
    formula: advantage === 'advantage' ? '1d20 (Vantagem)' : '1d20 (Desvantagem)',
    details: advantage === 'advantage' 
      ? `d20[${roll1.rolls[0]}, ${roll2.rolls[0]}] → ${chosenRoll}`
      : `d20[${roll1.rolls[0]}, ${roll2.rolls[0]}] → ${chosenRoll}`,
    critical
  };
}

// Rolagem de ataque
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

// Rolagem de perícia ou teste de habilidade
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

// Rolagem de dano
export function rollDamage(dice: string, abilityMod: number = 0, critical: boolean = false): RollResult {
  const baseRoll = rollDice(dice);
  const criticalDice = critical ? rollDice(dice) : { total: 0, rolls: [], modifier: 0, formula: '', details: '' };
  
  const total = baseRoll.total + abilityMod + criticalDice.total;
  const allRolls = [...baseRoll.rolls, ...criticalDice.rolls];
  
  let details = baseRoll.details;
  if (critical && criticalDice.rolls.length > 0) {
    details += ` + CRIT[${criticalDice.rolls.join(', ')}]`;
  }
  if (abilityMod !== 0) {
    details += ` + ${abilityMod}`;
  }

  return {
    total,
    rolls: allRolls,
    modifier: abilityMod,
    formula: (critical ? `2×${dice}` : dice) + (abilityMod > 0 ? `+${abilityMod}` : ''),
    details: details || '0'
  };
}

// Iniciativa
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
