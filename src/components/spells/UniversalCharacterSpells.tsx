"use client";

import { useState, useEffect } from "react";
import type { Character } from "@/lib/types";
import type { Spell, SpellSlot, CharacterSpellsState } from "@/lib/spells";
import { getSpellsByClass, getCantripsByClass } from "@/lib/defaultSpells";
import { castSpell, calculateSpellcastingAbility, calculateSpellSlots, type SpellTarget } from "@/lib/spellcasting";
import { proficiencyBonusFromLevel } from "@/lib/dnd5e";
import { Tooltip } from "@/components/ui/Tooltip";
import { addRollToSession } from "@/lib/supabase";
import type { DiceRoll } from "@/lib/rollLog";

interface UniversalCharacterSpellsProps {
  character: Character;
  onUpdate: (spells: CharacterSpellsState) => void;
}

export function UniversalCharacterSpells({ character, onUpdate }: UniversalCharacterSpellsProps) {
  const [activeTab, setActiveTab] = useState<"spells" | "cantrips" | "slots">("spells");
  const [castResults, setCastResults] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [cantripSearchTerm, setCantripSearchTerm] = useState("");

  // Initialize with class-specific spell data (excluding cantrips)
  const [spells, setSpells] = useState<Spell[]>(() =>
    getSpellsByClass(character.classKey || "", character.level).filter((spell) => spell.level > 0)
  );

  const [cantrips, setCantrips] = useState<Spell[]>(() => getCantripsByClass(character.classKey || ""));

  // Calculate spell slots based on character level and class
  const [spellSlots, setSpellSlots] = useState<SpellSlot[]>([]);

  // Filter spells based on search term
  const filteredSpells = spells.filter(
    (spell) =>
      spell.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      spell.school.toLowerCase().includes(searchTerm.toLowerCase()) ||
      spell.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter cantrips based on search term
  const filteredCantrips = cantrips.filter(
    (cantrip) =>
      cantrip.name.toLowerCase().includes(cantripSearchTerm.toLowerCase()) ||
      cantrip.school.toLowerCase().includes(cantripSearchTerm.toLowerCase()) ||
      cantrip.description.toLowerCase().includes(cantripSearchTerm.toLowerCase())
  );

  // Calculate spellcasting ability
  const spellcastingInfo = calculateSpellcastingAbility(character);
  const proficiencyBonus = proficiencyBonusFromLevel(character.level);

  // Initialize spell slots
  useEffect(() => {
    const slots = calculateSpellSlots(character.level, character.classKey || "");
    setSpellSlots(slots);
  }, [character.level, character.classKey]);

  const scrollAreaClass =
    "overflow-y-auto pr-2 [scrollbar-gutter:stable] overscroll-contain " +
    "[scrollbar-width:thin] [scrollbar-color:rgba(168,85,247,.55)_rgba(255,255,255,.04)] " +
    "[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2 " +
    "[&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-[rgba(255,255,255,0.04)] " +
    "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[rgba(168,85,247,0.55)] " +
    "[&::-webkit-scrollbar-thumb]:border [&::-webkit-scrollbar-thumb]:border-[rgba(0,0,0,0.35)] " +
    "[&::-webkit-scrollbar-thumb:hover]:bg-[rgba(168,85,247,0.78)] " +
    "[&::-webkit-scrollbar-thumb:active]:bg-[rgba(168,85,247,0.9)]";

  // Update spell slot usage
  const updateSpellSlot = (level: number, used: number) => {
    const updatedSlots = spellSlots.map((slot) =>
      slot.level === level ? { ...slot, used: Math.min(slot.used + used, slot.total) } : slot
    );
    setSpellSlots(updatedSlots);
    saveSpellsState(spells, cantrips, updatedSlots);
  };

  // Save spells state
  const saveSpellsState = (newSpells: Spell[], newCantrips: Spell[], newSpellSlots: SpellSlot[]) => {
    const state: CharacterSpellsState = {
      spells: newSpells,
      cantrips: newCantrips,
      spellSlots: newSpellSlots,
    };
    onUpdate(state);
  };

  const castSpellAction = async (spell: Spell, targets: SpellTarget[] = []) => {
    // Check if spell slot is available
    if (spell.level > 0) {
      const slot = spellSlots.find((s) => s.level === spell.level);
      if (!slot || slot.used >= slot.total) {
        alert(`Sem espaços de magia de nível ${spell.level} disponíveis!`);
        return;
      }
    }

    // Cast the spell with combat mechanics
    const caster = {
      spellcastingAbility: spellcastingInfo.ability,
      spellcastingModifier: spellcastingInfo.modifier,
      proficiencyBonus: proficiencyBonus,
      level: character.level,
    };

    const result = castSpell(spell, caster, targets);

    // Update spell slots
    if (spell.level > 0) {
      updateSpellSlot(spell.level, 1);
    }

    // Create roll data
    const roll: DiceRoll = {
      id: crypto.randomUUID(),
      playerId: character.id,
      playerName: character.name || "Personagem sem nome",
      characterName: character.name || "Personagem sem nome",
      type: "spell",
      label: spell.name,
      formula: spell.level > 0 ? `Nível ${spell.level}` : "Truque",
      result: result.damage || result.healing || 0,
      details: result.description,
      timestamp: new Date(),
    };

    // Always save to session (synchronized for all users)
    const currentSession = localStorage.getItem("currentSession");
    if (currentSession) {
      try {
        await addRollToSession(currentSession, roll);
      } catch (error) {
        console.error("Error adding spell roll to session:", error);
      }
    }

    // Add to cast results
    setCastResults((prev) => [
      ...prev,
      {
        spell: spell.name,
        result: result,
        timestamp: new Date(),
      },
    ]);
  };

  const resetSpellSlots = () => {
    const resetSlots = spellSlots.map((slot) => ({ ...slot, used: 0 }));
    setSpellSlots(resetSlots);
    saveSpellsState(spells, cantrips, resetSlots);
  };

  return (
    <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
      <h3 className="text-sm font-medium text-[var(--app-fg)] mb-3 flex items-center justify-between">
        <span>🔮 Magias</span>
        <button
          onClick={resetSpellSlots}
          className="text-xs px-2 py-1 rounded border border-[var(--app-border)] bg-[var(--app-bg)] text-[var(--app-muted)] hover:text-[var(--app-fg)]"
        >
          Resetar Slots
        </button>
      </h3>

      {/* Spellcasting Info */}
      <div className="mb-4 p-3 bg-[var(--app-bg)] rounded-lg">
        <div className="text-xs text-[var(--app-muted)] mb-1">
          Habilidade de Conjuração: {spellcastingInfo.ability} (modificador{" "}
          {spellcastingInfo.modifier >= 0 ? "+" : ""}
          {spellcastingInfo.modifier})
        </div>
        <div className="text-xs text-[var(--app-muted)]">
          CD da Magia: {8 + proficiencyBonus + spellcastingInfo.modifier}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab("spells")}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
            activeTab === "spells" ? "bg-purple-500 text-white" : "bg-[var(--app-bg)] text-[var(--app-muted)] hover:text-[var(--app-fg)]"
          }`}
        >
          Magias
        </button>
        <button
          onClick={() => setActiveTab("cantrips")}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
            activeTab === "cantrips" ? "bg-purple-500 text-white" : "bg-[var(--app-bg)] text-[var(--app-muted)] hover:text-[var(--app-fg)]"
          }`}
        >
          Truques
        </button>
        <button
          onClick={() => setActiveTab("slots")}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
            activeTab === "slots" ? "bg-purple-500 text-white" : "bg-[var(--app-bg)] text-[var(--app-muted)] hover:text-[var(--app-fg)]"
          }`}
        >
          Espaços
        </button>
      </div>

      {/* Spells Tab */}
      {activeTab === "spells" && (
        <div>
          <input
            type="text"
            placeholder="Buscar magias..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-fg)] mb-3 [color-scheme:dark]"
          />

          <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 ${scrollAreaClass}`}>
            {filteredSpells.map((spell) => (
              <div key={spell.id} className="border border-[var(--app-border)] rounded-lg p-2">
                <div className="flex items-center justify-between mb-1">
                  <Tooltip content={spell.description}>
                    <span className="text-sm font-medium text-[var(--app-fg)] cursor-help hover:text-purple-400 transition-colors">
                      {spell.name}
                    </span>
                  </Tooltip>
                  <span className="text-xs px-1 py-0.5 bg-purple-500/20 text-purple-400 rounded">
                    Nível {spell.level}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--app-muted)]">{spell.school}</span>
                  <button onClick={() => castSpellAction(spell)} className="text-xs px-2 py-1 bg-purple-500 text-white rounded hover:bg-purple-600">
                    Conjurar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cantrips Tab */}
      {activeTab === "cantrips" && (
        <div>
          <input
            type="text"
            placeholder="Buscar truques..."
            value={cantripSearchTerm}
            onChange={(e) => setCantripSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-fg)] mb-3 [color-scheme:dark]"
          />

          <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 ${scrollAreaClass}`}>
            {filteredCantrips.map((cantrip) => (
              <div key={cantrip.id} className="border border-[var(--app-border)] rounded-lg p-2">
                <div className="flex items-center justify-between mb-1">
                  <Tooltip content={cantrip.description}>
                    <span className="text-sm font-medium text-[var(--app-fg)] cursor-help hover:text-blue-400 transition-colors">
                      {cantrip.name}
                    </span>
                  </Tooltip>
                  <span className="text-xs px-1 py-0.5 bg-blue-500/20 text-blue-400 rounded">Truque</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--app-muted)]">{cantrip.school}</span>
                  <button onClick={() => castSpellAction(cantrip)} className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
                    Conjurar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Spell Slots Tab */}
      {activeTab === "slots" && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {spellSlots.map((slot) => (
              <div key={slot.level} className="border border-[var(--app-border)] rounded-lg p-2 text-center">
                <div className="text-sm font-medium text-[var(--app-fg)]">Nível {slot.level}</div>
                <div className="text-lg font-bold text-purple-500">
                  {slot.total - slot.used}/{slot.total}
                </div>
                <div className="text-xs text-[var(--app-muted)]">Restantes</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cast Results */}
      {castResults.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[var(--app-border)]">
          <h4 className="text-sm font-medium text-[var(--app-fg)] mb-2">Resultados Recentes</h4>
          <div className={`space-y-1 max-h-32 ${scrollAreaClass}`}>
            {castResults
              .slice(-5)
              .reverse()
              .map((result, index) => (
                <div key={index} className="text-xs text-[var(--app-muted)]">
                  {result.spell}: {result.result.description}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}