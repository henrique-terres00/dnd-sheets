"use client";

import { useEffect, useState } from "react";
import { listCharacters } from "@/lib/characterStore";
import { abilityMod } from "@/lib/dnd5e";
import { 
  rollAttack, 
  rollSkillCheck, 
  rollDamage, 
  rollInitiative,
  type RollResult 
} from "@/lib/dice";
import { addRollToLog, type DiceRoll } from "@/lib/rollLog";

interface MapDiceRollerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MapDiceRoller({ isOpen, onClose }: MapDiceRollerProps) {
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>("");
  const [selectedSkill, setSelectedSkill] = useState<string>("");
  const [selectedAbility, setSelectedAbility] = useState<string>("");
  const [damageDice, setDamageDice] = useState<string>("1d6");
  const [damageAbility, setDamageAbility] = useState<string>("str");
  const [attackAbility, setAttackAbility] = useState<string>("str");
  const [magicBonus, setMagicBonus] = useState<number>(0);
  const [advantage, setAdvantage] = useState<'none' | 'advantage' | 'disadvantage'>('none');
  const [lastRoll, setLastRoll] = useState<RollResult | null>(null);
  const [characters, setCharacters] = useState<any[]>([]);

  // Load available characters on mount
  useEffect(() => {
    try {
      const loadedCharacters = listCharacters();
      setCharacters(loadedCharacters);
    } catch (error) {
      console.error('Failed to load characters:', error);
      setCharacters([]);
    }
  }, []);

  const selectedCharacter = characters.find(c => c.id === selectedCharacterId);

  const proficiencyBonus = selectedCharacter?.proficiencyBonusOverride ?? 
    Math.floor((selectedCharacter?.level || 1) / 4) + 2;

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

  // Function to create and register a roll in the log
  const createRoll = (type: DiceRoll['type'], label: string, result: RollResult) => {
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

    addRollToLog(roll);
    setLastRoll(result);
  };

  // Skill roll
  const handleSkillRoll = () => {
    if (!selectedCharacter || !selectedSkill) return;

    const skill = skills.find(s => s.key === selectedSkill);
    if (!skill) return;

    const abilityModValue = abilityMod(selectedCharacter.abilities[skill.ability as keyof typeof selectedCharacter.abilities]);
    const isProficient = selectedCharacter.skillProficiencies[selectedSkill as keyof typeof selectedCharacter.skillProficiencies];
    // TODO: Implement expertise system - for now, Rogues get expertise in Thieves' Tools, Bards in chosen skills
    const isExpertise = false;

    const result = rollSkillCheck(abilityModValue, isProficient ? proficiencyBonus : 0, isExpertise, advantage);
    createRoll('skill', skill.label, result);
  };

  // Ability check roll
  const handleAbilityRoll = () => {
    if (!selectedCharacter || !selectedAbility) return;

    const abilityModValue = abilityMod(selectedCharacter.abilities[selectedAbility as keyof typeof selectedCharacter.abilities]);
    const result = rollSkillCheck(abilityModValue, 0, false, advantage);
    
    const ability = abilities.find(a => a.key === selectedAbility);
    if (ability) {
      createRoll('ability-check', ability.label, result);
    }
  };

  // Attack roll
  const handleAttackRoll = () => {
    if (!selectedCharacter) return;

    const attackMod = abilityMod(selectedCharacter.abilities[attackAbility as keyof typeof selectedCharacter.abilities]);
    const result = rollAttack(proficiencyBonus, attackMod, magicBonus, advantage);
    const abilityLabel = abilities.find(a => a.key === attackAbility)?.label || attackAbility;
    createRoll('attack', `Ataque (${abilityLabel})`, result);
  };

  // Damage roll
  const handleDamageRoll = (critical: boolean = false) => {
    if (!selectedCharacter) return;

    const damageMod = abilityMod(selectedCharacter.abilities[damageAbility as keyof typeof selectedCharacter.abilities]);
    const result = rollDamage(damageDice, damageMod, critical);
    const abilityLabel = abilities.find(a => a.key === damageAbility)?.label || damageAbility;
    createRoll('damage', `Dano (${abilityLabel})${critical ? ' (Crítico)' : ''}`, result);
  };

  // Initiative roll
  const handleInitiativeRoll = () => {
    if (!selectedCharacter) return;

    const dexMod = abilityMod(selectedCharacter.abilities.dex);
    const result = rollInitiative(dexMod);
    createRoll('initiative', 'Iniciativa', result);
  };

