"use client";

import { useState } from "react";
import { Character } from "@/lib/types";
import { abilityMod } from "@/lib/dnd5e";
import { 
  rollAttack, 
  rollSkillCheck, 
  rollDamage, 
  rollInitiative,
  type RollResult 
} from "@/lib/dice";
import { addRollToLog, type DiceRoll } from "@/lib/rollLog";

interface DiceRollerProps {
  character: Character;
  playerName: string;
}

export function DiceRoller({ character, playerName }: DiceRollerProps) {
  const [selectedSkill, setSelectedSkill] = useState<string>("");
  const [selectedAbility, setSelectedAbility] = useState<string>("");
  const [damageDice, setDamageDice] = useState<string>("1d6");
  const [advantage, setAdvantage] = useState<'none' | 'advantage' | 'disadvantage'>('none');
  const [lastRoll, setLastRoll] = useState<RollResult | null>(null);

  const proficiencyBonus = character.proficiencyBonusOverride ?? 
    Math.floor((character.level || 1) / 4) + 2;

  // Habilidades para testes
  const abilities = [
    { key: "str", label: "Força" },
    { key: "dex", label: "Destreza" },
    { key: "con", label: "Constituição" },
    { key: "int", label: "Inteligência" },
    { key: "wis", label: "Sabedoria" },
    { key: "cha", label: "Carisma" }
  ];

  // Perícias para testes
  const skills = [
    { key: "athletics", label: "Atletismo", ability: "str" },
    { key: "acrobatics", label: "Acrobacia", ability: "dex" },
    { key: "stealth", label: "Furtividade", ability: "dex" },
    { key: "arcana", label: "Arcanismo", ability: "int" },
    { key: "history", label: "História", ability: "int" },
    { key: "investigation", label: "Investigação", ability: "int" },
    { key: "nature", label: "Natureza", ability: "int" },
    { key: "religion", label: "Religião", ability: "int" },
    { key: "insight", label: "Intuição", ability: "wis" },
    { key: "medicine", label: "Medicina", ability: "wis" },
    { key: "perception", label: "Percepção", ability: "wis" },
    { key: "survival", label: "Sobrevivência", ability: "wis" },
    { key: "deception", label: "Enganação", ability: "cha" },
    { key: "intimidation", label: "Intimidação", ability: "cha" },
    { key: "performance", label: "Atuação", ability: "cha" },
    { key: "persuasion", label: "Persuasão", ability: "cha" }
  ];

  // Função para criar e registrar uma rolagem no log
  const createRoll = (type: DiceRoll['type'], label: string, result: RollResult) => {
    const roll: DiceRoll = {
      id: crypto.randomUUID(),
      playerId: character.id,
      playerName,
      characterName: character.name || "(Sem nome)",
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

  // Rolagem de perícia
  const handleSkillRoll = () => {
    if (!selectedSkill) return;

    const skill = skills.find(s => s.key === selectedSkill);
    if (!skill) return;

    const abilityModValue = abilityMod(character.abilities[skill.ability as keyof typeof character.abilities]);
    const isProficient = character.skillProficiencies[selectedSkill as keyof typeof character.skillProficiencies];
    const isExpertise = false; // Poderia adicionar expertise no futuro

    const result = rollSkillCheck(abilityModValue, isProficient ? proficiencyBonus : 0, isExpertise, advantage);
    createRoll('skill', skill.label, result);
  };

  // Rolagem de teste de habilidade
  const handleAbilityRoll = () => {
    if (!selectedAbility) return;

    const abilityModValue = abilityMod(character.abilities[selectedAbility as keyof typeof character.abilities]);
    const result = rollSkillCheck(abilityModValue, 0, false, advantage);
    
    const ability = abilities.find(a => a.key === selectedAbility);
    if (ability) {
      createRoll('ability-check', ability.label, result);
    }
  };

  // Rolagem de ataque
  const handleAttackRoll = () => {
    const strMod = abilityMod(character.abilities.str);
    const result = rollAttack(proficiencyBonus, strMod, 0, advantage);
    createRoll('attack', 'Ataque', result);
  };

  // Rolagem de dano
  const handleDamageRoll = (critical: boolean = false) => {
    const strMod = abilityMod(character.abilities.str);
    const result = rollDamage(damageDice, strMod, critical);
    createRoll('damage', `Dano${critical ? ' (Crítico)' : ''}`, result);
  };

  // Rolagem de iniciativa
  const handleInitiativeRoll = () => {
    const dexMod = abilityMod(character.abilities.dex);
    const result = rollInitiative(dexMod);
    createRoll('initiative', 'Iniciativa', result);
  };

  // Rolagem de salvaguarda
  const handleSavingThrowRoll = (ability: string) => {
    const abilityModValue = abilityMod(character.abilities[ability as keyof typeof character.abilities]);
    const isProficient = character.savingThrowProficiencies[ability as keyof typeof character.savingThrowProficiencies];
    const result = rollSkillCheck(abilityModValue, isProficient ? proficiencyBonus : 0, false, advantage);
    
    const abilityLabel = abilities.find(a => a.key === ability)?.label || ability;
    createRoll('saving-throw', `Salvaguarda de ${abilityLabel}`, result);
  };

  return (
    <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-sm">
      <h3 className="text-lg font-semibold mb-4">🎲 Rolagem de Dados</h3>
      
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
                {skill.label} ({abilityMod(character.abilities[skill.ability as keyof typeof character.abilities]) >= 0 ? '+' : ''}{abilityMod(character.abilities[skill.ability as keyof typeof character.abilities])}
                {character.skillProficiencies[skill.key as keyof typeof character.skillProficiencies] ? ' ✓' : ''}
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
                {ability.label} ({abilityMod(character.abilities[ability.key as keyof typeof character.abilities]) >= 0 ? '+' : ''}{abilityMod(character.abilities[ability.key as keyof typeof character.abilities])})
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
              {character.savingThrowProficiencies[ability.key as keyof typeof character.savingThrowProficiencies] ? ' ✓' : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="mb-4">
        <label className="text-xs font-medium text-[var(--app-muted)]">Ações Rápidas</label>
        <div className="grid grid-cols-2 gap-2 mt-1">
          <button
            className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-fg)] hover:bg-[var(--app-border)]"
            onClick={handleAttackRoll}
          >
            ⚔️ Ataque
          </button>
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
    </div>
  );
}
