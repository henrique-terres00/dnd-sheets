// Shared dice roll formatting for session rolls

import { DiceRoll } from './dice';
import { formatTime } from './utils';

export type { DiceRoll };

// Format message for display (used by session rolls)
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
  
  // Não mostrar o resultado se for 0 e não for relevante (magias de utilidade)
  const resultText = (roll.result === 0 && roll.type === 'spell') ? '' : ` = ${roll.result}`;
  
  return `${time} ${typeIcon} ${roll.playerName} [${roll.label.toUpperCase()}] ${roll.details}${resultText}${criticalIcon}`;
}
