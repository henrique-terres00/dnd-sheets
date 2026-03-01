// Sistema de log compartilhado de rolagens

import { useState, useEffect } from 'react';
import { DiceRoll } from './dice';

export type { DiceRoll };

const ROLL_LOG_KEY = 'dnd-sheets.roll-log.v1';

export interface RollLogState {
  rolls: DiceRoll[];
  lastUpdated: Date;
}

// Carregar log do localStorage
export function loadRollLog(): RollLogState {
  if (typeof window === 'undefined') {
    return { rolls: [], lastUpdated: new Date() };
  }

  try {
    const stored = localStorage.getItem(ROLL_LOG_KEY);
    if (!stored) return { rolls: [], lastUpdated: new Date() };

    const parsed = JSON.parse(stored);
    return {
      rolls: parsed.rolls || [],
      lastUpdated: new Date(parsed.lastUpdated || Date.now())
    };
  } catch {
    return { rolls: [], lastUpdated: new Date() };
  }
}

// Salvar log no localStorage
export function saveRollLog(state: RollLogState) {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(ROLL_LOG_KEY, JSON.stringify({
      rolls: state.rolls,
      lastUpdated: state.lastUpdated.toISOString()
    }));
  } catch {
    // Ignorar erros de localStorage
  }
}

// Adicionar nova rolagem ao log
export function addRollToLog(roll: DiceRoll) {
  const log = loadRollLog();
  log.rolls.unshift(roll); // Adicionar no início (mais recente primeiro)
  
  // Manter apenas as 100 rolagens mais recentes
  if (log.rolls.length > 100) {
    log.rolls = log.rolls.slice(0, 100);
  }
  
  log.lastUpdated = new Date();
  saveRollLog(log);
  
  // Disparar evento para notificar outros componentes
  window.dispatchEvent(new CustomEvent('rollAdded', { detail: roll }));
}

// Limpar log
export function clearRollLog() {
  saveRollLog({ rolls: [], lastUpdated: new Date() });
  window.dispatchEvent(new CustomEvent('rollLogCleared'));
}

// Formatar mensagem para exibição
export function formatRollMessage(roll: DiceRoll): string {
  const time = new Date(roll.timestamp).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  let typeIcon = '';
  switch (roll.type) {
    case 'attack': typeIcon = '⚔️'; break;
    case 'skill': typeIcon = '🎯'; break;
    case 'saving-throw': typeIcon = '🛡️'; break;
    case 'ability-check': typeIcon = '💪'; break;
    case 'damage': typeIcon = '💥'; break;
    case 'initiative': typeIcon = '⚡'; break;
  }
  
  const criticalIcon = roll.critical === 'success' ? ' 🎯' : roll.critical === 'failure' ? ' ❌' : '';
  
  return `${time} ${typeIcon} ${roll.playerName} [${roll.label.toUpperCase()}] ${roll.details} = ${roll.result}${criticalIcon}`;
}

// Hook React para usar o log de rolagens
export function useRollLog() {
  const [log, setLog] = useState<RollLogState>(() => loadRollLog());

  useEffect(() => {
    const handleRollAdded = (event: CustomEvent<DiceRoll>) => {
      setLog((prev: RollLogState) => {
        const newLog = {
          ...prev,
          rolls: [event.detail, ...prev.rolls].slice(0, 100),
          lastUpdated: new Date()
        };
        return newLog;
      });
    };

    const handleLogCleared = () => {
      setLog({ rolls: [], lastUpdated: new Date() });
    };

    window.addEventListener('rollAdded', handleRollAdded as EventListener);
    window.addEventListener('rollLogCleared', handleLogCleared);

    return () => {
      window.removeEventListener('rollAdded', handleRollAdded as EventListener);
      window.removeEventListener('rollLogCleared', handleLogCleared);
    };
  }, []);

  return {
    rolls: log.rolls,
    addRoll: addRollToLog,
    clearLog: clearRollLog,
    formatMessage: formatRollMessage
  };
}
