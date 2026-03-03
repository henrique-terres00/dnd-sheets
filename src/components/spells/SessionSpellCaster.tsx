"use client";

import { useState, useEffect } from "react";
import { rollDamage, type RollResult } from "@/lib/dice";
import { addRollToSession } from "@/lib/supabase";
import { abilityMod } from "@/lib/dnd5e";
import { castSpell, calculateSpellcastingAbility } from "@/lib/spellcasting";
import { DiceAnimation } from "@/components/dice/DiceAnimation";
import type { Character } from "@/lib/types";
import type { CharacterSpellsState, Spell } from "@/lib/spells";
import type { DiceRoll } from "@/lib/rollLog";

interface SessionSpellCasterProps {
  isOpen: boolean;
  onClose: () => void;
  sessionCharacters: Character[];
  localCharacters: Character[];
}

export function SessionSpellCaster({ isOpen, onClose, sessionCharacters, localCharacters }: SessionSpellCasterProps) {
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>("");
  const [isCasting, setIsCasting] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [currentFormula, setCurrentFormula] = useState<string>("1d20");

  // Combina personagens da sessão + locais
  const allCharacters = [
    ...sessionCharacters.map(c => ({ ...c, source: 'session' as const })),
    ...localCharacters.map(c => ({ ...c, source: 'local' as const }))
  ];

  const selectedCharacter = allCharacters.find(c => c.id === selectedCharacterId);
  const characterSpells = selectedCharacter?.characterSpells;

  // Get available spells for selected character (only prepared ones)
  const availableSpells = characterSpells?.spells.filter(spell => spell.prepared) || [];
  const availableCantrips = characterSpells?.cantrips.filter(cantrip => cantrip.prepared) || [];

  // Check if character has available spell slots
  const hasAvailableSlot = (level: number) => {
    // Truques (nível 0) não precisam de slots - sempre disponíveis
    if (level === 0) return true;
    
    if (!characterSpells) return false;
    const slot = characterSpells.spellSlots.find(s => s.level === level);
    return slot ? slot.used < slot.total : false;
  };

  // Get slot availability text
  const getSlotText = (level: number) => {
    if (!characterSpells) return "0/0";
    const slot = characterSpells.spellSlots.find(s => s.level === level);
    return slot ? `${slot.total - slot.used}/${slot.total}` : "0/0";
  };

  // Get relevant ability modifier for spell
  const getSpellAbilityMod = (spell: Spell) => {
    if (!selectedCharacter) return 0;
    
    // Default to spellcasting ability based on class
    const className = selectedCharacter.className.toLowerCase();
    let ability: keyof typeof selectedCharacter.abilities = 'int';
    
    if (className.includes('clérigo') || className.includes('druida') || className.includes('paladino')) {
      ability = 'wis';
    } else if (className.includes('bardo') || ('bruxo') || ('sorc')) {
      ability = 'cha';
    }
    
    return abilityMod(selectedCharacter.abilities[ability]);
  };

  // Function to execute spell cast with animation
  const executeCastWithAnimation = (castFunction: () => void, formula: string = "1d20") => {
    setCurrentFormula(formula);
    setIsRolling(true);
    setTimeout(() => {
      castFunction();
      setIsRolling(false);
    }, 1500); // 1.5 segundos para animação dos dados
  };

  // Cast spell with synchronization
  const castSpellAction = async (spell: Spell) => {
    if (!selectedCharacter || !characterSpells || !hasAvailableSlot(spell.level)) {
      return;
    }

    // Determine dice formula based on spell
    let spellFormula = "1d20";
    if (spell.id === 'fireBolt') spellFormula = "1d10";
    else if (spell.id === 'magicMissile') spellFormula = "3d4";
    else if (spell.id === 'fireball') spellFormula = "8d6";
    else if (spell.id === 'scorchingRay') spellFormula = "6d6";
    else if (spell.id === 'lightningBolt') spellFormula = "8d6";
    else if (spell.id === 'coneOfCold') spellFormula = "12d8";

    executeCastWithAnimation(async () => {
      setIsCasting(true);

      try {
        // 1. Calculate spellcasting ability
        const spellcastingInfo = calculateSpellcastingAbility(selectedCharacter);
        const proficiencyBonus = Math.floor((selectedCharacter.level + 7) / 4); // Simplified proficiency bonus

        // 2. Create caster object
        const caster = {
          spellcastingAbility: spellcastingInfo.ability,
          spellcastingModifier: spellcastingInfo.modifier,
          proficiencyBonus: proficiencyBonus,
          level: selectedCharacter.level,
        };

        // 3. Cast the spell with proper mechanics
        const spellResult = castSpell(spell, caster, []);

        // 4. Consume spell slot (if not a cantrip)
        let updatedSpellSlots = [...characterSpells.spellSlots];
        if (spell.level > 0) {
        const slotIndex = updatedSpellSlots.findIndex(s => s.level === spell.level);
        
        if (slotIndex !== -1) {
          updatedSpellSlots[slotIndex] = {
            ...updatedSpellSlots[slotIndex],
            used: updatedSpellSlots[slotIndex].used + 1
          };
        }
      }

      // 5. Create spell cast record
      const spellRoll: DiceRoll = {
        id: crypto.randomUUID(),
        playerId: selectedCharacter.id,
        playerName: selectedCharacter.name || "Personagem sem nome",
        characterName: selectedCharacter.name || "Personagem sem nome",
        type: 'spell',
        label: spell.name,
        formula: spell.level > 0 ? `Nível ${spell.level}` : "Truque",
        result: spellResult.damage || spellResult.healing || 0,
        details: spellResult.description,
        timestamp: new Date()
      };

      // 6. Add to session (synchronized)
      const currentSession = localStorage.getItem('currentSession');
      if (currentSession) {
        try {
          await addRollToSession(currentSession, spellRoll);
          
          // Disparar evento com a rolagem para atualização imediata
          window.dispatchEvent(new CustomEvent('newRoll', { detail: spellRoll }));
          console.log('Spell roll dispatched:', spellRoll);
        } catch (error) {
          console.error('Error adding spell cast to session:', error);
        }
      }

      // 7. Update character's spell slots
      const updatedCharacter = {
        ...selectedCharacter,
        characterSpells: {
          ...characterSpells,
          spellSlots: updatedSpellSlots
        }
      };

      // For session characters, update via session
      if (selectedCharacter.source === 'session') {
        const sessionCode = localStorage.getItem('currentSession');
        if (sessionCode) {
          const { updateSession, getSession } = await import('@/lib/supabase');
          const session = await getSession(sessionCode);
          if (session && session.characters) {
            const updatedCharacters = session.characters.map((c: Character) => 
              c.id === selectedCharacter.id ? updatedCharacter : c
            );
            await updateSession(sessionCode, { characters: updatedCharacters });
          }
        }
      }

      // 8. Update last cast with proper RollResult format
      const damageOrHealing = spellResult.damage || spellResult.healing;
      const rollResult: RollResult = {
        total: damageOrHealing || 0,
        rolls: spellResult.damageRolls || spellResult.healingRolls || [],
        modifier: spellcastingInfo.modifier,
        formula: spell.name,
        details: spellResult.description
      };

    } catch (error) {
      console.error('Error casting spell:', error);
    } finally {
      setIsCasting(false);
    }
    }, spellFormula);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--app-surface)] rounded-2xl border border-[var(--app-border)] p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[var(--app-fg)]">🔮 Lançar Magia</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Character Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-[var(--app-fg)] mb-2">
            Personagem
          </label>
          <select
            value={selectedCharacterId}
            onChange={(e) => setSelectedCharacterId(e.target.value)}
            className="w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-bg)] px-3 py-2 text-[var(--app-fg)]"
          >
            <option value="">Selecione um personagem</option>
            {sessionCharacters.length > 0 && (
              <optgroup label="📋 Fichas na Sessão">
                {sessionCharacters.map(char => (
                  <option key={`session-${char.id}`} value={char.id}>
                    {char.name} ({char.className} Nível {char.level})
                  </option>
                ))}
              </optgroup>
            )}
            {localCharacters.length > 0 && (
              <optgroup label="📂 Fichas Locais">
                {localCharacters.map(char => (
                  <option key={`local-${char.id}`} value={char.id}>
                    {char.name} ({char.className} Nível {char.level})
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>

        {/* Spell Slots Status */}
        {selectedCharacter && characterSpells && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-[var(--app-fg)] mb-2">
              Slots de Magia Disponíveis
            </label>
            <div className="grid grid-cols-9 gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(level => {
                const slotText = getSlotText(level);
                const hasSlot = hasAvailableSlot(level);
                return (
                  <div
                    key={level}
                    className={`text-center p-2 rounded text-xs ${
                      hasSlot 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}
                  >
                    <div className="font-medium">{level}º</div>
                    <div>{slotText}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Available Spells */}
        {selectedCharacter && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-[var(--app-fg)] mb-2">
              Magias Preparadas
            </label>
            <div className="grid gap-2 max-h-64 overflow-y-auto">
              {availableSpells.length === 0 && availableCantrips.length === 0 ? (
                <div className="text-center py-4 text-[var(--app-muted)]">
                  <p className="text-sm">Nenhuma magia preparada</p>
                  <p className="text-xs mt-1">Prepare magias na ficha do personagem primeiro</p>
                </div>
              ) : (
                <>
                  {availableSpells.map((spell: Spell) => {
                    const canCast = hasAvailableSlot(spell.level);
                    return (
                      <div
                        key={spell.id}
                        className={`border rounded-lg p-3 transition-colors ${
                          'border-[var(--app-border)] bg-[var(--app-bg])'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium text-[var(--app-fg)]">{spell.name}</div>
                            <div className="text-sm text-[var(--app-muted)]">
                              {spell.level}º círculo • {spell.school}
                            </div>
                            <div className="text-sm text-purple-400">
                              Tempo: {spell.castingTime} • Alcance: {spell.range}
                            </div>
                            {spell.description && (
                              <div className="text-xs text-[var(--app-muted)] mt-1">
                                {spell.description}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => canCast && castSpellAction(spell)}
                            disabled={!canCast || isCasting}
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                              canCast
                                ? 'bg-purple-500 text-white hover:bg-purple-600'
                                : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                            } ${isCasting ? 'opacity-50' : ''}`}
                          >
                            {canCast ? `Lançar (${getSlotText(spell.level)})` : 'Sem slots'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  
                  {availableCantrips.map((cantrip: Spell) => (
                    <div
                      key={cantrip.id}
                      className={`border rounded-lg p-3 transition-colors ${
                        'border-[var(--app-border)] bg-[var(--app-bg)]'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-[var(--app-fg)]">{cantrip.name}</div>
                          <div className="text-sm text-[var(--app-muted)]">
                            Truque • {cantrip.school}
                          </div>
                          <div className="text-sm text-blue-400">
                            Tempo: {cantrip.castingTime} • Alcance: {cantrip.range}
                          </div>
                          {cantrip.description && (
                            <div className="text-xs text-[var(--app-muted)] mt-1">
                              {cantrip.description}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => castSpellAction(cantrip)}
                          disabled={isCasting}
                          className={`px-3 py-1 rounded text-sm font-medium transition-colors bg-blue-500 text-white hover:bg-blue-600 ${isCasting ? 'opacity-50' : ''}`}
                        >
                          Lançar
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}

        {!selectedCharacter && (
          <div className="text-center py-8 text-[var(--app-muted)]">
            <div className="text-4xl mb-2">🔮</div>
            <p className="text-sm">Selecione um personagem para ver suas magias</p>
          </div>
        )}
      </div>
      <DiceAnimation 
        formula={currentFormula}
        isRolling={isRolling}
      />
    </div>
  );
}
