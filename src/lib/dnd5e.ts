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
