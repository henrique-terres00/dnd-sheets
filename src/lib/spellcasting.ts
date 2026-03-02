import { rollDice, rollDamage } from "./dice";
import type { Spell } from "./spells";

export interface SpellCastResult {
  spell: Spell;
  success: boolean;
  damage?: number;
  damageRolls?: number[];
  healing?: number;
  healingRolls?: number[];
  saveDC?: number;
  saveResult?: 'success' | 'failure';
  attackRoll?: number;
  attackResult?: 'hit' | 'miss';
  description: string;
  targets: string[];
}

export interface SpellTarget {
  id: string;
  name: string;
  ac?: number;
  saveBonus?: number;
  type: 'enemy' | 'ally' | 'self';
}

export function castSpell(
  spell: Spell,
  caster: {
    spellcastingAbility: string;
    spellcastingModifier: number;
    proficiencyBonus: number;
    level: number;
  },
  targets: SpellTarget[] = [],
  options: {
    spellSlotLevel?: number;
    upcastLevels?: number;
    metamagic?: string[];
  } = {}
): SpellCastResult {
  const result: SpellCastResult = {
    spell,
    success: true,
    description: '',
    targets: targets.map(t => t.name)
  };

  // Calculate save DC if needed
  const saveDC = 8 + caster.spellcastingModifier + caster.proficiencyBonus;
  result.saveDC = saveDC;

  // Handle different spell types
  switch (spell.id) {
    case 'fireBolt':
      return handleFireBolt(spell, caster, targets[0], result);
    
    case 'magicMissile':
      return handleMagicMissile(spell, caster, targets, result);
    
    case 'fireball':
      return handleFireball(spell, caster, targets, result, options);
    
    case 'burningHands':
      return handleBurningHands(spell, caster, targets, result);
    
    case 'scorchingRay':
      return handleScorchingRay(spell, caster, targets, result);
    
    case 'lightningBolt':
      return handleLightningBolt(spell, caster, targets, result);
    
    case 'coneOfCold':
      return handleConeOfCold(spell, caster, targets, result);
    
    case 'shield':
      return handleShield(spell, caster, result);
    
    case 'fly':
    case 'invisibility':
    case 'mistyStep':
    case 'teleport':
      return handleUtilitySpell(spell, result);
    
    default:
      return handleGenericSpell(spell, result);
  }
}

function handleFireBolt(spell: Spell, caster: any, target: SpellTarget | undefined, result: SpellCastResult): SpellCastResult {
  if (!target) {
    result.description = `${spell.name} lançado sem alvo válido.`;
    return result;
  }

  const attackRoll = rollDice('1d20', caster.spellcastingModifier);
  result.attackRoll = attackRoll.total;
  
  if (target.ac && attackRoll.total >= target.ac) {
    result.attackResult = 'hit';
    const damage = rollDamage('1d10', 1); // Add minimum of 1
    result.damage = damage.total || 1; // Ensure at least 1 damage
    result.damageRolls = damage.rolls;
    result.description = `Raio de Fogo atinge ${target.name}! Ataque: ${attackRoll.total} vs CA ${target.ac}. Dano: ${result.damage} de fogo.`;
  } else {
    result.attackResult = 'miss';
    result.description = `Raio de Fogo erra ${target.name}! Ataque: ${attackRoll.total} vs CA ${target.ac}.`;
  }
  
  return result;
}

