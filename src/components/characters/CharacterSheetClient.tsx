"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { abilityMod, formatSigned, proficiencyBonusFromLevel, SKILL_TO_ABILITY } from "@/lib/dnd5e";
import { getCharacter, upsertCharacter } from "@/lib/characterStore";
import { getSrdClass, getSrdRace, SRD_CLASSES, SRD_RACES } from "@/lib/srd";
import type { Ability, Character, Skill } from "@/lib/types";
import { DiceRoller } from "@/components/dice/DiceRoller";

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
  const nextChoices = nextRaceKey === "halfElf" ? character.raceAbilityChoices ?? {} : undefined;
  const nextBonuses = computeRaceBonuses(nextRaceKey, nextChoices);

  const abilities: Record<Ability, number> = { ...character.abilities };
  (Object.keys(prevBonuses) as Ability[]).forEach((a) => {
    abilities[a] = (abilities[a] ?? 0) - (prevBonuses[a] ?? 0);
  });
  (Object.keys(nextBonuses) as Ability[]).forEach((a) => {
    abilities[a] = (abilities[a] ?? 0) + (nextBonuses[a] ?? 0);
  });

  const race = getSrdRace(nextRaceKey);
  return {
    ...character,
    raceKey: nextRaceKey,
    race: race?.label ?? character.race,
    speed: race?.speed ?? character.speed,
    raceAbilityChoices: nextChoices,
    raceAppliedBonuses: nextBonuses,
    abilities,
  } satisfies Character;
}

function applyHalfElfChoices(character: Character, choices: Partial<Record<Ability, boolean>>) {
  const prevBonuses = character.raceAppliedBonuses ?? emptyAppliedBonuses();
  const nextBonuses = computeRaceBonuses(character.raceKey, choices);

  const abilities: Record<Ability, number> = { ...character.abilities };
  (Object.keys(prevBonuses) as Ability[]).forEach((a) => {
    abilities[a] = (abilities[a] ?? 0) - (prevBonuses[a] ?? 0);
  });
  (Object.keys(nextBonuses) as Ability[]).forEach((a) => {
    abilities[a] = (abilities[a] ?? 0) + (nextBonuses[a] ?? 0);
  });

  return {
    ...character,
    raceAbilityChoices: choices,
    raceAppliedBonuses: nextBonuses,
    abilities,
  } satisfies Character;
}

function applyClassChange(character: Character, nextClassKey: string | undefined) {
  const cls = getSrdClass(nextClassKey);
  const nextSaving: Record<Ability, boolean> = {
    ...character.savingThrowProficiencies,
  };
  (Object.keys(nextSaving) as Ability[]).forEach((a) => {
    nextSaving[a] = Boolean(cls?.savingThrowProficiencies.includes(a));
  });

  const nextSkills = { ...character.skillProficiencies };
  if (cls) {
    const allowed = new Set(cls.skillChoices.options);
    const selectedAllowed = (Object.keys(nextSkills) as Skill[]).filter((k) => nextSkills[k] && allowed.has(k));

    (Object.keys(nextSkills) as Skill[]).forEach((k) => {
      nextSkills[k] = false;
    });

    for (const k of selectedAllowed.slice(0, cls.skillChoices.picks)) {
      nextSkills[k] = true;
    }
  }

  return {
    ...character,
    classKey: nextClassKey,
    className: cls?.label ?? character.className,
    savingThrowProficiencies: nextSaving,
    skillProficiencies: nextSkills,
  } satisfies Character;
}

async function fileToDataUrl(file: File) {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const base64 = btoa(binary);
  return `data:${file.type};base64,${base64}`;
}

