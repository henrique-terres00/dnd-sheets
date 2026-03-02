// Shared dice roll logging system

import { useState, useEffect } from 'react';
import { DiceRoll } from './dice';
import { storage, limitArray, formatTime } from './utils';
import { ROLL_LOG_LIMIT, STORAGE_KEYS } from './constants';

export type { DiceRoll };

export interface RollLogState {
  rolls: DiceRoll[];
  lastUpdated: Date;
}

// Load log from localStorage
export function loadRollLog(): RollLogState {
  const stored = storage.get(STORAGE_KEYS.ROLL_LOG, { rolls: [], lastUpdated: new Date().toISOString() });
  return {
    rolls: stored.rolls || [],
    lastUpdated: new Date(stored.lastUpdated || Date.now())
  };
}

// Save log to localStorage
export function saveRollLog(state: RollLogState) {
  storage.set(STORAGE_KEYS.ROLL_LOG, {
    rolls: state.rolls,
    lastUpdated: state.lastUpdated.toISOString()
  });
}

// Add new roll to log
export function addRollToLog(roll: DiceRoll) {
  const log = loadRollLog();
  log.rolls.unshift(roll); // Add to beginning (most recent first)
  
  // Keep only the most recent rolls
  log.rolls = limitArray(log.rolls, ROLL_LOG_LIMIT);
  
  log.lastUpdated = new Date();
  saveRollLog(log);
  
  // Trigger event to notify other components
  window.dispatchEvent(new CustomEvent('rollAdded', { detail: roll }));
}

// Clear roll log
export function clearRollLog() {
  saveRollLog({ rolls: [], lastUpdated: new Date() });
  window.dispatchEvent(new CustomEvent('rollLogCleared'));
}

// Format message for display
export function formatRollMessage(roll: DiceRoll): string {
  const time = formatTime(roll.timestamp);
  
  let typeIcon = '';
  switch (roll.type) {
    case 'attack': typeIcon = '⚔️'; break;
    case 'skill': typeIcon = '🎯'; break;
    case 'saving-throw': typeIcon = '🛡️'; break;
    case 'ability-check': typeIcon = '💪'; break;
    case 'damage': typeIcon = '💥'; break;
    case 'initiative': typeIcon = '⚡'; break;
    case 'spell': typeIcon = '🔮'; break;
  }
  
  const criticalIcon = roll.critical === 'success' ? ' 🎯' : roll.critical === 'failure' ? ' ❌' : '';
  
  return `${time} ${typeIcon} ${roll.playerName} [${roll.label.toUpperCase()}] ${roll.details} = ${roll.result}${criticalIcon}`;
}

// React hook to use roll log
export function useRollLog() {
  const [log, setLog] = useState<RollLogState>(() => loadRollLog());

  useEffect(() => {
    const handleRollAdded = (event: CustomEvent<DiceRoll>) => {
      setLog((prev: RollLogState) => {
        const newLog = {
          ...prev,
          rolls: limitArray([event.detail, ...prev.rolls], ROLL_LOG_LIMIT),
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
