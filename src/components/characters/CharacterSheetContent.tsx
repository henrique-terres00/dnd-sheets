"use client";

import Link from "next/link";
import { useMemo } from "react";
import { abilityMod, formatSigned, proficiencyBonusFromLevel, SKILL_TO_ABILITY } from "@/lib/dnd5e";
import { getSrdClass, getSrdRace, SRD_CLASSES, SRD_RACES } from "@/lib/srd";
import { CharacterEquipment } from "@/components/equipment/CharacterEquipment";
import { CharacterSpells } from "@/components/spells/CharacterSpells";
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

export default function CharacterSheetContent({ 
  character, 
  onUpdate 
}: { 
  character: Character; 
  onUpdate: (character: Character) => void | Promise<void>;
}) {
  const pb = useMemo(() => {
    return character.proficiencyBonusOverride ?? proficiencyBonusFromLevel(character.level);
  }, [character]);

  const initiative = useMemo(() => {
    const dex = abilityMod(character.abilities.dex);
    return character.initiativeOverride ?? dex;
  }, [character]);

  const passivePerception = useMemo(() => {
    const wis = abilityMod(character.abilities.wis);
    const prof = character.skillProficiencies.perception ? pb : 0;
    return 10 + wis + prof;
  }, [character, pb]);

  const calculatedAC = useMemo(() => {
    return calculateArmorClass(
      character.characterEquipment?.armor || null,
      character.characterEquipment?.shield || null,
      character.abilities.dex
    );
  }, [character]);

  const update = (patch: Partial<Character>) => {
    const next: Character = { ...character, ...patch };
    onUpdate(next);
  };

  const updateAll = (next: Character) => {
    onUpdate(next);
  };

  const updateNested = <K extends keyof Character>(key: K, value: Character[K]) => {
    update({ [key]: value } as Partial<Character>);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="text-xs text-[var(--app-muted)]">Ficha da Sessão (5e 2014)</div>
          <h1 className="truncate text-xl font-semibold tracking-tight">{character.name || "(Sem nome)"}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/session"
            className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-2 text-sm font-medium text-[var(--app-fg)] hover:bg-[var(--app-border)]"
          >
            Voltar para Sessão
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <div className={boxClass()}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
                <select
                  className={inputClass()}
                  value={character.classKey ?? "custom"}
                  onChange={(e) => {
                    const key = e.target.value === "custom" ? undefined : e.target.value;
                    if (!key) {
                      updateAll({ ...character, className: "", classKey: undefined });
                      return;
                    }
                    const cls = getSrdClass(key);
                    const nextSaving: Record<Ability, boolean> = {
                      ...character.savingThrowProficiencies,
                    };
                    (Object.keys(nextSaving) as Ability[]).forEach((a) => {
                      nextSaving[a] = Boolean(cls?.savingThrowProficiencies.includes(a));
                    });
                    updateAll({
                      ...character,
                      classKey: key,
                      className: cls?.label ?? character.className,
                      savingThrowProficiencies: nextSaving,
                    });
                  }}
                >
                  <option value="custom">Personalizado</option>
                  {SRD_CLASSES.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </select>
                {character.classKey ? null : (
                  <input
                    className={`${inputClass()} mt-2`}
                    placeholder="Digite a classe"
                    value={character.className}
                    onChange={(e) => update({ className: e.target.value })}
                  />
                )}
              </div>
              <div>
                <div className={labelClass()}>Nível</div>
                <input
                  className={inputClass()}
                  type="number"
                  min={1}
                  max={20}
                  value={character.level}
                  onChange={(e) => update({ level: Number(e.target.value) || 1 })}
                />
              </div>
              <div>
                <div className={labelClass()}>Raça</div>
                <select
                  className={inputClass()}
                  value={character.raceKey ?? "custom"}
                  onChange={(e) => {
                    const key = e.target.value === "custom" ? undefined : e.target.value;
                    const race = getSrdRace(key);
                    updateAll({
                      ...character,
                      raceKey: key,
                      race: race?.label ?? character.race,
                      speed: race?.speed ?? character.speed,
                    });
                  }}
                >
                  <option value="custom">Personalizado</option>
                  {SRD_RACES.map((r) => (
                    <option key={r.key} value={r.key}>
                      {r.label}
                    </option>
                  ))}
                </select>
                {character.raceKey ? null : (
                  <input
                    className={`${inputClass()} mt-2`}
                    placeholder="Digite a raça"
                    value={character.race}
                    onChange={(e) => update({ race: e.target.value })}
                  />
                )}
              </div>
              <div>
                <div className={labelClass()}>Antecedente</div>
                <input
                  className={inputClass()}
                  value={character.background}
                  onChange={(e) => update({ background: e.target.value })}
                />
              </div>
              <div>
                <div className={labelClass()}>Alinhamento</div>
                <input
                  className={inputClass()}
                  value={character.alignment}
                  onChange={(e) => update({ alignment: e.target.value })}
                />
              </div>
              <div>
                <div className={labelClass()}>Pontos de vida</div>
                <input
                  className={inputClass()}
                  type="number"
                  min={0}
                  value={character.currentHp}
                  onChange={(e) => update({ currentHp: Number(e.target.value) || 0 })}
                />
              </div>
              <div>
                <div className={labelClass()}>Pontos de vida máximos</div>
                <input
                  className={inputClass()}
                  type="number"
                  min={1}
                  value={character.maxHp}
                  onChange={(e) => update({ maxHp: Number(e.target.value) || 1 })}
                />
              </div>
              <div>
                <div className={labelClass()}>Pontos de vida temporários</div>
                <input
                  className={inputClass()}
                  type="number"
                  min={0}
                  value={character.tempHp}
                  onChange={(e) => update({ tempHp: Number(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>

          <div className={boxClass()}>
            <h3 className="text-lg font-semibold mb-4">Atributos</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {ABILITIES.map((ability) => (
                <div key={ability.key} className="text-center">
                  <div className={labelClass()}>{ability.label}</div>
                  <input
                    className={`${inputClass()} text-center`}
                    type="number"
                    min={1}
                    max={20}
                    value={character.abilities[ability.key]}
                    onChange={(e) => {
                      const value = Number(e.target.value) || 1;
                      updateNested("abilities", {
                        ...character.abilities,
                        [ability.key]: value,
                      });
                    }}
                  />
                  <div className="text-sm text-[var(--app-muted)] mt-1">
                    {formatSigned(abilityMod(character.abilities[ability.key]))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={boxClass()}>
            <h3 className="text-lg font-semibold mb-4">Perícias</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {SKILLS.map((skill) => (
                <div key={skill.key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`skill-${skill.key}`}
                    checked={character.skillProficiencies[skill.key]}
                    onChange={(e) => {
                      updateNested("skillProficiencies", {
                        ...character.skillProficiencies,
                        [skill.key]: e.target.checked,
                      });
                    }}
                  />
                  <div className="flex-1">
                    <label htmlFor={`skill-${skill.key}`} className={labelClass()}>
                      {skill.label}
                    </label>
                    <div className="text-sm text-[var(--app-muted)]">
                      {formatSigned(
                        abilityMod(character.abilities[SKILL_TO_ABILITY[skill.key]]) +
                          (character.skillProficiencies[skill.key] ? pb : 0)
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={boxClass()}>
            <h3 className="text-lg font-semibold mb-4">Salvaguardas</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {ABILITIES.map((ability) => (
                <div key={ability.key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`save-${ability.key}`}
                    checked={character.savingThrowProficiencies[ability.key]}
                    onChange={(e) => {
                      updateNested("savingThrowProficiencies", {
                        ...character.savingThrowProficiencies,
                        [ability.key]: e.target.checked,
                      });
                    }}
                  />
                  <label htmlFor={`save-${ability.key}`} className={labelClass()}>
                    {ability.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className={boxClass()}>
            <h3 className="text-lg font-semibold mb-4">Ataques e Magias</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className={labelClass()}>Bônus de proficiência</div>
                <input
                  className={inputClass()}
                  type="number"
                  value={pb}
                  onChange={(e) => update({ proficiencyBonusOverride: Number(e.target.value) || 0 })}
                />
              </div>
              <div>
                <div className={labelClass()}>Iniciativa</div>
                <input
                  className={inputClass()}
                  type="number"
                  value={initiative}
                  onChange={(e) => update({ initiativeOverride: Number(e.target.value) })}
                />
              </div>
              <div>
                <div className={labelClass()}>Classe de armadura</div>
                <input
                  className={inputClass()}
                  type="number"
                  value={character.armorClass}
                  onChange={(e) => update({ armorClass: Number(e.target.value) })}
                />
              </div>
              <div>
                <div className={labelClass()}>Percepção passiva</div>
                <input
                  className={inputClass()}
                  type="number"
                  value={passivePerception}
                  onChange={(e) => update({ armorClass: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>

          <CharacterEquipment character={character} onUpdate={update} />
          <CharacterSpells character={character} onUpdate={(spells) => update({ characterSpells: spells })} />
        </div>

        <div className="flex flex-col gap-4">
          <div className={boxClass()}>
            <h3 className="text-lg font-semibold mb-4">Resumo</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--app-muted)]">PV</span>
                <span>{character.currentHp}/{character.maxHp}</span>
              </div>
              {character.tempHp > 0 && (
                <div className="flex justify-between">
                  <span className="text-[var(--app-muted)]">PV Temporários</span>
                  <span>+{character.tempHp}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[var(--app-muted)]">CA</span>
                <span>{character.armorClass}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--app-muted)]">Iniciativa</span>
                <span>{formatSigned(initiative)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--app-muted)]">Percepção Passiva</span>
                <span>{passivePerception}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--app-muted)]">Bônus de Proficiência</span>
                <span>+{pb}</span>
              </div>
            </div>
          </div>

          <div className={boxClass()}>
            <h3 className="text-lg font-semibold mb-4">Personalidade</h3>
            <div className="space-y-3">
              <div>
                <div className={labelClass()}>Traços de personalidade</div>
                <textarea
                  className={inputClass()}
                  rows={3}
                  value={character.personalityTraits}
                  onChange={(e) => update({ personalityTraits: e.target.value })}
                />
              </div>
              <div>
                <div className={labelClass()}>Ideais</div>
                <textarea
                  className={inputClass()}
                  rows={2}
                  value={character.ideals}
                  onChange={(e) => update({ ideals: e.target.value })}
                />
              </div>
              <div>
                <div className={labelClass()}>Vínculos</div>
                <textarea
                  className={inputClass()}
                  rows={2}
                  value={character.bonds}
                  onChange={(e) => update({ bonds: e.target.value })}
                />
              </div>
              <div>
                <div className={labelClass()}>Defeitos</div>
                <textarea
                  className={inputClass()}
                  rows={2}
                  value={character.flaws}
                  onChange={(e) => update({ flaws: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className={boxClass()}>
            <h3 className="text-lg font-semibold mb-4">Aparência e História</h3>
            <div className="space-y-3">
              <div>
                <div className={labelClass()}>Aparência</div>
                <textarea
                  className={inputClass()}
                  rows={3}
                  value={character.appearance}
                  onChange={(e) => update({ appearance: e.target.value })}
                />
              </div>
              <div>
                <div className={labelClass()}>História</div>
                <textarea
                  className={inputClass()}
                  rows={4}
                  value={character.backstory}
                  onChange={(e) => update({ backstory: e.target.value })}
                />
              </div>
              <div>
                <div className={labelClass()}>Aliados e Organizações</div>
                <textarea
                  className={inputClass()}
                  rows={2}
                  value={character.alliesAndOrganizations}
                  onChange={(e) => update({ alliesAndOrganizations: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className={boxClass()}>
            <h3 className="text-lg font-semibold mb-4">Tesouro e Equipamento</h3>
            <div className="space-y-3">
              <div>
                <div className={labelClass()}>Equipamento</div>
                <textarea
                  className={inputClass()}
                  rows={4}
                  value={character.equipment}
                  onChange={(e) => update({ equipment: e.target.value })}
                />
              </div>
              <div>
                <div className={labelClass()}>Tesouro</div>
                <textarea
                  className={inputClass()}
                  rows={2}
                  value={character.treasure}
                  onChange={(e) => update({ treasure: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
