"use client";

import { useState, useEffect } from "react";
import { getSession, updateSession, subscribeToSession } from "@/lib/supabase";
import type { Character } from "@/lib/types";

// Import CharacterSheet components directly to avoid function override issues
import CharacterSheetContent from "./characters/CharacterSheetContent";

export default function SessionCharacterSheet({ id }: { id: string }) {
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSessionCharacter = async () => {
      try {
        const currentSession = localStorage.getItem('currentSession');
        if (currentSession) {
          const sessionData = await getSession(currentSession);
          if (sessionData && sessionData.characters) {
            const foundCharacter = sessionData.characters.find((c: Character) => c.id === id);
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

    // Subscribe to real-time updates
    const currentSession = localStorage.getItem('currentSession');
    if (currentSession) {
      const subscription = subscribeToSession(currentSession, (payload) => {
        if (payload.new && payload.new.characters) {
          const updatedCharacter = payload.new.characters.find((c: Character) => c.id === id);
          if (updatedCharacter) {
            setCharacter(updatedCharacter);
          }
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [id]);

  const updateCharacter = async (updatedCharacter: Character) => {
    try {
      const currentSession = localStorage.getItem('currentSession');
      if (currentSession) {
        const sessionData = await getSession(currentSession);
        if (sessionData && sessionData.characters) {
          const updatedCharacters = sessionData.characters.map((c: Character) => 
            c.id === id ? updatedCharacter : c
          );
          
          await updateSession(currentSession, {
            characters: updatedCharacters
          });
          
          setCharacter(updatedCharacter);
        }
      }
    } catch (error) {
      console.error('Error updating session character:', error);
    }
  };

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

  return <CharacterSheetContent character={character} onUpdate={updateCharacter} />;
}
