// Utility functions to reduce code duplication

import type { Character } from "./types";

/**
 * Check if code is running in browser environment
 */
export function isClient(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Filter array of items by search term and field
 */
export function filterItems<T extends Record<string, any>>(
  items: T[], 
  searchTerm: string, 
  searchField: keyof T
): T[] {
  if (!searchTerm) return items;
  return items.filter(item => 
    item[searchField]?.toString().toLowerCase().includes(searchTerm.toLowerCase())
  );
}

/**
 * Limit array to specified number of items
 */
export function limitArray<T>(array: T[], limit: number): T[] {
  return array.slice(0, limit);
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Format time for display
 */
export function formatTime(timestamp: string | Date): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Safe localStorage operations
 */
export const storage = {
  get<T>(key: string, defaultValue: T): T {
    if (!isClient()) return defaultValue;
    
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return defaultValue;
      
      const parsed = JSON.parse(stored);
      return parsed ?? defaultValue;
    } catch {
      return defaultValue;
    }
  },

  set<T>(key: string, value: T): void {
    if (!isClient()) return;
    
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore localStorage errors
    }
  },

  remove(key: string): void {
    if (!isClient()) return;
    
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore localStorage errors
    }
  }
};

/**
 * Create debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Check if character has equipment
 */
export function hasEquipment(character: Character): boolean {
  return !!(
    character.characterEquipment?.weapons.length ||
    character.characterEquipment?.armor ||
    character.characterEquipment?.shield ||
    character.characterEquipment?.equipment.length
  );
}
