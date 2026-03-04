import type { Ability, Skill } from "@/lib/types";

export function abilityMod(score: number) {
  const s = Number(score) || 0;
  return Math.floor((s - 10) / 2);
}

export function formatSigned(n: number) {
  return n >= 0 ? `+${n}` : `${n}`;
}

export function proficiencyBonusFromLevel(level: number) {
  const l = Math.max(1, Math.min(20, Math.floor(Number(level) || 1)));
  if (l <= 4) return 2;
  if (l <= 8) return 3;
  if (l <= 12) return 4;
  if (l <= 16) return 5;
  return 6;
}

export const SKILL_TO_ABILITY: Record<Skill, Ability> = {
  athletics: "str",
  acrobatics: "dex",
  sleightOfHand: "dex",
  stealth: "dex",
  arcana: "int",
  history: "int",
  investigation: "int",
  nature: "int",
  religion: "int",
  animalHandling: "wis",
  insight: "wis",
  medicine: "wis",
  perception: "wis",
  survival: "wis",
  deception: "cha",
  intimidation: "cha",
  performance: "cha",
  persuasion: "cha",
};

// Perícias disponíveis por classe (segundo regras do D&D 5e)
export const CLASS_SKILLS: Record<string, Skill[]> = {
  // Bárbaro
  barbarian: ["animalHandling", "athletics", "intimidation", "nature", "perception", "survival"],
  
  // Bardo
  bard: ["acrobatics", "animalHandling", "arcana", "athletics", "deception", "history", "insight", "intimidation", "investigation", "medicine", "nature", "perception", "performance", "persuasion", "religion", "sleightOfHand", "stealth", "survival"],
  
  // Clérigo
  cleric: ["history", "insight", "medicine", "persuasion", "religion"],
  
  // Druida
  druid: ["arcana", "animalHandling", "insight", "medicine", "nature", "perception", "religion", "survival"],
  
  // Guerreiro
  fighter: ["acrobatics", "animalHandling", "athletics", "history", "insight", "intimidation", "perception", "survival"],
  
  // Monge
  monk: ["acrobatics", "athletics", "history", "insight", "religion", "stealth"],
  
  // Paladino
  paladin: ["athletics", "insight", "intimidation", "medicine", "persuasion", "religion"],
  
  // Patrulheiro
  ranger: ["animalHandling", "athletics", "insight", "investigation", "nature", "perception", "stealth", "survival"],
  
  // Ladino
  rogue: ["acrobatics", "athletics", "deception", "insight", "intimidation", "investigation", "perception", "performance", "persuasion", "sleightOfHand", "stealth"],
  
  // Feiticeiro
  sorcerer: ["arcana", "deception", "insight", "intimidation", "persuasion", "religion"],
  
  // Bruxo
  warlock: ["arcana", "deception", "history", "intimidation", "investigation", "nature", "religion"],
  
  // Mago
  wizard: ["arcana", "history", "insight", "investigation", "medicine", "religion"],
  
  // Artifice (Eberron) - caso tenha
  artificer: ["arcana", "history", "investigation", "medicine", "nature", "sleightOfHand"],
  
  // Sangue (Blood Hunter) - caso tenha
  bloodhunter: ["acrobatics", "arcana", "athletics", "insight", "investigation", "religion", "survival"],
};

// Número de perícias que cada classe pode escolher
export const CLASS_SKILL_COUNT: Record<string, number> = {
  barbarian: 2,
  bard: 3,
  cleric: 2,
  druid: 2,
  fighter: 2,
  monk: 2,
  paladin: 2,
  ranger: 3,
  rogue: 4,
  sorcerer: 2,
  warlock: 2,
  wizard: 2,
  artificer: 2,
  bloodhunter: 3,
};

// Função para verificar se uma perícia está disponível para a classe
export function isSkillAvailableForClass(skill: Skill, classKey?: string): boolean {
  if (!classKey) return true; // Se não tem classe definida, permite todas
  const availableSkills = CLASS_SKILLS[classKey];
  return availableSkills ? availableSkills.includes(skill) : true;
}

// Função para contar quantas perícias o personagem já escolheu
export function getSelectedSkillCount(character: { skillProficiencies: Record<Skill, boolean>, classKey?: string }): number {
  if (!character.classKey) return 0;
  
  const availableSkills = CLASS_SKILLS[character.classKey] || [];
  return availableSkills.filter(skill => character.skillProficiencies[skill]).length;
}

// Função para verificar se pode escolher mais perícias
export function canChooseMoreSkills(character: { skillProficiencies: Record<Skill, boolean>, classKey?: string }): boolean {
  if (!character.classKey) return true;
  
  const maxSkills = CLASS_SKILL_COUNT[character.classKey] || 0;
  const selectedCount = getSelectedSkillCount(character);
  
  return selectedCount < maxSkills;
}
