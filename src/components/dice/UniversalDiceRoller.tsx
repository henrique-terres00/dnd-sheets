"use client";

import { useEffect, useState } from "react";
import { abilityMod } from "@/lib/dnd5e";
import { 
  rollAttack, 
  rollSkillCheck, 
  rollDamage, 
  rollInitiative,
  type RollResult 
} from "@/lib/dice";
import { addRollToLog } from "@/lib/rollLog";
import { addRollToSession } from "@/lib/supabase";
import { calculateArmorClass } from "@/lib/equipmentUtils";
import type { Character } from "@/lib/types";
import type { DiceRoll } from "@/lib/rollLog";

interface UniversalDiceRollerProps {
  isOpen: boolean;
  onClose: () => void;
  characters: Character[];
  isSession?: boolean; // Se true, salva na sessão; se false, salva local
}

export function UniversalDiceRoller({ isOpen, onClose, characters, isSession = false }: UniversalDiceRollerProps) {
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>("");
  const [selectedSkill, setSelectedSkill] = useState<string>("");
  const [selectedAbility, setSelectedAbility] = useState<string>("");
  const [selectedWeaponId, setSelectedWeaponId] = useState<string>("");
  const [attackAbility, setAttackAbility] = useState<string>("str");
  const [damageAbility, setDamageAbility] = useState<string>("str");
  const [damageDice, setDamageDice] = useState<string>("1d6");
  const [magicBonus, setMagicBonus] = useState<number>(0);
  const [advantage, setAdvantage] = useState<'none' | 'advantage' | 'disadvantage'>('none');
  const [lastRoll, setLastRoll] = useState<RollResult | null>(null);

  const selectedCharacter = characters.find(c => c.id === selectedCharacterId);

  const proficiencyBonus = selectedCharacter?.proficiencyBonusOverride ?? 
    Math.floor((selectedCharacter?.level || 1) / 4) + 2;

  // Auto-select first weapon when character changes
  useEffect(() => {
    if (selectedCharacter && selectedCharacter.characterEquipment?.weapons && selectedCharacter.characterEquipment.weapons.length > 0) {
      const firstWeapon = selectedCharacter.characterEquipment.weapons[0];
      setSelectedWeaponId(firstWeapon.id);
    } else {
      setSelectedWeaponId('');
    }
  }, [selectedCharacter]);

  // Abilities for checks
  const abilities = [
    { key: "str", label: "Força" },
    { key: "dex", label: "Destreza" },
    { key: "con", label: "Constituição" },
    { key: "int", label: "Inteligência" },
    { key: "wis", label: "Sabedoria" },
    { key: "cha", label: "Carisma" }
  ];

  // Skills for checks
  const skills = [
    { key: "athletics", label: "Atletismo", ability: "str" },
    { key: "acrobatics", label: "Acrobacia", ability: "dex" },
    { key: "sleightOfHand", label: "Prestidigitação", ability: "dex" },
    { key: "stealth", label: "Furtividade", ability: "dex" },
    { key: "arcana", label: "Arcanismo", ability: "int" },
    { key: "history", label: "História", ability: "int" },
    { key: "investigation", label: "Investigação", ability: "int" },
    { key: "nature", label: "Natureza", ability: "int" },
    { key: "religion", label: "Religião", ability: "int" },
    { key: "animalHandling", label: "Lidar com Animais", ability: "wis" },
    { key: "insight", label: "Intuição", ability: "wis" },
    { key: "medicine", label: "Medicina", ability: "wis" },
    { key: "perception", label: "Percepção", ability: "wis" },
    { key: "survival", label: "Sobrevivência", ability: "wis" },
    { key: "deception", label: "Enganação", ability: "cha" },
    { key: "intimidation", label: "Intimidação", ability: "cha" },
    { key: "performance", label: "Atuação", ability: "cha" },
    { key: "persuasion", label: "Persuasão", ability: "cha" }
  ];

  // Function to create and register a roll (session or local based on isSession)
  const createRoll = async (type: DiceRoll['type'], label: string, result: RollResult) => {
    if (!selectedCharacter) return;

    const roll: DiceRoll = {
      id: crypto.randomUUID(),
      playerId: selectedCharacter.id,
      playerName: selectedCharacter.name || "Personagem sem nome",
      characterName: selectedCharacter.name || "Personagem sem nome",
      type,
      label,
      formula: result.formula,
      result: result.total,
      details: result.details,
      timestamp: new Date(),
      critical: result.critical
    };

    // Save to appropriate location based on isSession
    if (isSession) {
      // Save to session (synchronized for all users)
      const currentSession = localStorage.getItem('currentSession');
      if (currentSession) {
        try {
          await addRollToSession(currentSession, roll);
        } catch (error) {
          console.error('Error adding roll to session:', error);
        }
      }
    } else {
      // Save to local log
      addRollToLog(roll);
    }

    setLastRoll(result);
  };

  // Skill roll
  const handleSkillRoll = async () => {
    if (!selectedCharacter || !selectedSkill) return;

    const skill = skills.find(s => s.key === selectedSkill);
    if (!skill) return;

    const abilityModValue = abilityMod(selectedCharacter.abilities[skill.ability as keyof typeof selectedCharacter.abilities]);
    const isProficient = selectedCharacter.skillProficiencies[selectedSkill as keyof typeof selectedCharacter.skillProficiencies];
    const isExpertise = false;

    const result = rollSkillCheck(abilityModValue, isProficient ? proficiencyBonus : 0, isExpertise, advantage);
    await createRoll('skill', skill.label, result);
  };

  // Ability check roll
  const handleAbilityRoll = async () => {
    if (!selectedCharacter || !selectedAbility) return;

    const abilityModValue = abilityMod(selectedCharacter.abilities[selectedAbility as keyof typeof selectedCharacter.abilities]);
    const result = rollSkillCheck(abilityModValue, 0, false, advantage);
    
    const ability = abilities.find(a => a.key === selectedAbility);
    if (ability) {
      await createRoll('ability-check', ability.label, result);
    }
  };

  // Attack roll
  const handleAttackRoll = async () => {
    if (!selectedCharacter) return;

    // Check if character has weapons equipped
    const equippedWeapons = selectedCharacter.characterEquipment?.weapons || [];
    
    if (equippedWeapons.length === 0) {
      // Fallback to manual selection if no weapons equipped
      const attackMod = abilityMod(selectedCharacter.abilities[attackAbility as keyof typeof selectedCharacter.abilities]);
      const result = rollAttack(proficiencyBonus, attackMod, magicBonus, advantage);
      const abilityLabel = abilities.find(a => a.key === attackAbility)?.label || attackAbility;
      await createRoll('attack', `Ataque (${abilityLabel})`, result);
      return;
    }

    // Use selected weapon or first weapon if none selected
    const weapon = selectedWeaponId 
      ? equippedWeapons.find((w: any) => w.id === selectedWeaponId) || equippedWeapons[0]
      : equippedWeapons[0];
    
    const weaponAbility = weapon.ability || 'str';
    const abilityScore = selectedCharacter.abilities[weaponAbility];
    const attackMod = abilityMod(abilityScore);
    
    const result = rollAttack(proficiencyBonus, attackMod, weapon.magicalBonus || 0, advantage);
    await createRoll('attack', `Ataque com ${weapon.name}`, result);
  };

  // Damage roll
  const handleDamageRoll = async (critical: boolean = false) => {
    if (!selectedCharacter) return;

    // Check if character has weapons equipped
    const equippedWeapons = selectedCharacter.characterEquipment?.weapons || [];
    
    if (equippedWeapons.length === 0) {
      // Fallback to manual selection if no weapons equipped
      const damageMod = abilityMod(selectedCharacter.abilities[damageAbility as keyof typeof selectedCharacter.abilities]);
      const result = rollDamage(damageDice, damageMod, critical);
      const abilityLabel = abilities.find(a => a.key === damageAbility)?.label || damageAbility;
      await createRoll('damage', `Dano (${abilityLabel})${critical ? ' (Crítico)' : ''}`, result);
      return;
    }

    // Use selected weapon or first weapon if none selected
    const weapon = selectedWeaponId 
      ? equippedWeapons.find((w: any) => w.id === selectedWeaponId) || equippedWeapons[0]
      : equippedWeapons[0];
    
    const weaponAbility = weapon.ability || 'str';
    const abilityScore = selectedCharacter.abilities[weaponAbility];
    const damageMod = abilityMod(abilityScore);
    
    const result = rollDamage(weapon.damage, damageMod, critical);
    await createRoll('damage', `Dano de ${weapon.name}${critical ? ' (Crítico)' : ''}`, result);
  };

  // Initiative roll
  const handleInitiativeRoll = async () => {
    if (!selectedCharacter) return;

    const dexMod = abilityMod(selectedCharacter.abilities.dex);
    const result = rollInitiative(dexMod);
    await createRoll('initiative', 'Iniciativa', result);
  };

  // Saving throw roll
  const handleSavingThrowRoll = async (ability: string) => {
    if (!selectedCharacter) return;

    const abilityModValue = abilityMod(selectedCharacter.abilities[ability as keyof typeof selectedCharacter.abilities]);
    const isProficient = selectedCharacter.savingThrowProficiencies[ability as keyof typeof selectedCharacter.savingThrowProficiencies];
    const result = rollSkillCheck(abilityModValue, isProficient ? proficiencyBonus : 0, false, advantage);
    
    const abilityLabel = abilities.find(a => a.key === ability)?.label || ability;
    await createRoll('saving-throw', `Salvaguarda de ${abilityLabel}`, result);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6 shadow-sm max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">🎲 Rolagem de Dados</h3>
          <button
            className="rounded-lg border border-[var(--app-border)] bg-red-500/20 px-3 py-1 text-sm text-[var(--app-fg)] hover:bg-red-500/30"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Seleção de Personagem */}
        <div className="mb-4">
          <label className="text-xs font-medium text-[var(--app-muted)]">Personagem</label>
          <select 
            className="w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-fg)] [color-scheme:dark]"
            value={selectedCharacterId}
            onChange={(e) => setSelectedCharacterId(e.target.value)}
          >
            <option value="">Selecionar personagem...</option>
            {characters.map(character => (
              <option key={character.id} value={character.id}>
                {character.name} (CA: {character ? calculateArmorClass(
                  character.characterEquipment?.armor || null,
                  character.characterEquipment?.shield || null,
                  character.abilities.dex
                ) : 10})
              </option>
            ))}
          </select>
        </div>

        {!selectedCharacter ? (
          <div className="text-center text-sm text-[var(--app-muted)] py-8">
            Selecione um personagem para começar a rolar dados
          </div>
        ) : (
          <>
            {/* Vantagem/Desvantagem */}
            <div className="mb-4">
              <label className="text-xs font-medium text-[var(--app-muted)]">Vantagem/Desvantagem</label>
              <select 
                className="w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-fg)] [color-scheme:dark]"
                value={advantage}
                onChange={(e) => setAdvantage(e.target.value as typeof advantage)}
              >
                <option value="none">Normal</option>
                <option value="advantage">Vantagem</option>
                <option value="disadvantage">Desvantagem</option>
              </select>
            </div>

            {/* Testes de Perícia */}
            <div className="mb-4">
              <label className="text-xs font-medium text-[var(--app-muted)]">Teste de Perícia</label>
              <div className="flex gap-2 mt-1">
                <select 
                  className="flex-1 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-fg)] [color-scheme:dark]"
                  value={selectedSkill}
                  onChange={(e) => setSelectedSkill(e.target.value)}
                >
                  <option value="">Selecionar perícia...</option>
                  {skills.map(skill => (
                    <option key={skill.key} value={skill.key}>
                      {skill.label} ({abilityMod(selectedCharacter.abilities[skill.ability as keyof typeof selectedCharacter.abilities]) >= 0 ? '+' : ''}{abilityMod(selectedCharacter.abilities[skill.ability as keyof typeof selectedCharacter.abilities])})
                      {selectedCharacter.skillProficiencies[skill.key as keyof typeof selectedCharacter.skillProficiencies] ? ' ✓' : ''}
                    </option>
                  ))}
                </select>
                <button
                  className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-2 text-sm font-medium text-[var(--app-fg)] hover:bg-[var(--app-border)]"
                  onClick={handleSkillRoll}
                >
                  Rolar
                </button>
              </div>
            </div>

            {/* Testes de Atributo */}
            <div className="mb-4">
              <label className="text-xs font-medium text-[var(--app-muted)]">Teste de Atributo</label>
              <div className="flex gap-2 mt-1">
                <select 
                  className="flex-1 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-fg)] [color-scheme:dark]"
                  value={selectedAbility}
                  onChange={(e) => setSelectedAbility(e.target.value)}
                >
                  <option value="">Selecionar atributo...</option>
                  {abilities.map(ability => (
                    <option key={ability.key} value={ability.key}>
                      {ability.label} ({abilityMod(selectedCharacter.abilities[ability.key as keyof typeof selectedCharacter.abilities]) >= 0 ? '+' : ''}{abilityMod(selectedCharacter.abilities[ability.key as keyof typeof selectedCharacter.abilities])})
                    </option>
                  ))}
                </select>
                <button
                  className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-2 text-sm font-medium text-[var(--app-fg)] hover:bg-[var(--app-border)]"
                  onClick={handleAbilityRoll}
                >
                  Rolar
                </button>
              </div>
            </div>

            {/* Salvaguardas */}
            <div className="mb-4">
              <label className="text-xs font-medium text-[var(--app-muted)]">Salvaguardas</label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {abilities.map(ability => (
                  <button
                    key={ability.key}
                    className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm font-medium text-[var(--app-fg)] hover:bg-[var(--app-border)]"
                    onClick={() => handleSavingThrowRoll(ability.key)}
                  >
                    {ability.label}
                    {selectedCharacter.savingThrowProficiencies[ability.key as keyof typeof selectedCharacter.savingThrowProficiencies] ? ' ✓' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Ataque */}
            <div className="mb-4">
              <label className="text-xs font-medium text-[var(--app-muted)]">Ataque</label>
              {selectedCharacter.characterEquipment?.weapons && selectedCharacter.characterEquipment.weapons.length > 0 ? (
                <div className="space-y-2 mt-1">
                  <select
                    className="w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-fg)] [color-scheme:dark]"
                    value={selectedWeaponId}
                    onChange={(e) => setSelectedWeaponId(e.target.value)}
                  >
                    {selectedCharacter.characterEquipment.weapons.map((weapon: any) => (
                      <option key={weapon.id} value={weapon.id}>
                        {weapon.name} (+{weapon.magicalBonus || 0} mágico)
                      </option>
                    ))}
                  </select>
                  <button
                    className="w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-2 text-sm font-medium text-[var(--app-fg)] hover:bg-[var(--app-border)]"
                    onClick={handleAttackRoll}
                  >
                    ⚔️ Rolar Ataque
                  </button>
                </div>
              ) : (
                <div className="space-y-2 mt-1">
                  <select
                    className="w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-fg)] [color-scheme:dark]"
                    value={attackAbility}
                    onChange={(e) => setAttackAbility(e.target.value)}
                  >
                    {abilities.map(ability => (
                      <option key={ability.key} value={ability.key}>
                        {ability.label} ({abilityMod(selectedCharacter.abilities[ability.key as keyof typeof selectedCharacter.abilities]) >= 0 ? '+' : ''}{abilityMod(selectedCharacter.abilities[ability.key as keyof typeof selectedCharacter.abilities])})
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      className="flex-1 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-fg)] [color-scheme:dark]"
                      placeholder="Bônus mágico"
                      value={magicBonus}
                      onChange={(e) => setMagicBonus(Number(e.target.value))}
                    />
                    <button
                      className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-2 text-sm font-medium text-[var(--app-fg)] hover:bg-[var(--app-border)]"
                      onClick={handleAttackRoll}
                    >
                      ⚔️ Rolar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Dano */}
            <div className="mb-4">
              <label className="text-xs font-medium text-[var(--app-muted)]">Dano</label>
              {selectedCharacter.characterEquipment?.weapons && selectedCharacter.characterEquipment.weapons.length > 0 ? (
                <div className="space-y-2 mt-1">
                  <select
                    className="w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-fg)] [color-scheme:dark]"
                    value={selectedWeaponId}
                    onChange={(e) => setSelectedWeaponId(e.target.value)}
                  >
                    {selectedCharacter.characterEquipment.weapons.map((weapon: any) => (
                      <option key={weapon.id} value={weapon.id}>
                        {weapon.name} - {weapon.damage}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button
                      className="flex-1 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-2 text-sm font-medium text-[var(--app-fg)] hover:bg-[var(--app-border)]"
                      onClick={() => handleDamageRoll(false)}
                    >
                      💥 Rolar Dano
                    </button>
                    <button
                      className="flex-1 rounded-xl border border-[var(--app-border)] bg-orange-500/20 px-4 py-2 text-sm font-medium text-orange-400 hover:bg-orange-500/30"
                      onClick={() => handleDamageRoll(true)}
                    >
                      💥 Crítico
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 mt-1">
                  <select
                    className="w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-fg)] [color-scheme:dark]"
                    value={damageDice}
                    onChange={(e) => setDamageDice(e.target.value)}
                  >
                    <option value="1d4">1d4</option>
                    <option value="1d6">1d6</option>
                    <option value="1d8">1d8</option>
                    <option value="2d6">2d6</option>
                    <option value="1d10">1d10</option>
                    <option value="2d8">2d8</option>
                    <option value="1d12">1d12</option>
                    <option value="2d10">2d10</option>
                    <option value="1d20">1d20</option>
                  </select>
                  <select
                    className="w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-fg)] [color-scheme:dark]"
                    value={damageAbility}
                    onChange={(e) => setDamageAbility(e.target.value)}
                  >
                    {abilities.map(ability => (
                      <option key={ability.key} value={ability.key}>
                        {ability.label} ({abilityMod(selectedCharacter.abilities[ability.key as keyof typeof selectedCharacter.abilities]) >= 0 ? '+' : ''}{abilityMod(selectedCharacter.abilities[ability.key as keyof typeof selectedCharacter.abilities])})
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button
                      className="flex-1 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-2 text-sm font-medium text-[var(--app-fg)] hover:bg-[var(--app-border)]"
                      onClick={() => handleDamageRoll(false)}
                    >
                      💥 Rolar Dano
                    </button>
                    <button
                      className="flex-1 rounded-xl border border-[var(--app-border)] bg-orange-500/20 px-4 py-2 text-sm font-medium text-orange-400 hover:bg-orange-500/30"
                      onClick={() => handleDamageRoll(true)}
                    >
                      💥 Crítico
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Ações Rápidas */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleInitiativeRoll}
                className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-2 text-sm font-medium text-[var(--app-fg)] hover:bg-[var(--app-border)]"
              >
                ⚡ Iniciativa
              </button>
              <button
                onClick={() => {
                  if (!selectedCharacter) return;
                  const result = rollDamage(damageDice, 0, false);
                  createRoll('ability-check', 'Rolagem Personalizada', result);
                }}
                className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-2 text-sm font-medium text-[var(--app-fg)] hover:bg-[var(--app-border)]"
              >
                🎲 Personalizado
              </button>
            </div>

            {/* Última Rolagem */}
            {lastRoll && (
              <div className="mt-4 p-3 bg-[var(--app-bg)] rounded-lg border border-[var(--app-border)]">
                <div className="text-sm font-medium text-[var(--app-fg)] mb-1">Última Rolagem</div>
                <div className="text-lg font-bold text-purple-500">{lastRoll.total}</div>
                <div className="text-xs text-[var(--app-muted)]">{lastRoll.details}</div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
