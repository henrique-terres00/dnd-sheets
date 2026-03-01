"use client";

import type { Ability, Character, SavingThrow, Skill } from "@/lib/types";

const STORAGE_KEY = "dnd-sheets.characters.v1";

type Stored = {
  characters: Character[];
};

const ABILITIES: Ability[] = ["str", "dex", "con", "int", "wis", "cha"];

const SKILLS: Skill[] = [
  "athletics",
  "acrobatics",
  "sleightOfHand",
  "stealth",
  "arcana",
  "history",
  "investigation",
  "nature",
  "religion",
  "animalHandling",
  "insight",
  "medicine",
  "perception",
  "survival",
  "deception",
  "intimidation",
  "performance",
  "persuasion",
];

function emptyRecord<T extends string>(keys: T[], value: boolean) {
  return keys.reduce((acc, k) => {
    acc[k] = value;
    return acc;
  }, {} as Record<T, boolean>);
}

export function createBlankCharacter(partial?: Partial<Character>): Character {
  const now = new Date().toISOString();

  const base: Character = {
    id: crypto.randomUUID(),
    updatedAt: now,

    name: "",
    className: "",
    classKey: undefined,
    level: 1,
    background: "",
    race: "",
    raceKey: undefined,
    raceAbilityChoices: undefined,
    raceAppliedBonuses: undefined,
    alignment: "",
    playerName: "",
    experiencePoints: 0,

    avatarDataUrl: null,

    inspiration: false,
    proficiencyBonusOverride: null,

    abilities: {
      str: 10,
      dex: 10,
      con: 10,
      int: 10,
      wis: 10,
      cha: 10,
    },

    savingThrowProficiencies: emptyRecord(ABILITIES as SavingThrow[], false),
    skillProficiencies: emptyRecord(SKILLS, false),

    armorClass: 10,
    initiativeOverride: null,
    speed: 30,

    maxHp: 0,
    currentHp: 0,
    tempHp: 0,

    hitDiceTotal: "",
    hitDiceRemaining: "",

    deathSaves: {
      successes: 0,
      failures: 0,
    },

    attacksAndSpells: "",
    equipment: "",

    personalityTraits: "",
    ideals: "",
    bonds: "",
    flaws: "",

    proficienciesAndLanguages: "",

    otherFeaturesAndTraits: "",

    appearance: "",
    backstory: "",
    alliesAndOrganizations: "",
    treasure: "",
  };

  return {
    ...base,
    ...partial,
    id: partial?.id ?? base.id,
    updatedAt: now,
  };
}

function safeParse(raw: string | null): Stored {
  if (!raw) return { characters: [] };
  try {
    const parsed = JSON.parse(raw) as Stored;
    if (!parsed || typeof parsed !== "object") return { characters: [] };
    if (!Array.isArray(parsed.characters)) return { characters: [] };
    return { characters: parsed.characters };
  } catch {
    return { characters: [] };
  }
}

export function listCharacters(): Character[] {
  const stored = safeParse(window.localStorage.getItem(STORAGE_KEY));
  return [...stored.characters].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export function getCharacter(id: string): Character | null {
  const stored = safeParse(window.localStorage.getItem(STORAGE_KEY));
  return stored.characters.find((c) => c.id === id) ?? null;
}

export function upsertCharacter(character: Character) {
  const stored = safeParse(window.localStorage.getItem(STORAGE_KEY));
  const next = stored.characters.filter((c) => c.id !== character.id);
  next.push({ ...character, updatedAt: new Date().toISOString() });
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ characters: next } satisfies Stored));
}

export function deleteCharacter(id: string) {
  const stored = safeParse(window.localStorage.getItem(STORAGE_KEY));
  const next = stored.characters.filter((c) => c.id !== id);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ characters: next } satisfies Stored));
}
