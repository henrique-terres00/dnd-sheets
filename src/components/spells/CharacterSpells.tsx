"use client";

import { useState, useEffect } from "react";
import type { Character } from "@/lib/types";
import type { Spell, SpellSlot, CharacterSpellsState } from "@/lib/spells";
import { DEFAULT_SPELLS, getSpellsByClass, getCantripsByClass } from "@/lib/defaultSpells";
import { castSpell, calculateSpellcastingAbility, calculateSpellSlots, type SpellTarget } from "@/lib/spellcasting";
import { proficiencyBonusFromLevel } from "@/lib/dnd5e";
import { Tooltip } from "@/components/ui/Tooltip";

interface CharacterSpellsProps {
  character: Character;
  onUpdate: (spells: CharacterSpellsState) => void;
}

export function CharacterSpells({ character, onUpdate }: CharacterSpellsProps) {
  const [activeTab, setActiveTab] = useState<'spells' | 'cantrips' | 'slots'>('spells');
  const [castResults, setCastResults] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cantripSearchTerm, setCantripSearchTerm] = useState('');
  
  // Initialize with class-specific spell data (excluding cantrips)
  const [spells, setSpells] = useState<Spell[]>(() => 
    getSpellsByClass(character.classKey || '', character.level).filter(spell => spell.level > 0)
  );
  
  const [cantrips, setCantrips] = useState<Spell[]>(() => 
    getCantripsByClass(character.classKey || '')
  );
  
  // Calculate spell slots based on character level and class
  const [spellSlots, setSpellSlots] = useState<SpellSlot[]>([]);

  // Filter spells based on search term
  const filteredSpells = spells.filter(spell => 
    spell.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    spell.school.toLowerCase().includes(searchTerm.toLowerCase()) ||
    spell.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter cantrips based on search term
  const filteredCantrips = cantrips.filter(cantrip => 
    cantrip.name.toLowerCase().includes(cantripSearchTerm.toLowerCase()) ||
    cantrip.school.toLowerCase().includes(cantripSearchTerm.toLowerCase()) ||
    cantrip.description.toLowerCase().includes(cantripSearchTerm.toLowerCase())
  );

  // Calculate spellcasting ability
  const spellcastingInfo = calculateSpellcastingAbility(character);
  const proficiencyBonus = proficiencyBonusFromLevel(character.level);

  // Update available spells when character level or class changes
  useEffect(() => {
    const availableSpells = getSpellsByClass(character.classKey || '', character.level).filter(spell => spell.level > 0);
    setSpells(prev => {
      // Keep existing prepared status for spells that are still available
      return availableSpells.map(spell => {
        const existing = prev.find(s => s.id === spell.id);
        return existing ? { ...spell, prepared: existing.prepared } : { ...spell, prepared: false };
      });
    });
  }, [character.level, character.classKey]);

  // Update cantrips when character class changes
  useEffect(() => {
    const availableCantrips = getCantripsByClass(character.classKey || '');
    setCantrips(prev => {
      return availableCantrips.map(cantrip => {
        const existing = prev.find(c => c.id === cantrip.id);
        return existing ? { ...cantrip, prepared: existing.prepared } : { ...cantrip, prepared: false };
      });
    });
  }, [character.classKey]);

  // Recalculate spell slots when character level increases
  useEffect(() => {
    const newSlots = calculateSpellSlots(character.level, character.classKey || '');
    setSpellSlots(prev => {
      // Merge with existing slots, preserving used count but updating totals
      return newSlots.map(newSlot => {
        const existing = prev.find(s => s.level === newSlot.level);
        return existing 
          ? { ...newSlot, used: Math.min(existing.used, newSlot.total) }
          : { ...newSlot, used: 0 };
      });
    });
  }, [character.level, character.classKey]);

  // Initialize spell slots and load saved data
  useEffect(() => {
    // Load saved spells if available
    if (character.characterSpells) {
      setSpells(character.characterSpells.spells || []);
      setCantrips(character.characterSpells.cantrips || []);
      setSpellSlots(character.characterSpells.spellSlots || spellSlots);
    }
  }, [character.characterSpells]);

  // Save spells state
  const saveSpellsState = (newSpells: Spell[], newCantrips: Spell[], newSpellSlots: SpellSlot[]) => {
    const state: CharacterSpellsState = {
      spells: newSpells,
      cantrips: newCantrips,
      spellSlots: newSpellSlots
    };
    onUpdate(state);
  };

  const castSpellAction = (spell: Spell, targets: SpellTarget[] = []) => {
    // Check if spell slot is available
    if (spell.level > 0) {
      const slot = spellSlots.find(s => s.level === spell.level);
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
      level: character.level
    };

    const result = castSpell(spell, caster, targets);
    
    // Update spell slots
    if (spell.level > 0) {
      updateSpellSlot(spell.level, 1);
    }

    // Add to cast results
    setCastResults(prev => [result, ...prev].slice(0, 5)); // Keep last 5 casts

    // Show result
    alert(result.description);
  };

  const toggleSpellPrepared = (spellId: string, isCantrip: boolean = false) => {
    let newSpells = spells;
    let newCantrips = cantrips;
    
    if (isCantrip) {
      newCantrips = cantrips.map(spell => 
        spell.id === spellId ? { ...spell, prepared: !spell.prepared } : spell
      );
      setCantrips(newCantrips);
    } else {
      newSpells = spells.map(spell => 
        spell.id === spellId ? { ...spell, prepared: !spell.prepared } : spell
      );
      setSpells(newSpells);
    }
    
    saveSpellsState(newSpells, newCantrips, spellSlots);
  };

  const resetSpellSlots = () => {
    const newSlots = spellSlots.map(slot => ({ ...slot, used: 0 }));
    setSpellSlots(newSlots);
    saveSpellsState(spells, cantrips, newSlots);
  };

  const updateSpellSlot = (level: number, increment: number) => {
    const newSlots = spellSlots.map(slot => 
      slot.level === level ? { ...slot, used: Math.max(0, Math.min(slot.used + increment, slot.total)) } : slot
    );
    setSpellSlots(newSlots);
    saveSpellsState(spells, cantrips, newSlots);
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--app-border)] flex-shrink-0">
        <button
          className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'spells' 
              ? 'text-[var(--app-fg)] border-[var(--app-fg)]' 
              : 'text-[var(--app-muted)] border-transparent hover:text-[var(--app-fg)]'
          }`}
          onClick={() => setActiveTab('spells')}
        >
          Magias ({spells.filter(s => s.prepared).length}/{spells.length})
        </button>
        <button
          className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'cantrips' 
              ? 'text-[var(--app-fg)] border-[var(--app-fg)]' 
              : 'text-[var(--app-muted)] border-transparent hover:text-[var(--app-fg)]'
          }`}
          onClick={() => setActiveTab('cantrips')}
        >
          Truques ({cantrips.filter(c => c.prepared).length}/{cantrips.length})
        </button>
        <button
          className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'slots' 
              ? 'text-[var(--app-fg)] border-[var(--app-fg)]' 
              : 'text-[var(--app-muted)] border-transparent hover:text-[var(--app-fg)]'
          }`}
          onClick={() => setActiveTab('slots')}
        >
          Espaços de Magia
        </button>
      </div>

      {/* Content that fills remaining height */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar pr-2">
        {/* Spells Tab */}
        {activeTab === 'spells' && (
          <div className="space-y-3">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar magias por nome, escola ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[var(--app-border)] rounded-lg bg-[var(--app-surface)] text-[var(--app-fg)] placeholder-[var(--app-muted)] focus:outline-none focus:border-[var(--app-fg)]"
              />
              <div className="absolute right-3 top-2.5 text-[var(--app-muted)]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Results count */}
            {searchTerm && (
              <div className="text-xs text-[var(--app-muted)]">
                {filteredSpells.length} {filteredSpells.length === 1 ? 'magia encontrada' : 'magias encontradas'}
              </div>
            )}

            {/* Spells List */}
            {filteredSpells.map((spell) => (
              <div key={spell.id} className="border border-[var(--app-border)] rounded-lg p-3 bg-[var(--app-surface)]">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Tooltip 
                        content={
                          `<div class="space-y-2">
                            <p class="font-semibold">${spell.name}</p>
                            <p class="text-xs">${spell.description}</p>
                            <div class="grid grid-cols-2 gap-2 text-xs">
                              <div><strong>Tempo:</strong> ${spell.castingTime}</div>
                              <div><strong>Alcance:</strong> ${spell.range}</div>
                              <div><strong>Componentes:</strong> ${spell.components}</div>
                              <div><strong>Duração:</strong> ${spell.duration}</div>
                            </div>
                          </div>`
                        }
                      >
                        <h4 className="font-medium text-[var(--app-fg)] cursor-help hover:text-purple-400 transition-colors truncate">
                          {spell.name}
                        </h4>
                      </Tooltip>
                      <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded flex-shrink-0">
                        Nível {spell.level}
                      </span>
                      <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded flex-shrink-0">
                        {spell.school}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[var(--app-muted)] flex-wrap">
                      <span>⏱️ {spell.castingTime}</span>
                      <span>📍 {spell.range}</span>
                      <span>🔮 {spell.components}</span>
                    </div>
                  </div>
                  <div className="ml-4 flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => toggleSpellPrepared(spell.id, false)}
                      className={`px-3 py-1 text-xs rounded transition-colors whitespace-nowrap ${
                        spell.prepared 
                          ? 'bg-green-500 text-white' 
                          : 'bg-[var(--app-border)] text-[var(--app-fg)] hover:bg-[var(--app-border)]'
                      }`}
                    >
                      {spell.prepared ? 'Preparada' : 'Preparar'}
                    </button>
                    {spell.prepared && (
                      <button
                        onClick={() => castSpellAction(spell)}
                        className="px-3 py-1 text-xs rounded bg-red-500 text-white hover:bg-red-600 transition-colors whitespace-nowrap"
                      >
                        Conjurar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* No results message */}
            {searchTerm && filteredSpells.length === 0 && (
              <div className="text-center py-8 text-[var(--app-muted)]">
                <div className="mb-2">
                  <svg className="w-12 h-12 mx-auto text-[var(--app-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-sm">Nenhuma magia encontrada para "{searchTerm}"</p>
                <p className="text-xs mt-1">Tente buscar por nome, escola ou descrição</p>
              </div>
            )}
          </div>
        )}

        {/* Cantrips Tab */}
        {activeTab === 'cantrips' && (
          <div className="space-y-3">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar truques por nome, escola ou descrição..."
                value={cantripSearchTerm}
                onChange={(e) => setCantripSearchTerm(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[var(--app-border)] rounded-lg bg-[var(--app-surface)] text-[var(--app-fg)] placeholder-[var(--app-muted)] focus:outline-none focus:border-[var(--app-fg)]"
              />
              <div className="absolute right-3 top-2.5 text-[var(--app-muted)]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Results count */}
            {cantripSearchTerm && (
              <div className="text-xs text-[var(--app-muted)]">
                {filteredCantrips.length} {filteredCantrips.length === 1 ? 'truque encontrado' : 'truques encontrados'}
              </div>
            )}

            {/* Cantrips List */}
            {filteredCantrips.map((cantrip) => (
              <div key={cantrip.id} className="border border-[var(--app-border)] rounded-lg p-3 bg-[var(--app-surface)]">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Tooltip 
                        content={
                          `<div class="space-y-2">
                            <p class="font-semibold">${cantrip.name}</p>
                            <p class="text-xs">${cantrip.description}</p>
                            <div class="grid grid-cols-2 gap-2 text-xs">
                              <div><strong>Tempo:</strong> ${cantrip.castingTime}</div>
                              <div><strong>Alcance:</strong> ${cantrip.range}</div>
                              <div><strong>Componentes:</strong> ${cantrip.components}</div>
                              <div><strong>Duração:</strong> ${cantrip.duration}</div>
                            </div>
                          </div>`
                        }
                      >
                        <h4 className="font-medium text-[var(--app-fg)] cursor-help hover:text-purple-400 transition-colors truncate">
                          {cantrip.name}
                        </h4>
                      </Tooltip>
                      <span className="text-xs px-2 py-1 bg-gray-500/20 text-gray-400 rounded flex-shrink-0">
                        Truque
                      </span>
                      <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded flex-shrink-0">
                        {cantrip.school}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[var(--app-muted)] flex-wrap">
                      <span>⏱️ {cantrip.castingTime}</span>
                      <span>📍 {cantrip.range}</span>
                      <span>🔮 {cantrip.components}</span>
                    </div>
                  </div>
                  <div className="ml-4 flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => toggleSpellPrepared(cantrip.id, true)}
                      className={`px-3 py-1 text-xs rounded transition-colors whitespace-nowrap ${
                        cantrip.prepared 
                          ? 'bg-green-500 text-white' 
                          : 'bg-[var(--app-border)] text-[var(--app-fg)] hover:bg-[var(--app-border)]'
                      }`}
                    >
                      {cantrip.prepared ? 'Preparado' : 'Preparar'}
                    </button>
                    {cantrip.prepared && (
                      <button
                        onClick={() => castSpellAction(cantrip)}
                        className="px-3 py-1 text-xs rounded bg-red-500 text-white hover:bg-red-600 transition-colors whitespace-nowrap"
                      >
                        Conjurar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* No results message */}
            {cantripSearchTerm && filteredCantrips.length === 0 && (
              <div className="text-center py-8 text-[var(--app-muted)]">
                <div className="mb-2">
                  <svg className="w-12 h-12 mx-auto text-[var(--app-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-sm">Nenhum truque encontrado para "{cantripSearchTerm}"</p>
                <p className="text-xs mt-1">Tente buscar por nome, escola ou descrição</p>
              </div>
            )}
          </div>
        )}

        {/* Spell Slots Tab */}
        {activeTab === 'slots' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-[var(--app-fg)]">Espaços de Magia</h3>
              <button
                onClick={resetSpellSlots}
                className="px-3 py-1 text-xs rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              >
                Restaurar Todos
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {spellSlots.map((slot) => (
                <div key={slot.level} className="border border-[var(--app-border)] rounded-lg p-3 bg-[var(--app-surface)]">
                  <div className="text-center">
                    <div className="text-lg font-bold text-[var(--app-fg)]">Nível {slot.level}</div>
                    <div className="text-2xl font-bold text-purple-400 my-2">
                      {slot.total - slot.used}/{slot.total}
                    </div>
                    <div className="flex gap-1 justify-center">
                      <button
                        onClick={() => updateSpellSlot(slot.level, -1)}
                        disabled={slot.used === 0}
                        className="px-2 py-1 text-xs rounded bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        -
                      </button>
                      <button
                        onClick={() => updateSpellSlot(slot.level, 1)}
                        disabled={slot.used >= slot.total}
                        className="px-2 py-1 text-xs rounded bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
