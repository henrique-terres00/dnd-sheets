export type Spell = {
  id: string;
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  components: string;
  duration: string;
  description: string;
  prepared: boolean;
  classes?: string[];
};

export type SpellSlot = {
  level: number;
  total: number;
  used: number;
};

export type CharacterSpellsState = {
  spells: Spell[];
  spellSlots: SpellSlot[];
  cantrips: Spell[];
};

export type SpellSchool = 
  | "abjuration"
  | "conjuration" 
  | "divination"
  | "enchantment"
  | "evocation"
  | "illusion"
  | "necromancy"
  | "transmutation";
