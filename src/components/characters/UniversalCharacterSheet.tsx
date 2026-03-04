"use client";

import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { abilityMod, formatSigned, proficiencyBonusFromLevel, SKILL_TO_ABILITY, isSkillAvailableForClass, getSelectedSkillCount, canChooseMoreSkills, CLASS_SKILL_COUNT } from "@/lib/dnd5e";
import { getCharacter, upsertCharacter } from "@/lib/characterStore";
import { getSrdClass, getSrdRace, SRD_CLASSES, SRD_RACES } from "@/lib/srd";
import { CharacterEquipment } from "@/components/equipment/CharacterEquipment";
import { UniversalCharacterSpells } from "@/components/spells/UniversalCharacterSpells";
import { calculateArmorClass } from "@/lib/equipmentUtils";
import { getSession, updateSession } from "@/lib/supabase";
import type { CharacterSpellsState } from "@/lib/spells";
import type { Ability, Character, Skill } from "@/lib/types";

const ABILITIES: { key: Ability; label: string }[] = [
  { key: "str", label: "Força" },
  { key: "dex", label: "Destreza" },
  { key: "con", label: "Constituição" },
  { key: "int", label: "Inteligência" },
  { key: "wis", label: "Sabedoria" },
  { key: "cha", label: "Carisma" },
];

const SKILLS: { key: Skill; label: string }[] = [
  { key: "athletics", label: "Atletismo" },
  { key: "acrobatics", label: "Acrobacia" },
  { key: "sleightOfHand", label: "Prestidigitação" },
  { key: "stealth", label: "Furtividade" },
  { key: "arcana", label: "Arcanismo" },
  { key: "history", label: "História" },
  { key: "investigation", label: "Investigação" },
  { key: "nature", label: "Natureza" },
  { key: "religion", label: "Religião" },
  { key: "animalHandling", label: "Adestrar Animais" },
  { key: "insight", label: "Intuição" },
  { key: "medicine", label: "Medicina" },
  { key: "perception", label: "Percepção" },
  { key: "survival", label: "Sobrevivência" },
  { key: "deception", label: "Enganação" },
  { key: "intimidation", label: "Intimidação" },
  { key: "performance", label: "Performance" },
  { key: "persuasion", label: "Persuasão" },
];

function inputClass() {
  return "w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-fg)] shadow-sm outline-none focus:border-[var(--app-border)] [color-scheme:dark]";
}

function labelClass() {
  return "text-xs font-medium text-[var(--app-muted)]";
}

function boxClass() {
  return "rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-sm";
}

function emptyAppliedBonuses(): Partial<Record<Ability, number>> {
  return {};
}

function computeRaceBonuses(
  raceKey: string | undefined,
  choices: Partial<Record<Ability, boolean>> | undefined,
): Partial<Record<Ability, number>> {
  const race = getSrdRace(raceKey);
  if (!race) return emptyAppliedBonuses();

  const bonuses: Partial<Record<Ability, number>> = { ...race.baseBonuses };
  if (race.choice) {
    const picked = race.choice.allowed.filter((a) => Boolean(choices?.[a]));
    for (const a of picked.slice(0, race.choice.picks)) {
      bonuses[a] = (bonuses[a] ?? 0) + race.choice.bonus;
    }
  }
  return bonuses;
}

function applyRaceChange(character: Character, nextRaceKey: string | undefined) {
  const prevBonuses = character.raceAppliedBonuses ?? emptyAppliedBonuses();
  const nextBonuses = computeRaceBonuses(nextRaceKey, (character as any).raceChoices);
  const abilities = { ...character.abilities };
  for (const [ability, delta] of Object.entries(prevBonuses)) {
    abilities[ability as Ability] = Math.max(1, (abilities[ability as Ability] ?? 0) - delta);
  }
  for (const [ability, delta] of Object.entries(nextBonuses)) {
    abilities[ability as Ability] = (abilities[ability as Ability] ?? 0) + delta;
  }
  return {
    ...character,
    abilities,
    raceKey: nextRaceKey,
    raceAppliedBonuses: nextBonuses,
  };
}

interface UniversalCharacterSheetProps {
  id: string;
  isSession?: boolean;
  sessionCode?: string;
}