function handleMagicMissile(spell: Spell, caster: any, targets: SpellTarget[], result: SpellCastResult): SpellCastResult {
  const missiles = 3 + (caster.level >= 4 ? 1 : 0) + (caster.level >= 7 ? 1 : 0) + (caster.level >= 10 ? 1 : 0);
  const targetMissiles = targets.length > 0 ? Math.ceil(missiles / targets.length) : missiles;
  
  let totalDamage = 0;
  const allRolls: number[] = [];
  
  targets.forEach((target, index) => {
    const missilesForTarget = index === targets.length - 1 ? missiles - (targetMissiles * (targets.length - 1)) : targetMissiles;
    for (let i = 0; i < missilesForTarget; i++) {
      const damage = rollDamage('1d4', 1); // Add minimum of 1
      totalDamage += damage.total || 1; // Ensure at least 1 damage
      allRolls.push(...damage.rolls);
    }
  });
  
  result.damage = totalDamage;
  result.damageRolls = allRolls;
  result.description = `Míssil Mágico cria ${missiles} mísseis! Dano total: ${totalDamage} de força. ${targets.map(t => t.name).join(', ')}`;
  
  return result;
}

function handleFireball(spell: Spell, caster: any, targets: SpellTarget[], result: SpellCastResult, options: any): SpellCastResult {
  const spellLevel = options.spellSlotLevel || spell.level;
  const damageDice = 8 + (spellLevel - 3); // 8d6 base, +1d6 per level upcast
  
  const damage = rollDamage(`${damageDice}d6`, 0);
  result.damage = damage.total;
  result.damageRolls = damage.rolls;
  
  const saves: { [key: string]: 'success' | 'failure' } = {};
  let failedSaves = 0;
  
  targets.forEach(target => {
    const saveRoll = rollDice('1d20', target.saveBonus || 0);
    saves[target.name] = saveRoll.total >= result.saveDC! ? 'success' : 'failure';
    if (saves[target.name] === 'failure') failedSaves++;
  });
  
  result.description = `Bola de Fogo explode! CD ${result.saveDC}. ${failedSaves}/${targets.length} alvos falham na salvaguarda. Dano: ${damage.total} de fogo (${Object.entries(saves).map(([name, save]) => `${name}: ${save === 'failure' ? 'dano completo' : 'metade do dano'}`).join(', ')}).`;
  
  return result;
}

function handleBurningHands(spell: Spell, caster: any, targets: SpellTarget[], result: SpellCastResult): SpellCastResult {
  const damage = rollDamage('3d6', 0);
  result.damage = damage.total;
  result.damageRolls = damage.rolls;
  
  const saves: { [key: string]: 'success' | 'failure' } = {};
  let failedSaves = 0;
  
  targets.forEach(target => {
    const saveRoll = rollDice('1d20', target.saveBonus || 0);
    saves[target.name] = saveRoll.total >= result.saveDC! ? 'success' : 'failure';
    if (saves[target.name] === 'failure') failedSaves++;
  });
  
  result.description = `Mãos Ardentes! CD ${result.saveDC}. ${failedSaves}/${targets.length} alvos falham na salvaguarda. Dano: ${damage.total} de fogo.`;
  
  return result;
}

function handleScorchingRay(spell: Spell, caster: any, targets: SpellTarget[], result: SpellCastResult): SpellCastResult {
  const rays = 3 + (caster.level >= 5 ? 1 : 0) + (caster.level >= 11 ? 1 : 0) + (caster.level >= 17 ? 1 : 0);
  const targetRays = targets.length > 0 ? Math.ceil(rays / targets.length) : rays;
  
  let totalDamage = 0;
  const allRolls: number[] = [];
  const attacks: { [key: string]: { hits: number; misses: number } } = {};
  
  targets.forEach((target, index) => {
    const raysForTarget = index === targets.length - 1 ? rays - (targetRays * (targets.length - 1)) : targetRays;
    attacks[target.name] = { hits: 0, misses: 0 };
    
    for (let i = 0; i < raysForTarget; i++) {
      const attackRoll = rollDice('1d20', caster.spellcastingModifier);
      if (target.ac && attackRoll.total >= target.ac) {
        const damage = rollDamage('6d6', 0);
        totalDamage += damage.total;
        allRolls.push(...damage.rolls);
        attacks[target.name].hits++;
      } else {
        attacks[target.name].misses++;
      }
    }
  });
  
  result.damage = totalDamage;
  result.damageRolls = allRolls;
  result.description = `Raio Abrasador cria ${rays} raios! Dano total: ${totalDamage} de fogo. ${Object.entries(attacks).map(([name, result]) => `${name}: ${result.hits} acertos, ${result.misses} erros`).join(', ')}`;
  
  return result;
}

