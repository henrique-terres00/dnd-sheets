"use client";

import { useState, useEffect } from "react";
import CharacterSheetClient from "./characters/CharacterSheetClient";
import { getSession } from "@/lib/supabase";

export default function SessionCharacterSheet({ id }: { id: string }) {
  const [character, setCharacter] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSessionCharacter = async () => {
      try {
        const currentSession = localStorage.getItem('currentSession');
        if (currentSession) {
          const sessionData = await getSession(currentSession);
          if (sessionData && sessionData.characters) {
            const foundCharacter = sessionData.characters.find((c: any) => c.id === id);
            setCharacter(foundCharacter || null);
          }
        }
      } catch (error) {
        console.error('Error loading session character:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSessionCharacter();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-2xl mb-4">🎲</div>
        <p className="text-[var(--app-muted)]">Carregando ficha da sessão...</p>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="flex flex-col gap-3">
        <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-sm">
          <div className="text-sm text-[var(--app-muted)]">Personagem não encontrado na sessão.</div>
        </div>
        <div>
          <a className="text-sm font-medium underline" href="/characters">
            Voltar para Personagens
          </a>
        </div>
      </div>
    );
  }

  return <CharacterSheetClient id={id} />;
}
