"use client";

import { useState } from "react";
import Link from "next/link";

export default function CampaignsPage() {
  const [sessionCode, setSessionCode] = useState("");

  const handleJoinSession = () => {
    if (sessionCode.trim()) {
      window.location.href = `/session/${sessionCode.trim()}`;
    }
  };

  const handleCreateSession = () => {
    // Generate random session code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    window.location.href = `/session/${code}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight text-[var(--app-fg)]">Campanhas</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Join Session */}
        <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--app-fg)] mb-4">🎮 Entrar em Sessão</h2>
          <p className="text-sm text-[var(--app-muted)] mb-4">
            Digite o código da sessão para entrar em uma campanha existente.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Código da sessão (ex: ABC123)"
              value={sessionCode}
              onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
              className="flex-1 px-3 py-2 text-sm border border-[var(--app-border)] rounded-lg bg-[var(--app-bg)] text-[var(--app-fg)] placeholder-[var(--app-muted)] focus:outline-none focus:border-[var(--app-fg)]"
              maxLength={6}
            />
            <button
              onClick={handleJoinSession}
              disabled={!sessionCode.trim()}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Join Session
            </button>
          </div>
        </div>

        {/* Create Session */}
        <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--app-fg)] mb-4">🎲 Criar Sessão</h2>
          <p className="text-sm text-[var(--app-muted)] mb-4">
            Crie uma nova sessão de campanha para jogar com seus amigos.
          </p>
          <button
            onClick={handleCreateSession}
            className="w-full px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
          >
            Create Session
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-[var(--app-fg)] mb-3">📖 Como Funciona</h3>
        <div className="space-y-2 text-sm text-[var(--app-muted)]">
          <p>• <strong>Criar Sessão:</strong> Gera um código único para sua campanha</p>
          <p>• <strong>Entrar em Sessão:</strong> Use o código fornecido pelo mestre</p>
          <p>• <strong>Funcionalidades:</strong> Fichas, Mapas, Rolagens de Dados, Magias</p>
          <p>• <strong>Multiplayer:</strong> Todos os jogadores veem as mesmas informações em tempo real</p>
        </div>
      </div>
    </div>
  );
}
