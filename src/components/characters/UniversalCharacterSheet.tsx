"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { abilityMod, formatSigned, proficiencyBonusFromLevel, SKILL_TO_ABILITY } from "@/lib/dnd5e";
import { getCharacter, upsertCharacter } from "@/lib/characterStore";
import { getSrdClass, getSrdRace, SRD_CLASSES, SRD_RACES } from "@/lib/srd";
import { CharacterEquipment } from "@/components/equipment/CharacterEquipment";
import { UniversalCharacterSpells } from "@/components/spells/UniversalCharacterSpells";
import { calculateArmorClass } from "@/lib/equipmentUtils";
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

  const handleBackToSession = () => {
    if (isSession && sessionCode) {
      router.push(`/session/${sessionCode.toUpperCase()}`);
    } else {
      router.push('/characters');
    }
  };
  const session = searchParams.get('session');

  // Load character
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
        // Load from session
        const { getSession } = await import("@/lib/supabase");
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

  useEffect(() => {
    loadCharacter();
  }, [id, isSession, session]);

  // Reload character when searchParams change (for drafts)
  useEffect(() => {
    if (searchParams.get('draft') === '1') {
      loadCharacter();
    }
  }, [searchParams]);

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

  // Update character
  const update = async (updates: Partial<Character>) => {
    if (!character) return;

    const updatedCharacter = { ...character, ...updates };
    const isDraft = searchParams.get('draft') === '1';
    
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
        const { updateSession, getSession } = await import("@/lib/supabase");
        const sessionData = await getSession(session);
        if (sessionData && sessionData.characters) {
          const updatedCharacters = sessionData.characters.map((c: Character) => 
            c.id === id ? updatedCharacter : c
          );
          await updateSession(session, { characters: updatedCharacters });
        }

        // Also update the original local character if it exists
        try {
          const originalCharacter = await getCharacter(id);
          if (originalCharacter) {
            await upsertCharacter(updatedCharacter);
          }
        } catch (localError) {
          // Local character might not exist, that's ok
          console.log('Local character not found, only session updated');
        }
      } else {
        // Save to local storage
        await upsertCharacter(updatedCharacter);

        // Also update in any active sessions if this character is imported there
        try {
          const currentSession = localStorage.getItem('currentSession');
          if (currentSession) {
            const { getSession, updateSession } = await import("@/lib/supabase");
            const sessionData = await getSession(currentSession);
            if (sessionData && sessionData.characters) {
              const characterInSession = sessionData.characters.find((c: Character) => c.id === id);
              if (characterInSession) {
                const updatedCharacters = sessionData.characters.map((c: Character) => 
                  c.id === id ? updatedCharacter : c
                );
                await updateSession(currentSession, { characters: updatedCharacters });
                console.log('Character also updated in active session');
              }
            }
          }
        } catch (sessionError) {
          console.log('Session update failed, local character updated');
        }
      }
      setCharacter(updatedCharacter);
    } catch (error) {
      console.error('Error updating character:', error);
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
                <input className={inputClass()} value={character.name} onChange={(e) => update({ name: e.target.value })} />
              </div>
              <div>
                <div className={labelClass()}>Nome do jogador</div>
                <input
                  className={inputClass()}
                  value={character.playerName}
                  onChange={(e) => update({ playerName: e.target.value })}
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
                <input className={inputClass()} value={character.background} onChange={(e) => update({ background: e.target.value })} />
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
            <h3 className="text-lg font-semibold mb-4">Perícias</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {SKILLS.map((skill) => (
                <div key={skill.key} className="flex items-center justify-between p-2 border border-[var(--app-border)] rounded-lg">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={character.skillProficiencies[skill.key] || false}
                      onChange={(e) => update({
                        skillProficiencies: {
                          ...character.skillProficiencies,
                          [skill.key]: e.target.checked
                        }
                      })}
                      className="rounded border-[var(--app-border)] bg-[var(--app-surface)]"
                    />
                    <span className="text-sm text-[var(--app-fg)]">{skill.label}</span>
                  </div>
                  <div className="text-sm font-medium text-purple-500">
                    {formatSigned(abilityMod(character.abilities[SKILL_TO_ABILITY[skill.key]]) + (character.skillProficiencies[skill.key] ? pb : 0))}
                  </div>
                </div>
              ))}
            </div>
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
                onChange={(e) => update({ otherFeaturesAndTraits: e.target.value })}
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
                onChange={(e) => update({ treasure: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
