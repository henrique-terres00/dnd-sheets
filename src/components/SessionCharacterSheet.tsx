"use client";

import { useState, useEffect } from "react";
import CharacterSheetClient from "./characters/CharacterSheetClient";
import { getSession, updateSession, subscribeToSession } from "@/lib/supabase";
import type { Character } from "@/lib/types";

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

  // Override the getCharacter and upsertCharacter functions
  useEffect(() => {
    if (!character) return;

    const characterStore = require('@/lib/characterStore');
    const originalGetCharacter = characterStore.getCharacter;
    const originalUpsertCharacter = characterStore.upsertCharacter;

    // Override getCharacter to return session character
    characterStore.getCharacter = (charId: string) => {
      if (charId === id) return character;
      return originalGetCharacter(charId);
    };

    // Override upsertCharacter to sync with session
    characterStore.upsertCharacter = async (updatedCharacter: Character) => {
      if (updatedCharacter.id === id) {
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
      } else {
        return originalUpsertCharacter(updatedCharacter);
      }
    };

    return () => {
      // Restore original functions
      characterStore.getCharacter = originalGetCharacter;
      characterStore.upsertCharacter = originalUpsertCharacter;
    };
  }, [character, id]);

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
