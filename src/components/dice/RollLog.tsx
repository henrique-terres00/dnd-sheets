"use client";

import { useEffect, useRef } from "react";
import { useRollLog } from "@/lib/rollLog";

export function RollLog() {
  const { rolls, clearLog, formatMessage } = useRollLog();
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to end when new rolls are added
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [rolls]);

  return (
    <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">📜 Log de Rolagens</h3>
        <button
          className="rounded-lg border border-[var(--app-border)] bg-red-500/20 px-3 py-1 text-sm text-[var(--app-fg)] hover:bg-red-500/30"
          onClick={clearLog}
          disabled={rolls.length === 0}
        >
          Limpar
        </button>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {rolls.length === 0 ? (
          <div className="text-center text-sm text-[var(--app-muted)] py-8">
            Nenhuma rolagem registrada ainda
          </div>
        ) : (
          rolls.map((roll) => (
            <div
              key={roll.id}
              className="p-2 rounded-lg border border-[var(--app-border)] bg-[var(--app-bg)] text-sm font-mono"
            >
              {formatMessage(roll)}
            </div>
          ))
        )}
        <div ref={logEndRef} />
      </div>

      {rolls.length > 0 && (
        <div className="mt-4 text-xs text-[var(--app-muted)]">
          {rolls.length} rolagem{rolls.length !== 1 ? 's' : ''} • 
          Atualizado: {new Date(rolls[0].timestamp).toLocaleTimeString('pt-BR')}
        </div>
      )}
    </div>
  );
}
