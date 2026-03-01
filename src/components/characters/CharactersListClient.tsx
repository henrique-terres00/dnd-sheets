"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { deleteCharacter, listCharacters } from "@/lib/characterStore";
import type { Character } from "@/lib/types";

export default function CharactersListClient() {
  const [characters, setCharacters] = useState<Character[]>(() => (typeof window === "undefined" ? [] : listCharacters()));

  useEffect(() => {
    setCharacters(listCharacters());
  }, []);

  const refresh = () => {
    setCharacters(listCharacters());
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Personagens</h1>
        <Link
          href="/characters/new"
          className="inline-flex items-center justify-center rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-2 text-sm font-medium text-[var(--app-fg)] hover:bg-[var(--app-border)]"
        >
          Novo personagem
        </Link>
      </div>

      {characters.length === 0 ? (
        <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6 text-sm text-[var(--app-fg)] shadow-sm">
          Você ainda não criou nenhum personagem.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {characters.map((c) => (
            <div
              key={c.id}
              className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">
                    {c.name || "(Sem nome)"}
                  </div>
                  <div className="mt-1 truncate text-xs text-[var(--app-muted)]">
                    {c.className ? `${c.className} ` : ""}Nível {c.level}
                    {c.race ? ` • ${c.race}` : ""}
                  </div>
                  <div className="mt-1 text-[11px] text-[var(--app-muted)]">
                    Atualizado: {new Date(c.updatedAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    href={`/characters/${c.id}`}
                    className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-xs font-medium text-[var(--app-fg)] hover:bg-[var(--app-border)]"
                  >
                    Abrir
                  </Link>
                  <button
                    type="button"
                    className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-xs font-medium text-[var(--app-fg)] hover:bg-[var(--app-border)] disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => {
                      if (window.confirm(`Tem certeza que deseja excluir "${c.name || "(Sem nome)"}"?`)) {
                        deleteCharacter(c.id);
                        refresh();
                      }
                    }}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
