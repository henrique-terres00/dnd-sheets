"use client";

import { useState, useEffect } from "react";
import type { Character } from "@/lib/types";
import type { Spell, SpellSlot, CharacterSpellsState } from "@/lib/spells";
import { getSpellsByClass, getCantripsByClass } from "@/lib/defaultSpells";
import { calculateSpellcastingAbility, calculateSpellSlots } from "@/lib/spellcasting";
import { proficiencyBonusFromLevel } from "@/lib/dnd5e";
import { Tooltip } from "@/components/ui/Tooltip";

interface UniversalCharacterSpellsProps {
  character: Character;
  onUpdate: (spells: CharacterSpellsState) => void;
}

export function UniversalCharacterSpells({ character, onUpdate }: UniversalCharacterSpellsProps) {
  const [activeTab, setActiveTab] = useState<"spells" | "cantrips">("spells");
  const [searchTerm, setSearchTerm] = useState("");
  const [cantripSearchTerm, setCantripSearchTerm] = useState("");

  // Initialize with class-specific spell data (excluding cantrips)
  const [spells, setSpells] = useState<Spell[]>([]);
  const [cantrips, setCantrips] = useState<Spell[]>([]);

  // Update spells when character changes
  useEffect(() => {
    // Check if character already has saved spells
    if (character.characterSpells) {
      setSpells(character.characterSpells.spells || []);
      setCantrips(character.characterSpells.cantrips || []);
    } else {
      // Use default spells for new characters
      const classSpells = getSpellsByClass(character.classKey || "", character.level).filter((spell) => spell.level > 0);
      const classCantrips = getCantripsByClass(character.classKey || "");
      
      setSpells(classSpells);
      setCantrips(classCantrips);
    }
  }, [character.classKey, character.level, character.className, character.characterSpells]);

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

  // Toggle spell preparation
  const toggleSpellPreparation = (spellId: string) => {
    const updatedSpells = spells.map((spell) =>
      spell.id === spellId ? { ...spell, prepared: !spell.prepared } : spell
    );
    setSpells(updatedSpells);
    saveSpellsState(updatedSpells, cantrips, spellSlots);
  };

  // Toggle cantrip preparation
  const toggleCantripPreparation = (cantripId: string) => {
    const updatedCantrips = cantrips.map((cantrip) =>
      cantrip.id === cantripId ? { ...cantrip, prepared: !cantrip.prepared } : cantrip
    );
    setCantrips(updatedCantrips);
    saveSpellsState(spells, updatedCantrips, spellSlots);
  };

  
  return (
    <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
      <h3 className="text-sm font-medium text-[var(--app-fg)] mb-3">
        <span>🔮 Magias</span>
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
              <div key={spell.id} className="border border-[var(--app-border)] rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <Tooltip content={spell.description}>
                    <span className={`text-sm font-medium cursor-help transition-colors ${
                      spell.prepared ? "text-[var(--app-fg)]" : "text-[var(--app-muted)]"
                    }`}>
                      {spell.name}
                    </span>
                  </Tooltip>
                  <span className="text-xs px-1 py-0.5 bg-purple-500/20 text-purple-400 rounded">
                    Nível {spell.level}
                  </span>
                </div>
                <div className="text-xs text-blue-400 mb-2">{spell.school}</div>
                <button
                  onClick={() => toggleSpellPreparation(spell.id)}
                  className={`w-full px-2 py-1 text-xs font-medium rounded transition-colors ${
                    spell.prepared 
                      ? "bg-green-500/20 text-green-400 hover:bg-green-500/30" 
                      : "bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
                  }`}
                >
                  {spell.prepared ? "Preparada" : "N/P"}
                </button>
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
              <div key={cantrip.id} className="border border-[var(--app-border)] rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <Tooltip content={cantrip.description}>
                    <span className={`text-sm font-medium cursor-help transition-colors ${
                      cantrip.prepared ? "text-[var(--app-fg)]" : "text-[var(--app-muted)]"
                    }`}>
                      {cantrip.name}
                    </span>
                  </Tooltip>
                  <span className="text-xs px-1 py-0.5 bg-blue-500/20 text-blue-400 rounded">Truque</span>
                </div>
                <div className="text-xs text-blue-400 mb-2">{cantrip.school}</div>
                <button
                  onClick={() => toggleCantripPreparation(cantrip.id)}
                  className={`w-full px-2 py-1 text-xs font-medium rounded transition-colors ${
                    cantrip.prepared 
                      ? "bg-green-500/20 text-green-400 hover:bg-green-500/30" 
                      : "bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
                  }`}
                >
                  {cantrip.prepared ? "Preparado" : "N/P"}
                </button>
              </div>
            ))}
            {filteredCantrips.length === 0 && (
              <div className="col-span-2 text-center text-[var(--app-muted)] py-4">
                Nenhum truque encontrado
              </div>
            )}
          </div>
        </div>
      )}

      </div>
  );
}
