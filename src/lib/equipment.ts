// Equipment and weapon types for D&D 5e

import type { Ability } from "@/lib/types";

export type WeaponType = 
  | "simpleMelee"
  | "simpleRanged"
  | "martialMelee"
  | "martialRanged";

export type ArmorType = 
  | "light"
  | "medium"
  | "heavy"
  | "shield";

export type EquipmentType = 
  | "weapon"
  | "armor"
  | "shield"
  | "tool"
  | "consumable"
  | "misc";

export type Weapon = {
  id: string;
  name: string;
  type: WeaponType;
  damage: string;
  damageType: string;
  ability: Ability;
  properties: string[];
  magicalBonus: number;
  description?: string;
  custom?: boolean;
};

export type Armor = {
  id: string;
  name: string;
  type: ArmorType;
  baseAC: number;
  dexBonus: boolean;
  maxDexBonus?: number;
  strengthRequirement?: number;
  stealthDisadvantage: boolean;
  magicalBonus: number;
  description?: string;
  custom?: boolean;
};

export type Equipment = {
  id: string;
  name: string;
  type: EquipmentType;
  description: string;
  weight: number;
  value: string;
  magical: boolean;
  custom?: boolean;
};

export type CharacterEquipment = {
  weapons: Weapon[];
  armor: Armor | null;
  shield: Armor | null;
  equipment: Equipment[];
};