  // Saving throw roll
  const handleSavingThrowRoll = (ability: string) => {
    if (!selectedCharacter) return;

    const abilityModValue = abilityMod(selectedCharacter.abilities[ability as keyof typeof selectedCharacter.abilities]);
    const isProficient = selectedCharacter.savingThrowProficiencies[ability as keyof typeof selectedCharacter.savingThrowProficiencies];
    const result = rollSkillCheck(abilityModValue, isProficient ? proficiencyBonus : 0, false, advantage);
    
    const abilityLabel = abilities.find(a => a.key === ability)?.label || ability;
    createRoll('saving-throw', `Salvaguarda de ${abilityLabel}`, result);
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
                {character.name || "Personagem sem nome"} (Nível {character.level || 1})
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
                      {skill.label} ({abilityMod(selectedCharacter.abilities[skill.ability as keyof typeof selectedCharacter.abilities]) >= 0 ? '+' : ''}{abilityMod(selectedCharacter.abilities[skill.ability as keyof typeof selectedCharacter.abilities])}
                      {selectedCharacter.skillProficiencies[skill.key as keyof typeof selectedCharacter.skillProficiencies] ? ' ✓' : ''}
                    </option>
                  ))}
                </select>
                <button
                  className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-2 text-sm font-medium text-[var(--app-fg)] hover:bg-[var(--app-border)]"
                  onClick={handleSkillRoll}
                  disabled={!selectedSkill}
                >
                  Rolar
                </button>
              </div>
            </div>

            {/* Testes de Habilidade */}
            <div className="mb-4">
              <label className="text-xs font-medium text-[var(--app-muted)]">Teste de Habilidade</label>
              <div className="flex gap-2 mt-1">
                <select 
                  className="flex-1 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-fg)] [color-scheme:dark]"
                  value={selectedAbility}
                  onChange={(e) => setSelectedAbility(e.target.value)}
                >
                  <option value="">Selecionar habilidade...</option>
                  {abilities.map(ability => (
                    <option key={ability.key} value={ability.key}>
                      {ability.label} ({abilityMod(selectedCharacter.abilities[ability.key as keyof typeof selectedCharacter.abilities]) >= 0 ? '+' : ''}{abilityMod(selectedCharacter.abilities[ability.key as keyof typeof selectedCharacter.abilities])})
                    </option>
                  ))}
                </select>
                <button
                  className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-2 text-sm font-medium text-[var(--app-fg)] hover:bg-[var(--app-border)]"
                  onClick={handleAbilityRoll}
                  disabled={!selectedAbility}
                >
                  Rolar
                </button>
              </div>
            </div>

            {/* Salvaguardas */}
            <div className="mb-4">
              <label className="text-xs font-medium text-[var(--app-muted)]">Testes de Salvaguarda</label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {abilities.map(ability => (
                  <button
                    key={ability.key}
                    className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-2 py-1 text-xs text-[var(--app-fg)] hover:bg-[var(--app-border)]"
                    onClick={() => handleSavingThrowRoll(ability.key)}
                  >
                    {ability.label}
                    {selectedCharacter.savingThrowProficiencies[ability.key as keyof typeof selectedCharacter.savingThrowProficiencies] ? ' ✓' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Ações Rápidas */}
            <div className="mb-4">
              <label className="text-xs font-medium text-[var(--app-muted)]">Ações Rápidas</label>
              
              {/* Configuração de Ataque */}
              <div className="mb-3 p-3 rounded-lg border border-[var(--app-border)] bg-[var(--app-bg)]">
                <div className="text-xs font-medium text-[var(--app-fg)] mb-2">Configuração de Ataque</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <select
                    className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-2 py-1 text-xs text-[var(--app-fg)] [color-scheme:dark]"
                    value={attackAbility}
                    onChange={(e) => setAttackAbility(e.target.value)}
                  >
                    {abilities.map(ability => (
                      <option key={ability.key} value={ability.key}>
                        {ability.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-2 py-1 text-xs text-[var(--app-fg)]"
                    value={magicBonus}
                    onChange={(e) => setMagicBonus(parseInt(e.target.value) || 0)}
                    placeholder="Bônus Mágico"
                    min="0"
                    max="10"
                  />
                  <button
                    className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-2 py-1 text-xs text-[var(--app-fg)] hover:bg-[var(--app-border)]"
                    onClick={handleAttackRoll}
                  >
                    ⚔️ Ataque
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-fg)] hover:bg-[var(--app-border)]"
                  onClick={handleInitiativeRoll}
                >
                  ⚡ Iniciativa
                </button>
              </div>
            </div>

            {/* Dano */}
            <div className="mb-4">
              <label className="text-xs font-medium text-[var(--app-muted)]">Dano</label>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mt-1">
                <input
                  type="text"
                  className="sm:col-span-2 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-fg)]"
                  value={damageDice}
                  onChange={(e) => setDamageDice(e.target.value)}
                  placeholder="1d6"
                />
                <select
                  className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-fg)] [color-scheme:dark]"
                  value={damageAbility}
                  onChange={(e) => setDamageAbility(e.target.value)}
                >
                  {abilities.map(ability => (
                    <option key={ability.key} value={ability.key}>
                      {ability.label}
                    </option>
                  ))}
                </select>
                <button
                  className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-2 text-sm font-medium text-[var(--app-fg)] hover:bg-[var(--app-border)]"
                  onClick={() => handleDamageRoll(false)}
                >
                  Rolar
                </button>
                <button
                  className="rounded-xl border border-[var(--app-border)] bg-red-500/20 px-4 py-2 text-sm font-medium text-[var(--app-fg)] hover:bg-red-500/30"
                  onClick={() => handleDamageRoll(true)}
                >
                  Crítico
                </button>
              </div>
            </div>

            {/* Última Rolagem */}
            {lastRoll && (
              <div className="mt-4 p-3 rounded-lg border border-[var(--app-border)] bg-[var(--app-bg)]">
                <div className="text-sm font-medium text-[var(--app-fg)]">
                  Última rolagem: {lastRoll.formula}
                </div>
                <div className="text-lg font-bold text-[var(--app-fg)]">
                  {lastRoll.details} = {lastRoll.total}
                </div>
                {lastRoll.critical && (
                  <div className="text-sm text-[var(--app-muted)]">
                    {lastRoll.critical === 'success' ? '🎯 Acerto Crítico!' : '❌ Falha Crítica!'}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
