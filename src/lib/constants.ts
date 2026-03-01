// Magic numbers and constants used throughout the application

export const ROLL_LOG_LIMIT = 100;
export const VISUAL_FEEDBACK_DURATION = 2000;
export const DEFAULT_GRID_SIZE = 50;
export const MAX_ABILITY_CHOICES = 2;

export const STORAGE_KEYS = {
  ROLL_LOG: 'dnd-sheets.roll-log.v1',
  MAP_STATE: 'dnd-sheets.map-state.v1',
  ENEMIES: 'dnd-sheets.enemies.v1'
} as const;

export const WEAPON_TYPES = {
  SIMPLE_MELEE: 'simpleMelee',
  SIMPLE_RANGED: 'simpleRanged',
  MARTIAL_MELEE: 'martialMelee',
  MARTIAL_RANGED: 'martialRanged'
} as const;

export const ARMOR_TYPES = {
  LIGHT: 'light',
  MEDIUM: 'medium',
  HEAVY: 'heavy',
  SHIELD: 'shield'
} as const;

export const EQUIPMENT_TYPES = {
  WEAPON: 'weapon',
  ARMOR: 'armor',
  SHIELD: 'shield',
  TOOL: 'tool',
  CONSUMABLE: 'consumable',
  MISC: 'misc'
} as const;

export const ABILITIES = {
  STRENGTH: 'str',
  DEXTERITY: 'dex',
  CONSTITUTION: 'con',
  INTELLIGENCE: 'int',
  WISDOM: 'wis',
  CHARISMA: 'cha'
} as const;

export const ADVANTAGE_TYPES = {
  NONE: 'none',
  ADVANTAGE: 'advantage',
  DISADVANTAGE: 'disadvantage'
} as const;
