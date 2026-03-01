"use client";

import { useEffect, useRef, useState } from "react";
import { useRollLog } from "@/lib/rollLog";

export function InlineRollLog() {
  const { rolls, clearLog, formatMessage } = useRollLog();
  const [isOpen, setIsOpen] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to end when new rolls are added
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [rolls]);

  if (!isOpen) {
    return (
      <button
        className="rounded-xl border border-[var(--app-border)] bg-blue-500/20 px-6 py-3 text-sm font-medium text-[var(--app-fg)] hover:bg-blue-500/30"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        📜 Ver Rolagens ({rolls.length})
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6 shadow-sm max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">📜 Histórico de Rolagens</h3>
          <div className="flex gap-2">
            <button
              className="rounded-lg border border-[var(--app-border)] bg-red-500/20 px-3 py-1 text-sm text-[var(--app-fg)] hover:bg-red-500/30"
              onClick={clearLog}
              disabled={rolls.length === 0}
            >
              Limpar
            </button>
            <button
              className="rounded-lg border border-[var(--app-border)] bg-gray-500/20 px-3 py-1 text-sm text-[var(--app-fg)] hover:bg-gray-500/30"
              onClick={() => setIsOpen(false)}
            >
              ✕
            </button>
          </div>
        </div>

        <div className="space-y-2">
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
            Última atualização: {new Date(rolls[0].timestamp).toLocaleTimeString('pt-BR')}
          </div>
        )}
      </div>
    </div>
  );
}