function handleLightningBolt(spell: Spell, caster: any, targets: SpellTarget[], result: SpellCastResult): SpellCastResult {
  const damage = rollDamage('8d6', 0);
  result.damage = damage.total;
  result.damageRolls = damage.rolls;
  
  const saves: { [key: string]: 'success' | 'failure' } = {};
  let failedSaves = 0;
  
  targets.forEach(target => {
    const saveRoll = rollDice('1d20', target.saveBonus || 0);
    saves[target.name] = saveRoll.total >= result.saveDC! ? 'success' : 'failure';
    if (saves[target.name] === 'failure') failedSaves++;
  });
  
  result.description = `Relâmpago! CD ${result.saveDC}. ${failedSaves}/${targets.length} alvos falham na salvaguarda. Dano: ${damage.total} de relâmpago.`;
  
  return result;
}

function handleConeOfCold(spell: Spell, caster: any, targets: SpellTarget[], result: SpellCastResult): SpellCastResult {
  const damage = rollDamage('12d8', 0);
  result.damage = damage.total;
  result.damageRolls = damage.rolls;
  
  const saves: { [key: string]: 'success' | 'failure' } = {};
  let failedSaves = 0;
  
  targets.forEach(target => {
    const saveRoll = rollDice('1d20', target.saveBonus || 0);
    saves[target.name] = saveRoll.total >= result.saveDC! ? 'success' : 'failure';
    if (saves[target.name] === 'failure') failedSaves++;
  });
  
  result.description = `Cone de Gelo! CD ${result.saveDC}. ${failedSaves}/${targets.length} alvos falham na salvaguarda. Dano: ${damage.total} de gelo.`;
  
  return result;
}

function handleShield(spell: Spell, caster: any, result: SpellCastResult): SpellCastResult {
  result.description = `Escudo conjurado! +5 na CA e imunidade a mísseis mágicos por 1 minuto.`;
  return result;
}

function handleUtilitySpell(spell: Spell, result: SpellCastResult): SpellCastResult {
  result.description = `${spell.name} conjurado! ${spell.description}`;
  return result;
}

function handleGenericSpell(spell: Spell, result: SpellCastResult): SpellCastResult {
  result.description = `${spell.name} conjurado! ${spell.description}`;
  return result;
}

export function calculateSpellcastingAbility(character: any): { ability: string; modifier: number } {
  // Determine spellcasting ability based on class
  const classSpellcasting: { [key: string]: string } = {
    'wizard': 'int',
    'sorcerer': 'cha',
    'warlock': 'cha',
    'bard': 'cha',
    'cleric': 'wis',
    'druid': 'wis',
    'paladin': 'cha',
    'ranger': 'wis',
    'artificer': 'int'
  };
  
  const ability = classSpellcasting[character.classKey || ''] || 'int';
  const modifier = Math.floor((character.abilities[ability] - 10) / 2);
  
  return { ability, modifier };
}

export function calculateSpellSlots(level: number, classKey: string): { level: number; total: number; used: number }[] {
  // Simplified spell slot calculation
  const slots: { level: number; total: number; used: number }[] = [];
  
  if (level >= 1) {
    slots.push({ level: 1, total: 2 + Math.floor(level / 2), used: 0 });
  }
  if (level >= 3) {
    slots.push({ level: 2, total: 2, used: 0 });
  }
  if (level >= 5) {
    slots.push({ level: 3, total: 2, used: 0 });
  }
  if (level >= 7) {
    slots.push({ level: 4, total: 1, used: 0 });
  }
  if (level >= 9) {
    slots.push({ level: 5, total: 1, used: 0 });
  }
  
  return slots;
}
