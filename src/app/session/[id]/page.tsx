"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase, subscribeToSession, createSession, getSession, updateSession, addCharacterToSession, addRollToSession, deleteSession } from "@/lib/supabase";

export default function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = useParams();
  const sessionCode = (resolvedParams.id as string).toUpperCase();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'characters' | 'map' | 'rolls'>('characters');
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localCharacters, setLocalCharacters] = useState<any[]>([]);

  useEffect(() => {
    initializeSession();
    loadLocalCharacters();
    
    if (sessionCode) {
      localStorage.setItem('currentSession', sessionCode);
      window.dispatchEvent(new Event('sessionUpdated'));
    }
    
    const subscription = subscribeToSession(sessionCode, (payload) => {
      setSession(payload.new);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [sessionCode]);

  const loadLocalCharacters = () => {
    try {
      const savedCharacters = localStorage.getItem('dnd-sheets.characters.v1');
      
      if (savedCharacters) {
        const parsed = JSON.parse(savedCharacters);
        const characters = parsed.characters || [];
        setLocalCharacters(characters);
      }
    } catch (err) {
      console.error('Error loading local characters:', err);
    }
  };

  const importCharacterToSession = async (character: any) => {
    try {
      // Check if character already exists in session
      if (session?.characters?.some((char: any) => char.id === character.id)) {
        alert('Este personagem já está na sessão!');
        return;
      }
      
      // Add character to session
      await addCharacterToSession(sessionCode, character, 'Player');
      
      // Show success message
      alert(`${character.name} foi adicionado à sessão!`);
      
      // Update local state instead of full reload
      const updatedSession = await getSession(sessionCode);
      if (updatedSession) {
        setSession(updatedSession);
      }
    } catch (err) {
      console.error('Error importing character:', err);
      alert('Erro ao importar personagem');
    }
  };

  const removeCharacterFromSession = async (characterId: string) => {
    if (!window.confirm('Tem certeza que deseja remover esta ficha da sessão?')) {
      return;
    }

    try {
      const currentSession = await getSession(sessionCode);
      if (!currentSession) {
        throw new Error('Sessão não encontrada');
      }

      const updatedCharacters = currentSession.characters.filter((char: any) => char.id !== characterId);
      
      await updateSession(sessionCode, {
        characters: updatedCharacters,
        active_players: Math.max(0, currentSession.active_players - 1)
      });
      
      setSession((prev: any) => prev ? {
        ...prev,
        characters: updatedCharacters,
        active_players: Math.max(0, prev.active_players - 1)
      } : null);
      
      alert('Ficha removida da sessão com sucesso!');
    } catch (err) {
      console.error('Error removing character from session:', err);
      alert('Erro ao remover ficha da sessão. Tente novamente.');
    }
  };

  const initializeSession = async () => {
    try {
      setLoading(true);
      
      const existingSession = await getSession(sessionCode);
      
      if (!existingSession) {
        setError(`Sessão "${sessionCode}" não encontrada ou foi encerrada.`);
        return;
      }
      
      setSession(existingSession);
    } catch (err) {
      setError(`Erro ao carregar sessão: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveSession = async () => {
    const confirmed = window.confirm(
      'Tem certeza que deseja encerrar a sessão?\n\n' +
      '⚠️ ATENÇÃO: Isso irá:\n' +
      '• Encerrar a sessão permanentemente\n' +
      '• Apagar todos os dados da sessão\n' +
      '• Remover todos os jogadores\n' +
      '• O código da sessão será invalidado\n\n' +
      'Deseja continuar?'
    );
    
    if (confirmed) {
      try {
        const deletedSession = await deleteSession(sessionCode);
        
        if (deletedSession === null) {
          alert('Sessão não encontrada ou já foi encerrada.');
        } else {
          localStorage.removeItem('currentSession');
          alert('Sessão encerrada com sucesso!');
        }
        
        router.push('/campaigns');
      } catch (err) {
        console.error('Error deleting session:', err);
        alert('Erro ao encerrar a sessão. Tente novamente.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-2xl mb-4">🎲</div>
        <p className="text-[var(--app-muted)]">Carregando sessão...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-2xl mb-4">❌</div>
        <p className="text-[var(--app-muted)] mb-4">{error}</p>
        <div className="flex gap-2">
          <Link 
            href="/campaigns"
            className="px-4 py-2 text-sm font-medium rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-fg)] hover:bg-[var(--app-bg)] transition-colors"
          >
            ← Voltar para Campanhas
          </Link>
          <Link 
            href="/campaigns"
            onClick={() => localStorage.removeItem('currentSession')}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-[var(--app-border)] bg-blue-500 text-white hover:bg-blue-600 transition-colors"
          >
            Criar Nova Sessão
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--app-fg)]">Sessão: {sessionCode}</h1>
          <p className="text-sm text-[var(--app-muted)]">
            Campanha multiplayer em tempo real • {session?.active_players || 0} jogadores online
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleLeaveSession}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-[var(--app-border)] bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            Encerrar Sessão
          </button>
          <Link 
            href="/campaigns"
            className="px-4 py-2 text-sm font-medium rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-fg)] hover:bg-[var(--app-bg)] transition-colors"
          >
            ← Voltar
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--app-border)]">
        <button
          onClick={() => setActiveTab('characters')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'characters'
              ? 'bg-[var(--app-surface)] text-[var(--app-fg)] border-b-2 border-[var(--app-fg)]'
              : 'text-[var(--app-muted)] hover:text-[var(--app-fg)]'
          }`}
        >
          📋 Fichas ({session?.characters?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('map')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'map'
              ? 'bg-[var(--app-surface)] text-[var(--app-fg)] border-b-2 border-[var(--app-fg)]'
              : 'text-[var(--app-muted)] hover:text-[var(--app-fg)]'
          }`}
        >
          🗺️ Mapa
        </button>
        <button
          onClick={() => setActiveTab('rolls')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'rolls'
              ? 'bg-[var(--app-surface)] text-[var(--app-fg)] border-b-2 border-[var(--app-fg)]'
              : 'text-[var(--app-muted)] hover:text-[var(--app-fg)]'
          }`}
        >
          🎲 Rolagens ({session?.rolls?.length || 0})
        </button>
      </div>

      {/* Content */}
      <div className="flex-1">
        {activeTab === 'characters' && (
          <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--app-fg)]">📋 Fichas dos Personagens</h2>
              <Link 
                href="/characters/new"
                className="px-3 py-1 text-sm font-medium rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              >
                + Nova Ficha
              </Link>
            </div>
            
            {/* Session Characters */}
            <div className="mb-6">
              <h3 className="text-md font-medium text-[var(--app-fg)] mb-3">Fichas na Sessão ({session?.characters?.length || 0})</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {(!session?.characters || session.characters.length === 0) ? (
                  <div className="col-span-full text-center py-4 text-[var(--app-muted)]">
                    <p className="text-sm">Nenhuma ficha nesta sessão</p>
                  </div>
                ) : (
                  session.characters.map((character: any, index: number) => (
                    <div key={`session-${character.id}-${index}`} className="border border-[var(--app-border)] rounded-lg p-4 bg-[var(--app-bg)]">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-[var(--app-fg)] mb-2">{character.name}</h3>
                          <p className="text-sm text-[var(--app-muted)] mb-1">{character.className} Nível {character.level}</p>
                          <p className="text-sm text-[var(--app-muted)] mb-3">{character.race}</p>
                          <Link 
                            href={`/session-characters/${character.id}`}
                            className="text-sm text-blue-400 hover:text-blue-300"
                          >
                            Ver Ficha →
                          </Link>
                        </div>
                        <button
                          onClick={() => removeCharacterFromSession(character.id)}
                          className="text-red-500 hover:text-red-600 text-xl leading-none ml-2"
                          title="Remover ficha da sessão"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Local Characters */}
            {localCharacters.length > 0 && (
              <div>
                <h3 className="text-md font-medium text-[var(--app-fg)] mb-3">📂 Fichas Locais ({localCharacters.length})</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {localCharacters.map((character: any) => (
                    <div key={character.id} className="border border-[var(--app-border)] rounded-lg p-4 bg-[var(--app-bg)]">
                      <h3 className="font-semibold text-[var(--app-fg)] mb-2">{character.name}</h3>
                      <p className="text-sm text-[var(--app-muted)] mb-1">{character.className} Nível {character.level}</p>
                      <p className="text-sm text-[var(--app-muted)] mb-3">{character.race}</p>
                      <div className="flex gap-2">
                        <Link 
                          href={`/characters/${character.id}`}
                          className="text-sm text-blue-400 hover:text-blue-300"
                        >
                          Ver Ficha →
                        </Link>
                        <button
                          onClick={() => importCharacterToSession(character)}
                          className="text-sm px-2 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                        >
                          Importar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'map' && (
          <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--app-fg)]">🗺️ Mapa da Campanha</h2>
              <Link 
                href="/map"
                className="px-3 py-1 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
              >
                Abrir Mapa
              </Link>
            </div>
            
            <div className="text-center py-8 text-[var(--app-muted)]">
              <div className="text-4xl mb-2">🗺️</div>
              <p className="text-sm">Mapa interativo disponível</p>
              <p className="text-xs mt-1">Clique em "Abrir Mapa" para acessar o mapa compartilhado</p>
            </div>
          </div>
        )}

        {activeTab === 'rolls' && (
          <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--app-fg)]">🎲 Rolagens de Dados</h2>
              <Link 
                href="/rolls"
                className="px-3 py-1 text-sm font-medium rounded-lg bg-purple-500 text-white hover:bg-purple-600 transition-colors"
              >
                Ver Rolagens
              </Link>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {(!session?.rolls || session.rolls.length === 0) ? (
                <div className="text-center py-8 text-[var(--app-muted)]">
                  <div className="text-4xl mb-2">🎲</div>
                  <p className="text-sm">Nenhuma rolagem nesta sessão</p>
                  <p className="text-xs mt-1">As rolagens aparecerão aqui em tempo real</p>
                </div>
              ) : (
                session.rolls.map((roll: any, index: number) => (
                  <div key={index} className="p-2 rounded-lg border border-[var(--app-border)] bg-[var(--app-bg)] text-sm">
                    <div className="font-medium text-[var(--app-fg)]">{roll.player_name}</div>
                    <div className="text-[var(--app-muted)]">{roll.roll_type}</div>
                    <div className="text-[var(--app-fg)]">{roll.roll_result}</div>
                    <div className="text-xs text-[var(--app-muted)] mt-1">{roll.roll_details}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Session Info */}
      <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-sm">
        <div className="flex items-center justify-between text-sm">
          <div className="text-[var(--app-muted)]">
            <span className="font-medium">Código da Sessão:</span> <span className="font-mono bg-[var(--app-bg)] px-2 py-1 rounded">{sessionCode}</span>
          </div>
          <div className="text-[var(--app-muted)]">
            Compartilhe este código com outros jogadores para entrarem na sessão
          </div>
        </div>
      </div>
    </div>
  );
}
