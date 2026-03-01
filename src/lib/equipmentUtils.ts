// Equipment utilities and calculations

import type { Weapon, Armor } from "./equipment";
import type { Ability } from "./types";
import { abilityMod } from "./dnd5e";

export function calculateWeaponAttackBonus(weapon: Weapon, abilityScore: number, proficiencyBonus: number): number {
  const abilityModValue = abilityMod(abilityScore);
  return abilityModValue + proficiencyBonus + weapon.magicalBonus;
}

export function calculateWeaponDamage(weapon: Weapon, abilityScore: number): string {
  const abilityModValue = abilityMod(abilityScore);
  return `${weapon.damage}${abilityModValue > 0 ? `+${abilityModValue}` : abilityModValue < 0 ? `${abilityModValue}` : ''}`;
}

export function calculateArmorClass(armor: Armor | null, shield: Armor | null, dexScore: number): number {
  let ac = 10 + abilityMod(dexScore); // Base AC without armor
  
  if (armor) {
    const dexMod = abilityMod(dexScore);
    
    if (armor.dexBonus) {
      const maxDex = armor.maxDexBonus ?? Infinity;
      const effectiveDex = Math.min(dexMod, maxDex);
      ac = armor.baseAC + effectiveDex;
    } else {
      ac = armor.baseAC;
    }
    
    ac += armor.magicalBonus;
  }
  
  if (shield) {
    ac += shield.baseAC + shield.magicalBonus;
  }
  
  return ac;
}

export function getWeaponAbility(weapon: Weapon): Ability {
  // Most ranged weapons use Dexterity
  if (weapon.type === "simpleRanged" || weapon.type === "martialRanged") {
    return "dex";
  }
  
  // Finesse weapons can use either Strength or Dexterity
  if (weapon.properties.includes("fina")) {
    return "dex"; // Default to Dexterity for finesse weapons
  }
  
  // Most melee weapons use Strength
  return "str";
}

export function createCustomWeapon(data: Partial<Weapon>): Weapon {
  return {
    id: crypto.randomUUID(),
    name: data.name || "Custom Weapon",
    type: data.type || "simpleMelee",
    damage: data.damage || "1d6",
    damageType: data.damageType || "slashing",
    ability: data.ability || "str",
    properties: data.properties || [],
    magicalBonus: data.magicalBonus || 0,
    description: data.description,
    custom: true
  };
}

export function createCustomArmor(data: Partial<Armor>): Armor {
  return {
    id: crypto.randomUUID(),
    name: data.name || "Custom Armor",
    type: data.type || "light",
    baseAC: data.baseAC || 10,
    dexBonus: data.dexBonus ?? true,
    maxDexBonus: data.maxDexBonus,
    strengthRequirement: data.strengthRequirement,
    stealthDisadvantage: data.stealthDisadvantage ?? false,
    magicalBonus: data.magicalBonus || 0,
    description: data.description,
    custom: true
  };
}

export function createCustomEquipment(data: {
  name: string;
  type: string;
  description: string;
  weight: number;
  value: string;
  magical?: boolean;
}): any {
  return {
    id: crypto.randomUUID(),
    name: data.name,
    type: data.type,
    description: data.description,
    weight: data.weight,
    value: data.value,
    magical: data.magical || false,
    custom: true
  };
}
