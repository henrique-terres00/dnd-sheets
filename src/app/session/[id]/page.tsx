"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionCode = params.id as string;

  const [activeTab, setActiveTab] = useState<'characters' | 'map' | 'rolls'>('characters');
  const [characters, setCharacters] = useState<any[]>([]);
  const [rolls, setRolls] = useState<any[]>([]);

  useEffect(() => {
    // Load session data
    loadSessionData();
  }, [sessionCode]);

  const loadSessionData = () => {
    // For now, load from localStorage
    const savedCharacters = localStorage.getItem(`session_${sessionCode}_characters`);
    const savedRolls = localStorage.getItem(`session_${sessionCode}_rolls`);
    
    if (savedCharacters) {
      setCharacters(JSON.parse(savedCharacters));
    }
    if (savedRolls) {
      setRolls(JSON.parse(savedRolls));
    }
  };

  const saveSessionData = (data: any, type: 'characters' | 'rolls') => {
    localStorage.setItem(`session_${sessionCode}_${type}`, JSON.stringify(data));
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--app-fg)]">Sessão: {sessionCode}</h1>
          <p className="text-sm text-[var(--app-muted)]">Campanha multiplayer em tempo real</p>
        </div>
        <Link 
          href="/campaigns"
          className="px-4 py-2 text-sm font-medium rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-fg)] hover:bg-[var(--app-bg)] transition-colors"
        >
          ← Voltar
        </Link>
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
          📋 Fichas
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
          🎲 Rolagens
        </button>
      </div>

      {/* Content */}
      <div className="flex-1">
        {activeTab === 'characters' && (
          <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--app-fg)]">👥 Fichas dos Personagens</h2>
              <Link 
                href="/characters/new"
                className="px-3 py-1 text-sm font-medium rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              >
                + Nova Ficha
              </Link>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {characters.length === 0 ? (
                <div className="col-span-full text-center py-8 text-[var(--app-muted)]">
                  <div className="text-4xl mb-2">📋</div>
                  <p className="text-sm">Nenhuma ficha nesta sessão</p>
                  <p className="text-xs mt-1">Crie uma ficha para começar a jogar</p>
                </div>
              ) : (
                characters.map((character) => (
                  <div key={character.id} className="border border-[var(--app-border)] rounded-lg p-4 bg-[var(--app-bg)]">
                    <h3 className="font-semibold text-[var(--app-fg)] mb-2">{character.name}</h3>
                    <p className="text-sm text-[var(--app-muted)] mb-1">{character.className} Nível {character.level}</p>
                    <p className="text-sm text-[var(--app-muted)] mb-3">{character.race}</p>
                    <Link 
                      href={`/characters/${character.id}`}
                      className="text-sm text-blue-400 hover:text-blue-300"
                    >
                      Ver Ficha →
                    </Link>
                  </div>
                ))
              )}
            </div>
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
              {rolls.length === 0 ? (
                <div className="text-center py-8 text-[var(--app-muted)]">
                  <div className="text-4xl mb-2">🎲</div>
                  <p className="text-sm">Nenhuma rolagem nesta sessão</p>
                  <p className="text-xs mt-1">As rolagens aparecerão aqui em tempo real</p>
                </div>
              ) : (
                rolls.map((roll, index) => (
                  <div key={index} className="p-2 rounded-lg border border-[var(--app-border)] bg-[var(--app-bg)] text-sm">
                    <div className="font-medium text-[var(--app-fg)]">{roll.player}</div>
                    <div className="text-[var(--app-muted)]">{roll.action}</div>
                    <div className="text-[var(--app-fg)]">{roll.result}</div>
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
