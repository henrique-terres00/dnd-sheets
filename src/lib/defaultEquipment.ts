// Default equipment data for D&D 5e

import type { Weapon, Armor, Equipment } from "./equipment";

export const DEFAULT_WEAPONS: Weapon[] = [
  // Simple Melee Weapons
  {
    id: "club",
    name: "Clava",
    type: "simpleMelee",
    damage: "1d4",
    damageType: "concussão",
    ability: "str",
    properties: ["leve"],
    magicalBonus: 0
  },
  {
    id: "dagger",
    name: "Adaga",
    type: "simpleMelee",
    damage: "1d4",
    damageType: "perfuração",
    ability: "dex",
    properties: ["leve", "arremesso (20/60 pés)"],
    magicalBonus: 0
  },
  {
    id: "greatclub",
    name: "Maça Grande",
    type: "simpleMelee",
    damage: "1d8",
    damageType: "concussão",
    ability: "str",
    properties: ["duas mãos"],
    magicalBonus: 0
  },
  {
    id: "handaxe",
    name: "Machado de Mão",
    type: "simpleMelee",
    damage: "1d6",
    damageType: "corte",
    ability: "str",
    properties: ["leve", "arremesso (20/60 pés)"],
    magicalBonus: 0
  },
  {
    id: "javelin",
    name: "Dardo",
    type: "simpleMelee",
    damage: "1d6",
    damageType: "perfuração",
    ability: "str",
    properties: ["arremesso (30/120 pés)"],
    magicalBonus: 0
  },
  {
    id: "lightHammer",
    name: "Martelo Leve",
    type: "simpleMelee",
    damage: "1d4",
    damageType: "concussão",
    ability: "str",
    properties: ["leve", "arremesso (20/60 pés)"],
    magicalBonus: 0
  },
  {
    id: "mace",
    name: "Maça",
    type: "simpleMelee",
    damage: "1d6",
    damageType: "concussão",
    ability: "str",
    properties: [],
    magicalBonus: 0
  },
  {
    id: "quarterstaff",
    name: "Cajado",
    type: "simpleMelee",
    damage: "1d4",
    damageType: "concussão",
    ability: "str",
    properties: ["versátil (1d8)"],
    magicalBonus: 0
  },
  {
    id: "sickle",
    name: "Foice",
    type: "simpleMelee",
    damage: "1d4",
    damageType: "corte",
    ability: "str",
    properties: ["leve"],
    magicalBonus: 0
  },
  {
    id: "spear",
    name: "Lança",
    type: "simpleMelee",
    damage: "1d6",
    damageType: "perfuração",
    ability: "str",
    properties: ["arremesso (20/60 pés)", "versátil (1d8)"],
    magicalBonus: 0
  },

  // Simple Ranged Weapons
  {
    id: "lightCrossbow",
    name: "Besta Leve",
    type: "simpleRanged",
    damage: "1d8",
    damageType: "perfuração",
    ability: "dex",
    properties: ["duas mãos", "munição", "recarga"],
    magicalBonus: 0
  },
  {
    id: "dart",
    name: "Dardo de Arremesso",
    type: "simpleRanged",
    damage: "1d4",
    damageType: "perfuração",
    ability: "dex",
    properties: ["arremesso (20/60 pés)"],
    magicalBonus: 0
  },
  {
    id: "shortbow",
    name: "Arco Curto",
    type: "simpleRanged",
    damage: "1d6",
    damageType: "perfuração",
    ability: "dex",
    properties: ["duas mãos", "munição"],
    magicalBonus: 0
  },
  {
    id: "sling",
    name: "Funda",
    type: "simpleRanged",
    damage: "1d4",
    damageType: "concussão",
    ability: "str",
    properties: ["duas mãos", "munição"],
    magicalBonus: 0
  },

  // Martial Melee Weapons
  {
    id: "battleaxe",
    name: "Machado de Batalha",
    type: "martialMelee",
    damage: "1d8",
    damageType: "corte",
    ability: "str",
    properties: ["versátil (1d10)"],
    magicalBonus: 0
  },
  {
    id: "flail",
    name: "Mangual",
    type: "martialMelee",
    damage: "1d8",
    damageType: "concussão",
    ability: "str",
    properties: [],
    magicalBonus: 0
  },
  {
    id: "glaive",
    name: "Alabarda",
    type: "martialMelee",
    damage: "1d10",
    damageType: "corte",
    ability: "str",
    properties: ["pesada", "alcance (10 pés)", "duas mãos"],
    magicalBonus: 0
  },
  {
    id: "greataxe",
    name: "Machado Grande",
    type: "martialMelee",
    damage: "1d12",
    damageType: "corte",
    ability: "str",
    properties: ["pesada", "duas mãos"],
    magicalBonus: 0
  },
  {
    id: "greatsword",
    name: "Espada Grande",
    type: "martialMelee",
    damage: "2d6",
    damageType: "corte",
    ability: "str",
    properties: ["pesada", "duas mãos"],
    magicalBonus: 0
  },
  {
    id: "halberd",
    name: "Alabarda",
    type: "martialMelee",
    damage: "1d10",
    damageType: "corte",
    ability: "str",
    properties: ["pesada", "alcance (10 pés)", "duas mãos"],
    magicalBonus: 0
  },
  {
    id: "lance",
    name: "Lança Montada",
    type: "martialMelee",
    damage: "1d12",
    damageType: "perfuração",
    ability: "str",
    properties: ["alcance (10 pés)", "duas mãos"],
    magicalBonus: 0
  },
  {
    id: "longsword",
    name: "Espada Longa",
    type: "martialMelee",
    damage: "1d8",
    damageType: "corte",
    ability: "str",
    properties: ["versátil (1d10)"],
    magicalBonus: 0
  },
  {
    id: "maul",
    name: "Marreta",
    type: "martialMelee",
    damage: "2d6",
    damageType: "concussão",
    ability: "str",
    properties: ["pesada", "duas mãos"],
    magicalBonus: 0
  },
  {
    id: "morningstar",
    name: "Estrela da Manhã",
    type: "martialMelee",
    damage: "1d8",
    damageType: "perfuração",
    ability: "str",
    properties: [],
    magicalBonus: 0
  },
  {
    id: "pike",
    name: "Pique",
    type: "martialMelee",
    damage: "1d10",
    damageType: "perfuração",
    ability: "str",
    properties: ["pesada", "alcance (10 pés)", "duas mãos"],
    magicalBonus: 0
  },
  {
    id: "rapier",
    name: "Espada Raposa",
    type: "martialMelee",
    damage: "1d8",
    damageType: "perfuração",
    ability: "dex",
    properties: ["fina"],
    magicalBonus: 0
  },
  {
    id: "scimitar",
    name: "Cimitarra",
    type: "martialMelee",
    damage: "1d6",
    damageType: "corte",
    ability: "str",
    properties: ["fina"],
    magicalBonus: 0
  },
  {
    id: "shortsword",
    name: "Espada Curta",
    type: "martialMelee",
    damage: "1d6",
    damageType: "perfuração",
    ability: "str",
    properties: ["leve", "fina"],
    magicalBonus: 0
  },
  {
    id: "trident",
    name: "Tridente",
    type: "martialMelee",
    damage: "1d6",
    damageType: "perfuração",
    ability: "str",
    properties: ["arremesso (20/60 pés)", "versátil (1d8)"],
    magicalBonus: 0
  },
  {
    id: "warPick",
    name: "Picareta de Guerra",
    type: "martialMelee",
    damage: "1d8",
    damageType: "perfuração",
    ability: "str",
    properties: [],
    magicalBonus: 0
  },
  {
    id: "warhammer",
    name: "Martelo de Guerra",
    type: "martialMelee",
    damage: "1d8",
    damageType: "concussão",
    ability: "str",
    properties: ["versátil (1d10)"],
    magicalBonus: 0
  },
  {
    id: "whip",
    name: "Chicote",
    type: "martialMelee",
    damage: "1d4",
    damageType: "corte",
    ability: "str",
    properties: ["fina", "alcance (15 pés)"],
    magicalBonus: 0
  },

  // Martial Ranged Weapons
  {
    id: "blowgun",
    name: "Zarabatana",
    type: "martialRanged",
    damage: "1d1",
    damageType: "perfuração",
    ability: "dex",
    properties: ["munição", "recarga"],
    magicalBonus: 0
  },
  {
    id: "crossbowHand",
    name: "Besta de Mão",
    type: "martialRanged",
    damage: "1d6",
    damageType: "perfuração",
    ability: "dex",
    properties: ["leve", "munição", "recarga"],
    magicalBonus: 0
  },
  {
    id: "crossbowHeavy",
    name: "Besta Pesada",
    type: "martialRanged",
    damage: "1d10",
    damageType: "perfuração",
    ability: "dex",
    properties: ["pesada", "duas mãos", "munição", "recarga"],
    magicalBonus: 0
  },
  {
    id: "longbow",
    name: "Arco Longo",
    type: "martialRanged",
    damage: "1d8",
    damageType: "perfuração",
    ability: "dex",
    properties: ["pesada", "duas mãos", "munição"],
    magicalBonus: 0
  },
  {
    id: "net",
    name: "Rede",
    type: "martialRanged",
    damage: "0",
    damageType: "nenhum",
    ability: "str",
    properties: ["especial", "arremesso (5/15 pés)"],
    magicalBonus: 0
  }
];

