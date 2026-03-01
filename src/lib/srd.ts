import type { Ability } from "@/lib/types";

export type SrdRaceKey =
  | "dragonborn"
  | "dwarf"
  | "elf"
  | "gnome"
  | "halfElf"
  | "halfOrc"
  | "halfling"
  | "human"
  | "tiefling";

export type SrdClassKey =
  | "barbarian"
  | "bard"
  | "cleric"
  | "druid"
  | "fighter"
  | "monk"
  | "paladin"
  | "ranger"
  | "rogue"
  | "sorcerer"
  | "warlock"
  | "wizard";

export type SrdRace = {
  key: SrdRaceKey;
  label: string;
  speed: number;
  baseBonuses: Partial<Record<Ability, number>>;
  choice?: {
    picks: number;
    bonus: number;
    allowed: Ability[];
  };
};

export type SrdClass = {
  key: SrdClassKey;
  label: string;
  savingThrowProficiencies: Ability[];
  skillChoices: {
    picks: number;
    options: Array<
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
      | "persuasion"
    >;
  };
};

export const SRD_RACES: SrdRace[] = [
  { key: "human", label: "Humano", speed: 30, baseBonuses: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 } },
  { key: "elf", label: "Elfo", speed: 30, baseBonuses: { dex: 2 } },
  { key: "dwarf", label: "Anão", speed: 25, baseBonuses: { con: 2 } },
  { key: "halfling", label: "Halfling", speed: 25, baseBonuses: { dex: 2 } },
  { key: "dragonborn", label: "Dragonborn", speed: 30, baseBonuses: { str: 2, cha: 1 } },
  { key: "gnome", label: "Gnomo", speed: 25, baseBonuses: { int: 2 } },
  {
    key: "halfElf",
    label: "Meio-Elfo",
    speed: 30,
    baseBonuses: { cha: 2 },
    choice: { picks: 2, bonus: 1, allowed: ["str", "dex", "con", "int", "wis"] },
  },
  { key: "halfOrc", label: "Meio-Orc", speed: 30, baseBonuses: { str: 2, con: 1 } },
  { key: "tiefling", label: "Tiefling", speed: 30, baseBonuses: { cha: 2, int: 1 } },
];

export const SRD_CLASSES: SrdClass[] = [
  {
    key: "barbarian",
    label: "Bárbaro",
    savingThrowProficiencies: ["str", "con"],
    skillChoices: { picks: 2, options: ["animalHandling", "athletics", "intimidation", "nature", "perception", "survival"] },
  },
  {
    key: "bard",
    label: "Bardo",
    savingThrowProficiencies: ["dex", "cha"],
    skillChoices: {
      picks: 3,
      options: [
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
      ],
    },
  },
  {
    key: "cleric",
    label: "Clérigo",
    savingThrowProficiencies: ["wis", "cha"],
    skillChoices: { picks: 2, options: ["history", "insight", "medicine", "persuasion", "religion"] },
  },
  {
    key: "druid",
    label: "Druida",
    savingThrowProficiencies: ["int", "wis"],
    skillChoices: { picks: 2, options: ["arcana", "animalHandling", "insight", "medicine", "nature", "perception", "religion", "survival"] },
  },
  {
    key: "fighter",
    label: "Guerreiro",
    savingThrowProficiencies: ["str", "con"],
    skillChoices: { picks: 2, options: ["acrobatics", "animalHandling", "athletics", "history", "insight", "intimidation", "perception", "survival"] },
  },
  {
    key: "monk",
    label: "Monge",
    savingThrowProficiencies: ["str", "dex"],
    skillChoices: { picks: 2, options: ["acrobatics", "athletics", "history", "insight", "religion", "stealth"] },
  },
  {
    key: "paladin",
    label: "Paladino",
    savingThrowProficiencies: ["wis", "cha"],
    skillChoices: { picks: 2, options: ["athletics", "insight", "intimidation", "medicine", "persuasion", "religion"] },
  },
  {
    key: "ranger",
    label: "Patrulheiro",
    savingThrowProficiencies: ["str", "dex"],
    skillChoices: { picks: 3, options: ["animalHandling", "athletics", "insight", "investigation", "nature", "perception", "stealth", "survival"] },
  },
  {
    key: "rogue",
    label: "Ladino",
    savingThrowProficiencies: ["dex", "int"],
    skillChoices: {
      picks: 4,
      options: [
        "acrobatics",
        "athletics",
        "deception",
        "insight",
        "intimidation",
        "investigation",
        "perception",
        "performance",
        "persuasion",
        "sleightOfHand",
        "stealth",
      ],
    },
  },
  {
    key: "sorcerer",
    label: "Feiticeiro",
    savingThrowProficiencies: ["con", "cha"],
    skillChoices: { picks: 2, options: ["arcana", "deception", "insight", "intimidation", "persuasion", "religion"] },
  },
  {
    key: "warlock",
    label: "Bruxo",
    savingThrowProficiencies: ["wis", "cha"],
    skillChoices: { picks: 2, options: ["arcana", "deception", "history", "intimidation", "investigation", "nature", "religion"] },
  },
  {
    key: "wizard",
    label: "Mago",
    savingThrowProficiencies: ["int", "wis"],
    skillChoices: { picks: 2, options: ["arcana", "history", "insight", "investigation", "medicine", "religion"] },
  },
];

export function getSrdRace(key: string | undefined) {
  return SRD_RACES.find((r) => r.key === key) ?? null;
}

export function getSrdClass(key: string | undefined) {
  return SRD_CLASSES.find((c) => c.key === key) ?? null;
}
