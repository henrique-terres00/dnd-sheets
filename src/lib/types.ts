export type Ability = "str" | "dex" | "con" | "int" | "wis" | "cha";

export type Skill =
  | "athletics"
  | "acrobatics"
  | "sleightOfHand"
  | "stealth"
  | "arcana"
  | "history"
  | "investigation"
  | "nature"
  | "religion"
  | "animalHandling"
  | "insight"
  | "medicine"
  | "perception"
  | "survival"
  | "deception"
  | "intimidation"
  | "performance"
  | "persuasion";

export type SavingThrow = Ability;

import type { CharacterEquipment } from "./equipment";
import type { CharacterSpellsState } from "./spells";

export type Character = {
  id: string;
  updatedAt: string;

  name: string;
  className: string;
  classKey?: string;
  level: number;
  background: string;
  race: string;
  raceKey?: string;
  raceAbilityChoices?: Partial<Record<Ability, boolean>>;
  raceAppliedBonuses?: Partial<Record<Ability, number>>;
  alignment: string;
  playerName: string;
  experiencePoints: number;

  avatarDataUrl: string | null;

  inspiration: boolean;
  proficiencyBonusOverride: number | null;

  abilities: Record<Ability, number>;

  savingThrowProficiencies: Record<SavingThrow, boolean>;
  skillProficiencies: Record<Skill, boolean>;

  armorClass: number;
  initiativeOverride: number | null;
  speed: number;

  maxHp: number;
  currentHp: number;
  tempHp: number;

  hitDiceTotal: string;
  hitDiceRemaining: string;

  deathSaves: {
    successes: number;
    failures: number;
  };

  attacksAndSpells: string;
  equipment: string;

  personalityTraits: string;
  ideals: string;
  bonds: string;
  flaws: string;

  proficienciesAndLanguages: string;

  otherFeaturesAndTraits: string;

  appearance: string;
  backstory: string;
  alliesAndOrganizations: string;
  treasure: string;

  // New equipment system
  characterEquipment?: CharacterEquipment;

  // New spells system
  characterSpells?: CharacterSpellsState;
};