export const DEFAULT_ARMOR: Armor[] = [
  // Light Armor
  {
    id: "padded",
    name: "Armadura Acolchoada",
    type: "light",
    baseAC: 11,
    dexBonus: true,
    stealthDisadvantage: true,
    magicalBonus: 0
  },
  {
    id: "leather",
    name: "Armadura de Couro",
    type: "light",
    baseAC: 11,
    dexBonus: true,
    stealthDisadvantage: false,
    magicalBonus: 0
  },
  {
    id: "studdedLeather",
    name: "Armadura de Couro Rebitado",
    type: "light",
    baseAC: 12,
    dexBonus: true,
    stealthDisadvantage: false,
    magicalBonus: 0
  },

  // Medium Armor
  {
    id: "hide",
    name: "Armadura de Couro Bruto",
    type: "medium",
    baseAC: 12,
    dexBonus: true,
    maxDexBonus: 2,
    stealthDisadvantage: true,
    magicalBonus: 0
  },
  {
    id: "chainShirt",
    name: "Cota de Malha Leve",
    type: "medium",
    baseAC: 13,
    dexBonus: true,
    maxDexBonus: 2,
    stealthDisadvantage: false,
    magicalBonus: 0
  },
  {
    id: "scaleMail",
    name: "Armadura de Escamas",
    type: "medium",
    baseAC: 14,
    dexBonus: true,
    maxDexBonus: 2,
    stealthDisadvantage: true,
    magicalBonus: 0
  },
  {
    id: "breastplate",
    name: "Peitoral",
    type: "medium",
    baseAC: 14,
    dexBonus: true,
    maxDexBonus: 2,
    stealthDisadvantage: false,
    magicalBonus: 0
  },
  {
    id: "halfPlate",
    name: "Meia Placa",
    type: "medium",
    baseAC: 15,
    dexBonus: true,
    maxDexBonus: 2,
    stealthDisadvantage: true,
    magicalBonus: 0
  },

  // Heavy Armor
  {
    id: "ringMail",
    name: "Armadura de Anéis",
    type: "heavy",
    baseAC: 14,
    dexBonus: false,
    stealthDisadvantage: true,
    magicalBonus: 0
  },
  {
    id: "chainMail",
    name: "Cota de Malha",
    type: "heavy",
    baseAC: 16,
    dexBonus: false,
    strengthRequirement: 13,
    stealthDisadvantage: true,
    magicalBonus: 0
  },
  {
    id: "splint",
    name: "Armadura de Tiras",
    type: "heavy",
    baseAC: 17,
    dexBonus: false,
    strengthRequirement: 15,
    stealthDisadvantage: true,
    magicalBonus: 0
  },
  {
    id: "plate",
    name: "Armadura de Placas",
    type: "heavy",
    baseAC: 18,
    dexBonus: false,
    strengthRequirement: 15,
    stealthDisadvantage: true,
    magicalBonus: 0
  },

  // Shield
  {
    id: "shield",
    name: "Escudo",
    type: "shield",
    baseAC: 2,
    dexBonus: false,
    stealthDisadvantage: false,
    magicalBonus: 0
  }
];

export const DEFAULT_EQUIPMENT: Equipment[] = [
  {
    id: "backpack",
    name: "Mochila",
    type: "misc",
    description: "Uma mochila para carregar itens",
    weight: 5,
    value: "2 po",
    magical: false
  },
  {
    id: "bedroll",
    name: "Cobertor",
    type: "misc",
    description: "Um cobertor para dormir",
    weight: 7,
    value: "1 po",
    magical: false
  },
  {
    id: "rations",
    name: "Rações (1 dia)",
    type: "consumable",
    description: "Comida para um dia",
    weight: 2,
    value: "5 pc",
    magical: false
  },
  {
    id: "waterskin",
    name: "Saco de Água",
    type: "misc",
    description: "Contém água potável",
    weight: 5,
    value: "2 pc",
    magical: false
  },
  {
    id: "torch",
    name: "Tocha",
    type: "consumable",
    description: "Queima por 1 hora",
    weight: 1,
    value: "1 pc",
    magical: false
  },
  {
    id: "rope",
    name: "Corda (50 pés)",
    type: "misc",
    description: "Corda de cânhamo",
    weight: 10,
    value: "1 po",
    magical: false
  }
];