export default function UniversalCharacterSheet({ id, isSession = false, sessionCode }: UniversalCharacterSheetProps) {
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Debounce refs para text inputs
  const debounceRefs = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const localStateRef = useRef<{ [key: string]: string }>({});

  // Função debounced para atualizações de text inputs
  const debouncedUpdate = useCallback((updates: Partial<Character>, debounceKey: string = 'default') => {
    // Cancelar debounce anterior para este campo
    if (debounceRefs.current[debounceKey]) {
      clearTimeout(debounceRefs.current[debounceKey]);
    }

    // Atualizar estado local imediatamente para UI responsiva
    if (character) {
      const updatedCharacter = { ...character, ...updates };
      setCharacter(updatedCharacter);
      
      // Salvar estado local para possível recuperação
      Object.keys(updates).forEach(key => {
        const value = updates[key as keyof Character];
        if (typeof value === 'string') {
          localStateRef.current[key] = value;
        }
      });
    }

    // Agendar salvamento no banco com debounce reduzido (500ms)
    debounceRefs.current[debounceKey] = setTimeout(async () => {
      try {
        await update(updates);
        // Limpar estado local após salvamento bem-sucedido
        Object.keys(updates).forEach(key => {
          delete localStateRef.current[key];
        });
      } catch (error) {
        console.error('Error in debounced update:', error);
      }
    }, 500); // Reduzido para 500ms
  }, [character]);

  const handleBackToSession = async () => {
    // Limpar todos os timeouts pendentes imediatamente
    Object.values(debounceRefs.current).forEach(timeout => {
      if (timeout) clearTimeout(timeout);
    });
    debounceRefs.current = {};

    // Forçar salvamento final se houver mudanças pendentes
    if (character && Object.keys(localStateRef.current).length > 0) {
      try {
        await update(localStateRef.current);
      } catch (error) {
        console.error('Error in final save before navigation:', error);
      }
    }

    // Navegar imediatamente
    if (isSession && sessionCode) {
      router.push(`/session/${sessionCode.toUpperCase()}`);
    } else {
      router.push('/characters');
    }
  };

  const session = searchParams.get('session');

  // Load character otimizado - sem imports dinâmicos
  const loadCharacter = async () => {
    try {
      // Check if this is a draft character
      const isDraft = searchParams.get('draft') === '1';
      
      if (isDraft && !isSession) {
        // Load from sessionStorage for drafts
        try {
          const draftData = window.sessionStorage.getItem(`dnd-sheets.character-draft.${id}`);
          if (draftData) {
            const draftCharacter = JSON.parse(draftData);
            setCharacter(draftCharacter);
          } else {
            // If no draft found, try normal character
            const loadedCharacter = await getCharacter(id);
            setCharacter(loadedCharacter);
          }
        } catch (sessionError) {
          // Fallback to normal character
          const loadedCharacter = await getCharacter(id);
          setCharacter(loadedCharacter);
        }
      } else if (isSession && session) {
        // Load from session - sem import dinâmico
        const sessionData = await getSession(session);
        if (sessionData && sessionData.characters) {
          const foundCharacter = sessionData.characters.find((c: Character) => c.id === id);
          setCharacter(foundCharacter || null);
        }
      } else {
        // Load from local storage
        const loadedCharacter = await getCharacter(id);
        setCharacter(loadedCharacter);
      }
    } catch (error) {
      console.error('Error loading character:', error);
      setCharacter(null);
    } finally {
      setLoading(false);
    }
  };

  // Cleanup dos timeouts quando o componente for desmontado
  useEffect(() => {
    return () => {
      // Limpar todos os timeouts pendentes
      Object.values(debounceRefs.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
      debounceRefs.current = {};
      console.log('Debounce timeouts cleaned up');
    };
  }, []);

  // useEffect otimizado - carregar apenas quando necessário
  useEffect(() => {
    loadCharacter();
  }, [id, isSession, session]); // Dependências específicas

  // useEffect otimizado para drafts - evitar múltiplas chamadas
  useEffect(() => {
    const isDraft = searchParams.get('draft') === '1';
    if (isDraft && !isSession) {
      loadCharacter();
    }
  }, [searchParams.get('draft')]); // Apenas o draft mudou

  // useEffect para sincronizar alterações da sessão com ficha local
  useEffect(() => {
    const handleSessionCharacterUpdate = (event: any) => {
      if (event.detail && event.detail.characterId === id) {
        loadCharacter();
      }
    };

    window.addEventListener('sessionCharacterUpdated', handleSessionCharacterUpdate);
    
    return () => {
      window.removeEventListener('sessionCharacterUpdated', handleSessionCharacterUpdate);
    };
  }, [id, loadCharacter]);

  // Save draft character as permanent
  const saveDraftAsCharacter = async () => {
    if (!character) return;
    
    const isDraft = searchParams.get('draft') === '1';
    if (!isDraft) return; // Only save if it's a draft
    
    try {
      // Save to local storage as permanent character
      await upsertCharacter(character);
      
      // Remove from sessionStorage
      try {
        window.sessionStorage.removeItem(`dnd-sheets.character-draft.${id}`);
      } catch (sessionError) {
        console.log('Could not remove from sessionStorage');
      }
      
      // Redirect to normal character page
      window.location.href = `/characters/${id}`;
    } catch (error) {
      console.error('Error saving character:', error);
      alert('Erro ao salvar personagem');
    }
  };

  const update = async (updates: Partial<Character>) => {
    if (!character) return;

    const updatedCharacter = { ...character, ...updates };
    const isDraft = searchParams.get('draft') === '1';
    
    setCharacter(updatedCharacter);
    
    try {
      if (isDraft && !isSession) {
        // Save to sessionStorage for drafts
        try {
          window.sessionStorage.setItem(`dnd-sheets.character-draft.${id}`, JSON.stringify(updatedCharacter));
        } catch (sessionError) {
          console.error('Failed to save draft to sessionStorage:', sessionError);
        }
      } else if (isSession && session) {
        // Save to session
        const sessionData = await getSession(session);
        if (sessionData && sessionData.characters) {
          const updatedCharacters = sessionData.characters.map((c: Character) => 
            c.id === id ? updatedCharacter : c
          );
          await updateSession(session, { characters: updatedCharacters });
        }
        
        try {
          const { upsertCharacter } = await import('@/lib/characterStore');
          await upsertCharacter(updatedCharacter);
          
          window.dispatchEvent(new CustomEvent('sessionCharacterUpdated', {
            detail: { characterId: id }
          }));
        } catch (error) {
          console.log('Local character not found, only session updated');
        }
      } else {
        await upsertCharacter(updatedCharacter);
        
        const currentSession = localStorage.getItem('currentSession');
        if (currentSession) {
          try {
            const sessionData = await getSession(currentSession);
            if (sessionData && sessionData.characters) {
              const updatedSessionCharacters = sessionData.characters.map((c: Character) => 
                c.id === id ? updatedCharacter : c
              );
              await updateSession(currentSession, { characters: updatedSessionCharacters });
              
              window.dispatchEvent(new CustomEvent('localCharacterUpdated', {
                detail: { characterId: id, sessionCode: currentSession }
              }));
            }
          } catch (error) {
            console.log('Session not found or error syncing to session:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error updating character:', error);
      setCharacter(character);
    }
  };

  const pb = useMemo(() => {
    return character?.proficiencyBonusOverride ?? proficiencyBonusFromLevel(character?.level || 1);
  }, [character]);

  const initiative = useMemo(() => {
    if (!character) return 0;
    const dex = abilityMod(character.abilities.dex);
    return character.initiativeOverride ?? dex;
  }, [character]);

  const passivePerception = useMemo(() => {
    if (!character) return 0;
    const wis = abilityMod(character.abilities.wis);
    const prof = character.skillProficiencies.perception ? pb : 0;
    return 10 + wis + prof;
  }, [character, pb]);

  // Auto-update proficiency bonus when level changes
  useEffect(() => {
    if (character && !character.proficiencyBonusOverride) {
      const newPb = proficiencyBonusFromLevel(character.level);
      console.log('Level:', character.level, 'PB:', newPb);
      // Only update if different to avoid infinite loops
      const currentPb = proficiencyBonusFromLevel(character.level || 1);
      if (newPb !== currentPb) {
        console.log('Level changed, updating derived values');
      }
    }
  }, [character?.level]);

  const calculatedAC = useMemo(() => {
    if (!character) return 10;
    return calculateArmorClass(
      character.characterEquipment?.armor || null,
      character.characterEquipment?.shield || null,
      character.abilities.dex
    );
  }, [character]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-2xl mb-4">🎲</div>
        <p className="text-[var(--app-muted)]">Carregando ficha...</p>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="flex flex-col gap-3">
        <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-sm">
          <div className="text-sm text-[var(--app-muted)]">Personagem não encontrado.</div>
        </div>
        <div>
          <button 
            className="text-sm font-medium underline hover:text-[var(--app-fg)]"
            onClick={() => router.push(isSession && sessionCode ? `/session/${sessionCode.toUpperCase()}` : "/characters")}
          >
            Voltar para {isSession ? "Sessão" : "Personagens"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="text-xs text-[var(--app-muted)]">Ficha {isSession ? "da Sessão" : "Local"} (5e 2014)</div>
          {searchParams.get('draft') === '1' && !isSession && (
            <div className="text-xs text-orange-500 font-medium mb-1">⚠️ Rascunho - Não salvo</div>
          )}
          <h1 className="truncate text-xl font-semibold tracking-tight">{character.name || "(Sem nome)"}</h1>
        </div>
        <div className="flex items-center gap-2">
          {searchParams.get('draft') === '1' && !isSession && (
            <button
              onClick={saveDraftAsCharacter}
              className="rounded-xl border border-green-500 bg-green-500/10 px-4 py-2 text-sm font-medium text-green-500 hover:bg-green-500/20 transition-colors"
            >
              Salvar
            </button>
          )}
          <button
            onClick={handleBackToSession}
            className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-2 text-sm font-medium text-[var(--app-fg)] hover:bg-[var(--app-border)] transition-colors"
          >
            Voltar para {isSession ? "Sessão" : "Personagens"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <div className={boxClass()}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <div className={labelClass()}>Imagem do Personagem</div>
                <div className="flex items-center gap-3">
                  {character.avatarDataUrl ? (
                    <div className="flex items-center gap-3">
                      <img 
                        src={character.avatarDataUrl} 
                        alt={character.name || "Personagem"} 
                        className="w-24 h-24 rounded-lg object-cover border border-[var(--app-border)]"
                      />
                      <button
                        type="button"
                        onClick={() => update({ avatarDataUrl: null })}
                        className="rounded-xl border border-red-500 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-500/20"
                      >
                        Remover
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-24 rounded-lg border-2 border-dashed border-[var(--app-border)] flex items-center justify-center text-center">
                        <span className="text-[var(--app-muted)] text-xs">Sem imagem</span>
                      </div>
                      <label className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-2 text-sm font-medium text-[var(--app-fg)] hover:bg-[var(--app-border)] cursor-pointer">
                        Escolher arquivo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                update({ avatarDataUrl: event.target?.result as string });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="sr-only"
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <div className={labelClass()}>Nome do personagem</div>
                <input 
                  className={inputClass()} 
                  value={character.name} 
                  onChange={(e) => debouncedUpdate({ name: e.target.value }, 'name')} 
                />
              </div>
              <div>
                <div className={labelClass()}>Nome do jogador</div>
                <input
                  className={inputClass()}
                  value={character.playerName}
                  onChange={(e) => debouncedUpdate({ playerName: e.target.value }, 'playerName')}
                />
              </div>
              <div>
                <div className={labelClass()}>Classe</div>
                <select className={inputClass()} value={character.classKey} onChange={(e) => update({ classKey: e.target.value })}>
                  <option value="">Selecione...</option>
                  {SRD_CLASSES.map((cls) => (
                    <option key={cls.key} value={cls.key}>
                      {cls.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className={labelClass()}>Raça</div>
                <select className={inputClass()} value={character.raceKey ?? ""} onChange={(e) => update(applyRaceChange(character, e.target.value))}>
                  <option value="">Selecione...</option>
                  {SRD_RACES.map((race) => (
                    <option key={race.key} value={race.key}>
                      {race.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className={labelClass()}>Nível</div>
                <input className={inputClass()} type="number" min="1" max="20" value={character.level} onChange={(e) => update({ level: Number(e.target.value) })} />
              </div>
              <div>
                <div className={labelClass()}>Antecedente</div>
                <input className={inputClass()} value={character.background} onChange={(e) => debouncedUpdate({ background: e.target.value }, 'background')} />
              </div>
            </div>
          </div>

          <div className={boxClass()}>
            <h3 className="text-lg font-semibold mb-4">Atributos</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {ABILITIES.map((ability) => (
                <div key={ability.key} className="text-center">
                  <div className="text-xl font-bold text-[var(--app-fg)]">{character.abilities[ability.key]}</div>
                  <div className="text-xs text-[var(--app-muted)]">{ability.label}</div>
                  <div className="text-sm font-medium text-purple-500">{formatSigned(abilityMod(character.abilities[ability.key]))}</div>
                </div>
              ))}
            </div>
          </div>

          <div className={boxClass()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Perícias</h3>
              <div className="text-xs text-[var(--app-muted)]">
                {character.classKey ? `${getSelectedSkillCount(character)}/${CLASS_SKILL_COUNT[character.classKey] || 0} escolhidas` : ''}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {SKILLS.map((skill) => {
                const isAvailable = isSkillAvailableForClass(skill.key, character.classKey);
                const isSelected = character.skillProficiencies[skill.key] || false;
                const canChoose = canChooseMoreSkills(character) || isSelected;
                
                return (
                  <div 
                    key={skill.key} 
                    className={`flex items-center justify-between p-2 border rounded-lg transition-colors ${
                      isAvailable 
                        ? isSelected 
                          ? 'border-green-500 bg-green-500/10' 
                          : 'border-[var(--app-border)] bg-[var(--app-surface)] hover:bg-[var(--app-bg)]'
                        : 'border-gray-600 bg-gray-900/50 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={!isAvailable || (!canChoose && !isSelected)}
                        onChange={(e) => update({
                          skillProficiencies: {
                            ...character.skillProficiencies,
                            [skill.key]: e.target.checked
                          }
                        })}
                        className={`rounded border-[var(--app-border)] bg-[var(--app-surface)] ${
                          !isAvailable || (!canChoose && !isSelected) ? 'cursor-not-allowed opacity-50' : ''
                        }`}
                      />
                      <span className={`text-sm ${
                        isAvailable ? 'text-[var(--app-fg)]' : 'text-gray-500 line-through'
                      }`}>
                        {skill.label}
                        {!isAvailable && <span className="ml-1 text-xs"></span>}
                      </span>
                    </div>
                    <div className={`text-sm font-medium ${
                      isSelected ? 'text-green-400' : 'text-purple-500'
                    }`}>
                      {formatSigned(abilityMod(character.abilities[SKILL_TO_ABILITY[skill.key]]) + (isSelected ? pb : 0))}
                    </div>
                  </div>
                );
              })}
            </div>
            {!canChooseMoreSkills(character) && (
              <div className="mt-3 text-xs text-orange-400 bg-orange-500/10 p-2 rounded">
                ⚠️ Você já escolheu o máximo de perícias para sua classe ({CLASS_SKILL_COUNT[character.classKey!] || 0})
              </div>
            )}
          </div>

          <div className={boxClass()}>
            <h3 className="text-lg font-semibold mb-4">Combate</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className={labelClass()}>Pontos de Vida</div>
                <input className={inputClass()} type="number" value={character.maxHp} onChange={(e) => update({ maxHp: Number(e.target.value) })} />
              </div>
              <div>
                <div className={labelClass()}>PV Atuais</div>
                <input className={inputClass()} type="number" value={character.currentHp} onChange={(e) => update({ currentHp: Number(e.target.value) })} />
              </div>
              <div>
                <div className={labelClass()}>PV Temporários</div>
                <input className={inputClass()} type="number" value={character.tempHp} onChange={(e) => update({ tempHp: Number(e.target.value) })} />
              </div>
              <div>
                <div className={labelClass()}>Classe de Armadura</div>
                <input
                  className={inputClass()}
                  type="number"
                  value={calculatedAC}
                  onChange={(e) => update({ armorClass: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>

          <div className={boxClass()}>
            <h3 className="text-lg font-semibold mb-4">Outros Valores</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className={labelClass()}>Iniciativa</div>
                <input className={inputClass()} type="number" value={initiative} onChange={(e) => update({ initiativeOverride: Number(e.target.value) })} />
              </div>
              <div>
                <div className={labelClass()}>Bônus de Proficiência</div>
                <input className={inputClass()} type="number" value={pb} onChange={(e) => update({ proficiencyBonusOverride: Number(e.target.value) })} />
              </div>
              <div>
                <div className={labelClass()}>Percepção Passiva</div>
                <input
                  className={inputClass()}
                  type="number"
                  value={passivePerception}
                  readOnly
                />
              </div>
              <div>
                <div className={labelClass()}>Velocidade</div>
                <input className={inputClass()} type="number" value={character.speed} onChange={(e) => update({ speed: Number(e.target.value) })} />
              </div>
            </div>
          </div>

          <div className={boxClass()}>
            <h3 className="text-lg font-semibold mb-4">Salvaguardas</h3>
            <div className="space-y-2">
              {ABILITIES.map((ability) => (
                <div key={ability.key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={character.savingThrowProficiencies[ability.key] || false}
                      onChange={(e) => update({
                        savingThrowProficiencies: {
                          ...character.savingThrowProficiencies,
                          [ability.key]: e.target.checked
                        }
                      })}
                      className="rounded border-[var(--app-border)] bg-[var(--app-surface)]"
                    />
                    <span className="text-sm text-[var(--app-fg)]">{ability.label}</span>
                  </div>
                  <div className="text-sm font-medium text-purple-500">
                    {formatSigned(abilityMod(character.abilities[ability.key]) + (character.savingThrowProficiencies[ability.key] ? pb : 0))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={boxClass()}>
            <h3 className="text-lg font-semibold mb-4">Traços e Habilidades</h3>
            <div className="space-y-2">
              <textarea
                className={inputClass()}
                rows={6}
                placeholder="Descreva os traços e habilidades do personagem..."
                value={character.otherFeaturesAndTraits || ""}
                onChange={(e) => {
                  console.log('Traits onChange (debounced):', e.target.value);
                  debouncedUpdate({ otherFeaturesAndTraits: e.target.value }, 'traits');
                }}
              />
            </div>
          </div>

          <div className={boxClass()}>
            <h3 className="text-lg font-semibold mb-4">Resumo</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--app-muted)]">PV</span>
                <span className="text-[var(--app-fg)]">{character.currentHp}/{character.maxHp}</span>
              </div>
              {character.tempHp > 0 && (
                <div className="flex justify-between">
                  <span className="text-[var(--app-muted)]">PV Temporários</span>
                  <span className="text-[var(--app-fg)]">+{character.tempHp}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[var(--app-muted)]">CA</span>
                <span className="text-[var(--app-fg)]">{calculatedAC}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--app-muted)]">Iniciativa</span>
                <span className="text-[var(--app-fg)]">{formatSigned(initiative)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--app-muted)]">Velocidade</span>
                <span className="text-[var(--app-fg)]">{character.speed} pés</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--app-muted)]">Proficiência</span>
                <span className="text-[var(--app-fg)]">{formatSigned(pb)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--app-muted)]">Percepção Passiva</span>
                <span className="text-[var(--app-fg)]">{passivePerception}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <CharacterEquipment 
            character={character} 
            onUpdate={(equipment) => update({ characterEquipment: equipment })} 
          />
          <UniversalCharacterSpells 
            character={character} 
            onUpdate={(spells: CharacterSpellsState) => update({ characterSpells: spells })} 
          />
          <div className={boxClass()}>
            <h3 className="text-lg font-semibold mb-4">Anotações</h3>
            <div className="space-y-2">
              <textarea
                className={inputClass()}
                rows={6}
                placeholder="Anotações gerais sobre o personagem..."
                value={character.treasure || ""}
                onChange={(e) => {
                  console.log('Notes onChange (debounced):', e.target.value);
                  debouncedUpdate({ treasure: e.target.value }, 'notes');
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