export default function CharacterSheetClient({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const initialDraft = searchParams.get("draft") === "1";
  const [isDraft, setIsDraft] = useState<boolean>(initialDraft);

  const [character, setCharacter] = useState<Character | null>(() => {
    if (typeof window === "undefined") return null;
    const fromDraft = (() => {
      if (!initialDraft) return null;
      try {
        const raw = window.sessionStorage.getItem(`dnd-sheets.character-draft.${id}`);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as unknown;
        if (!parsed || typeof parsed !== "object") return null;
        return parsed as Character;
      } catch {
        return null;
      }
    })();
    if (fromDraft) return fromDraft;
    return getCharacter(id);
  });

  const notFound = useMemo(() => {
    if (typeof window === "undefined") return false;
    return character === null;
  }, [character]);

  const pb = useMemo(() => {
    if (!character) return 2;
    return character.proficiencyBonusOverride ?? proficiencyBonusFromLevel(character.level);
  }, [character]);

  const initiative = useMemo(() => {
    if (!character) return 0;
    const dex = abilityMod(character.abilities.dex);
    return character.initiativeOverride ?? dex;
  }, [character]);

  const passivePerception = useMemo(() => {
    if (!character) return 10;
    const wis = abilityMod(character.abilities.wis);
    const prof = character.skillProficiencies.perception ? pb : 0;
    return 10 + wis + prof;
  }, [character, pb]);

  const update = (patch: Partial<Character>) => {
    if (!character) return;
    const next: Character = { ...character, ...patch };
    setCharacter(next);
    if (isDraft) {
      try {
        window.sessionStorage.setItem(`dnd-sheets.character-draft.${id}`, JSON.stringify(next));
      } catch {
        // ignore
      }
      return;
    }
    upsertCharacter(next);
  };

  const updateAll = (next: Character) => {
    setCharacter(next);
    if (isDraft) {
      try {
        window.sessionStorage.setItem(`dnd-sheets.character-draft.${id}`, JSON.stringify(next));
      } catch {
        // ignore
      }
      return;
    }
    upsertCharacter(next);
  };

  const updateNested = <K extends keyof Character>(key: K, value: Character[K]) => {
    update({ [key]: value } as Partial<Character>);
  };

  if (notFound) {
    return (
      <div className="flex flex-col gap-3">
        <div className={boxClass()}>
          <div className="text-sm text-[var(--app-muted)]">Personagem não encontrado.</div>
        </div>
        <div>
          <Link className="text-sm font-medium underline" href="/characters">
            Voltar
          </Link>
        </div>
      </div>
    );
  }

  if (!character) {
    return <div className={boxClass()}>Carregando...</div>;
  }

  const saveDraftToLibrary = () => {
    if (!character) return;
    upsertCharacter(character);
    try {
      window.sessionStorage.removeItem(`dnd-sheets.character-draft.${id}`);
    } catch {
      // ignore
    }
    setIsDraft(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="text-xs text-[var(--app-muted)]">Ficha (5e 2014)</div>
          <h1 className="truncate text-xl font-semibold tracking-tight">{character.name || "(Sem nome)"}</h1>
        </div>
        <div className="flex items-center gap-2">
          {isDraft ? (
            <button
              type="button"
              onClick={saveDraftToLibrary}
              className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-2 text-sm font-medium text-[var(--app-fg)] hover:bg-[var(--app-border)]"
            >
              Salvar personagem
            </button>
          ) : null}
          <Link
            href="/characters"
            className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-2 text-sm font-medium text-[var(--app-fg)] hover:bg-[var(--app-border)]"
          >
            Voltar
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
                    const next = applyClassChange(character, key);
                    if (!key) {
                      updateAll({ ...next, className: "", classKey: undefined });
                      return;
                    }
                    updateAll(next);
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
                    if (!key) {
                      const next: Character = {
                        ...character,
                        raceKey: undefined,
                        raceAppliedBonuses: undefined,
                        raceAbilityChoices: undefined,
                      };
                      updateAll(next);
                      return;
                    }
                    const next = applyRaceChange(character, key);
                    updateAll(next);
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

                {character.raceKey === "halfElf" ? (
                  <div className="mt-3 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3 text-xs">
                    <div className="font-medium text-[var(--app-fg)]">Meio-Elfo: escolha 2 atributos (+1)</div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {(["str", "dex", "con", "int", "wis"] as Ability[]).map((a) => {
                        const checked = Boolean(character.raceAbilityChoices?.[a]);
                        const selectedCount = (["str", "dex", "con", "int", "wis"] as Ability[]).filter(
                          (k) => Boolean(character.raceAbilityChoices?.[k]),
                        ).length;
                        const disabled = !checked && selectedCount >= 2;
                        return (
                          <label key={a} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={disabled}
                              onChange={(e) => {
                                const nextChoices = { ...(character.raceAbilityChoices ?? {}) };
                                nextChoices[a] = e.target.checked;
                                const next = applyHalfElfChoices(character, nextChoices);
                                updateAll(next);
                              }}
                            />
                            <span>{a.toUpperCase()}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
              <div>
                <div className={labelClass()}>Antecedente (Background)</div>
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
                <div className={labelClass()}>Experiência (XP)</div>
                <input
                  className={inputClass()}
                  type="number"
                  min={0}
                  value={character.experiencePoints}
                  onChange={(e) => update({ experiencePoints: Number(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className={boxClass()}>
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Atributos</div>
                <div className="text-xs text-[var(--app-muted)]">mod</div>
              </div>
              <div className="mt-3 flex flex-col gap-3">
                {ABILITIES.map((a) => {
                  const score = character.abilities[a.key];
                  const mod = abilityMod(score);
                  return (
                    <div key={a.key} className="grid grid-cols-[1fr,84px,64px] items-center gap-2">
                      <div className="text-xs font-medium text-[var(--app-fg)]">{a.label}</div>
                      <input
                        className={inputClass()}
                        type="number"
                        min={1}
                        max={30}
                        value={score}
                        onChange={(e) => {
                          const abilities = { ...character.abilities, [a.key]: Number(e.target.value) || 10 };
                          updateNested("abilities", abilities);
                        }}
                      />
                      <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-center text-sm font-semibold">
                        {formatSigned(mod)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={boxClass()}>
              <div className="text-sm font-semibold">Proficiência</div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <div className={labelClass()}>Bônus de proficiência</div>
                  <div className="mt-1 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-center text-sm font-semibold">
                    {formatSigned(pb)}
                  </div>
                  <div className="mt-2">
                    <div className={labelClass()}>Override (opcional)</div>
                    <input
                      className={inputClass()}
                      type="number"
                      value={character.proficiencyBonusOverride ?? ""}
                      onChange={(e) =>
                        update({
                          proficiencyBonusOverride: e.target.value === "" ? null : Number(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <div className={labelClass()}>Inspiração</div>
                  <button
                    type="button"
                    className="mt-1 w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm font-medium text-[var(--app-fg)] hover:bg-[var(--app-border)]"
                    onClick={() => update({ inspiration: !character.inspiration })}
                  >
                    {character.inspiration ? "Ativa" : "Inativa"}
                  </button>
                  <div className="mt-4">
                    <div className={labelClass()}>Percepção passiva</div>
                    <div className="mt-1 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-center text-sm font-semibold">
                      {passivePerception}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={boxClass()}>
              <div className="text-sm font-semibold">Combate</div>
              <div className="mt-3 grid grid-cols-3 gap-3">
                <div>
                  <div className={labelClass()}>CA</div>
                  <input
                    className={inputClass()}
                    type="number"
                    value={character.armorClass}
                    onChange={(e) => update({ armorClass: Number(e.target.value) || 10 })}
                  />
                </div>
                <div>
                  <div className={labelClass()}>Iniciativa</div>
                  <div className="mt-1 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-center text-sm font-semibold">
                    {formatSigned(initiative)}
                  </div>
                  <div className="mt-2">
                    <div className={labelClass()}>Override</div>
                    <input
                      className={inputClass()}
                      type="number"
                      value={character.initiativeOverride ?? ""}
                      onChange={(e) =>
                        update({
                          initiativeOverride: e.target.value === "" ? null : Number(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>
                <div>
                  <div className={labelClass()}>Deslocamento</div>
                  <input
                    className={inputClass()}
                    type="number"
                    value={character.speed}
                    onChange={(e) => update({ speed: Number(e.target.value) || 30 })}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className={boxClass()}>
              <div className="text-sm font-semibold">Testes de resistência (Saving Throws)</div>
              <div className="mt-3 flex flex-col gap-2">
                {ABILITIES.map((a) => {
                  const mod = abilityMod(character.abilities[a.key]);
                  const isProf = character.savingThrowProficiencies[a.key];
                  const total = mod + (isProf ? pb : 0);
                  return (
                    <label
                      key={a.key}
                      className="flex items-center justify-between gap-3 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isProf}
                          onChange={(e) => {
                            const next = { ...character.savingThrowProficiencies, [a.key]: e.target.checked };
                            updateNested("savingThrowProficiencies", next);
                          }}
                        />
                        <span>{a.label}</span>
                      </div>
                      <div className="font-semibold tabular-nums">{formatSigned(total)}</div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className={boxClass()}>
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold">Perícias (Skills)</div>
                {character.classKey ? (
                  (() => {
                    const cls = getSrdClass(character.classKey);
                    if (!cls) return null;
                    const allowed = new Set(cls.skillChoices.options);
                    const selected = (Object.keys(character.skillProficiencies) as Skill[]).filter(
                      (k) => character.skillProficiencies[k] && allowed.has(k),
                    ).length;
                    return (
                      <div className="text-xs text-[var(--app-muted)]">
                        Escolha {selected}/{cls.skillChoices.picks}
                      </div>
                    );
                  })()
                ) : (
                  <div className="text-xs text-[var(--app-muted)]">Modo livre</div>
                )}
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {SKILLS.map((s) => {
                  const ability = SKILL_TO_ABILITY[s.key];
                  const mod = abilityMod(character.abilities[ability]);
                  const cls = character.classKey ? getSrdClass(character.classKey) : null;
                  const allowed = cls ? new Set(cls.skillChoices.options) : null;
                  const isAllowed = allowed ? allowed.has(s.key) : true;

                  const selectedCount = cls
                    ? (Object.keys(character.skillProficiencies) as Skill[]).filter(
                        (k) => character.skillProficiencies[k] && allowed?.has(k),
                      ).length
                    : 0;

                  const isProf = isAllowed ? character.skillProficiencies[s.key] : false;
                  const total = mod + (isProf ? pb : 0);
                  const disabled = cls ? !isAllowed || (!isProf && selectedCount >= cls.skillChoices.picks) : false;
                  return (
                    <label
                      key={s.key}
                      className="flex items-center justify-between gap-3 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isProf}
                          disabled={disabled}
                          onChange={(e) => {
                            if (cls) {
                              if (!isAllowed) return;
                              const next = { ...character.skillProficiencies };

                              if (e.target.checked) {
                                const after = (Object.keys(next) as Skill[]).filter((k) => next[k] && allowed?.has(k)).length;
                                if (after >= cls.skillChoices.picks) return;
                                next[s.key] = true;
                              } else {
                                next[s.key] = false;
                              }
                              updateNested("skillProficiencies", next);
                              return;
                            }

                            const next = { ...character.skillProficiencies, [s.key]: e.target.checked };
                            updateNested("skillProficiencies", next);
                          }}
                        />
                        <span className="leading-tight">
                          {s.label}
                          <span className="ml-1 text-[11px] text-[var(--app-muted)]">({ability.toUpperCase()})</span>
                        </span>
                      </div>
                      <div className="font-semibold tabular-nums">{formatSigned(total)}</div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className={boxClass()}>
              <div className="text-sm font-semibold">Pontos de vida</div>
              <div className="mt-3 grid grid-cols-3 gap-3">
                <div>
                  <div className={labelClass()}>Máximo</div>
                  <input
                    className={inputClass()}
                    type="number"
                    value={character.maxHp}
                    onChange={(e) => update({ maxHp: Number(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <div className={labelClass()}>Atual</div>
                  <input
                    className={inputClass()}
                    type="number"
                    value={character.currentHp}
                    onChange={(e) => update({ currentHp: Number(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <div className={labelClass()}>Temporário</div>
                  <input
                    className={inputClass()}
                    type="number"
                    value={character.tempHp}
                    onChange={(e) => update({ tempHp: Number(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <div className={labelClass()}>Dados de vida (total)</div>
                  <input
                    className={inputClass()}
                    value={character.hitDiceTotal}
                    onChange={(e) => update({ hitDiceTotal: e.target.value })}
                    placeholder="ex: 5d10"
                  />
                </div>
                <div>
                  <div className={labelClass()}>Dados de vida (restante)</div>
                  <input
                    className={inputClass()}
                    value={character.hitDiceRemaining}
                    onChange={(e) => update({ hitDiceRemaining: e.target.value })}
                    placeholder="ex: 3d10"
                  />
                </div>
              </div>
            </div>

            <div className={boxClass()}>
              <div className="text-sm font-semibold">Testes contra morte</div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <div className={labelClass()}>Sucessos</div>
                  <input
                    className={inputClass()}
                    type="number"
                    min={0}
                    max={3}
                    value={character.deathSaves.successes}
                    onChange={(e) =>
                      update({
                        deathSaves: {
                          ...character.deathSaves,
                          successes: Math.max(0, Math.min(3, Number(e.target.value) || 0)),
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <div className={labelClass()}>Falhas</div>
                  <input
                    className={inputClass()}
                    type="number"
                    min={0}
                    max={3}
                    value={character.deathSaves.failures}
                    onChange={(e) =>
                      update({
                        deathSaves: {
                          ...character.deathSaves,
                          failures: Math.max(0, Math.min(3, Number(e.target.value) || 0)),
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div className={boxClass()}>
              <div className="text-sm font-semibold">Profic. &amp; Idiomas</div>
              <textarea
                className={`${inputClass()} min-h-[200px] resize-y`}
                value={character.proficienciesAndLanguages}
                onChange={(e) => update({ proficienciesAndLanguages: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className={boxClass()}>
              <div className="text-sm font-semibold">Ataques &amp; Magias</div>
              <textarea
                className={`${inputClass()} mt-3 min-h-[240px] resize-y`}
                value={character.attacksAndSpells}
                onChange={(e) => update({ attacksAndSpells: e.target.value })}
              />
            </div>
            <div className={boxClass()}>
              <div className="text-sm font-semibold">Equipamento</div>
              <textarea
                className={`${inputClass()} mt-3 min-h-[240px] resize-y`}
                value={character.equipment}
                onChange={(e) => update({ equipment: e.target.value })}
              />
            </div>
          </div>

          <div className={boxClass()}>
            <div className="text-sm font-semibold">Características &amp; Traços</div>
            <textarea
              className={`${inputClass()} mt-3 min-h-[200px] resize-y`}
              value={character.otherFeaturesAndTraits}
              onChange={(e) => update({ otherFeaturesAndTraits: e.target.value })}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className={boxClass()}>
            <div className="text-sm font-semibold">Imagem do personagem</div>
            <div className="mt-3 flex items-start gap-3">
              <div className="relative h-28 w-28 overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)]">
                {character.avatarDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={character.avatarDataUrl} alt="avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-[var(--app-muted)]">
                    Sem imagem
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2">
                <label className="w-fit cursor-pointer rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm font-medium text-[var(--app-fg)] hover:bg-[var(--app-border)]">
                  <input
                    className="sr-only"
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const dataUrl = await fileToDataUrl(file);
                      update({ avatarDataUrl: dataUrl });
                    }}
                  />
                  Escolher arquivo
                </label>
                <button
                  type="button"
                  className="w-fit rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm font-medium text-[var(--app-fg)] hover:bg-[var(--app-border)]"
                  onClick={() => update({ avatarDataUrl: null })}
                >
                  Remover
                </button>
              </div>
            </div>
          </div>

          <div className={boxClass()}>
            <div className="text-sm font-semibold">Traços de personalidade</div>
            <textarea
              className={`${inputClass()} mt-3 min-h-[110px] resize-y`}
              value={character.personalityTraits}
              onChange={(e) => update({ personalityTraits: e.target.value })}
            />
            <div className="mt-4 text-sm font-semibold">Ideais</div>
            <textarea
              className={`${inputClass()} mt-3 min-h-[110px] resize-y`}
              value={character.ideals}
              onChange={(e) => update({ ideals: e.target.value })}
            />
            <div className="mt-4 text-sm font-semibold">Vínculos</div>
            <textarea
              className={`${inputClass()} mt-3 min-h-[110px] resize-y`}
              value={character.bonds}
              onChange={(e) => update({ bonds: e.target.value })}
            />
            <div className="mt-4 text-sm font-semibold">Fraquezas</div>
            <textarea
              className={`${inputClass()} mt-3 min-h-[110px] resize-y`}
              value={character.flaws}
              onChange={(e) => update({ flaws: e.target.value })}
            />
          </div>

          <div className={boxClass()}>
            <div className="text-sm font-semibold">Aparência</div>
            <textarea
              className={`${inputClass()} mt-3 min-h-[110px] resize-y`}
              value={character.appearance}
              onChange={(e) => update({ appearance: e.target.value })}
            />
            <div className="mt-4 text-sm font-semibold">História</div>
            <textarea
              className={`${inputClass()} mt-3 min-h-[110px] resize-y`}
              value={character.backstory}
              onChange={(e) => update({ backstory: e.target.value })}
            />
            <div className="mt-4 text-sm font-semibold">Aliados &amp; Organizações</div>
            <textarea
              className={`${inputClass()} mt-3 min-h-[110px] resize-y`}
              value={character.alliesAndOrganizations}
              onChange={(e) => update({ alliesAndOrganizations: e.target.value })}
            />
            <div className="mt-4 text-sm font-semibold">Tesouro</div>
            <textarea
              className={`${inputClass()} mt-3 min-h-[110px] resize-y`}
              value={character.treasure}
              onChange={(e) => update({ treasure: e.target.value })}
            />
          </div>

          <div className={boxClass()}>
            <div className="text-xs text-[var(--app-muted)]">
              Dica: nesta fase, a ficha salva no seu navegador. Depois vamos migrar para banco de dados e storage.
            </div>
          </div>
        </div>

        {/* Sistema de Rolagem de Dados */}
        <div className="grid grid-cols-1 gap-6">
          <DiceRoller character={character} playerName={character.name || "Personagem sem nome"} />
        </div>
      </div>
    </div>
  );
}
