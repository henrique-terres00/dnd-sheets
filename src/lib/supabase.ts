import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl) {
  console.error('NEXT_PUBLIC_SUPABASE_URL is not set');
}

if (!supabaseAnonKey) {
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
}

// Only create client if environment variables are available
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Types for our database
export interface Session {
  id: string;
  code: string;
  created_at: string;
  updated_at: string;
  characters: any[];
  rolls: any[];
  map_state: any;
  active_players: number;
}

export interface SessionCharacter {
  id: string;
  session_id: string;
  character_data: any;
  player_name: string;
  created_at: string;
  updated_at: string;
}

export interface SessionRoll {
  id: string;
  session_id: string;
  player_name: string;
  character_name: string;
  roll_type: string;
  roll_details: string;
  roll_result: number;
  created_at: string;
}

// Test function to check Supabase connection
export async function testConnection() {
  if (!supabase) {
    console.error('Supabase client not initialized');
    return false;
  }
  
  try {
    console.log('Testing Supabase connection...');
    const { data, error } = await supabase
      .from('sessions')
      .select('count')
      .limit(1);
    
    console.log('Connection test result:', { data, error });
    return !error;
  } catch (err) {
    console.error('Connection test failed:', err);
    return false;
  }
}

// Database functions
export async function createSession(code: string) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }
  
  try {
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        code: code.toUpperCase(),
        characters: [],
        rolls: [],
        map_state: {},
        active_players: 0
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error creating session:', error);
      throw error;
    }
    return data;
  } catch (err) {
    console.error('Failed to create session:', err);
    throw err;
  }
}

export async function getSession(code: string) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }
  
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('code', code.toUpperCase())
      .maybeSingle();

    if (error) {
      console.error('Error getting session:', error);
      return null;
    }
    
    return data;
  } catch (err) {
    console.error('Failed to get session:', err);
    return null;
  }
}

export async function updateSession(code: string, updates: Partial<Session>) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }
  
  const { data, error } = await supabase
    .from('sessions')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('code', code.toUpperCase())
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function deleteSession(code: string) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }
  
  try {
    console.log('Deleting session:', code);
    const { data, error } = await supabase
      .from('sessions')
      .delete()
      .eq('code', code.toUpperCase())
      .select(); // Add .select() to return deleted data

    if (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
    
    console.log('Session deleted successfully:', data);
    
    // Check if anything was actually deleted
    if (!data || data.length === 0) {
      console.log('No session found to delete with code:', code);
      return null; // No session was deleted
    }
    
    return data[0]; // Return the deleted session
  } catch (err) {
    console.error('Failed to delete session:', err);
    throw err;
  }
}

export async function addCharacterToSession(code: string, character: any, playerName: string) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }
  
  const session = await getSession(code);
  if (!session) throw new Error('Session not found');

  const updatedCharacters = [...(session.characters || []), character];
  
  return await updateSession(code, {
    characters: updatedCharacters,
    active_players: session.active_players + 1
  });
}

export async function addRollToSession(code: string, roll: any) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }
  
  const session = await getSession(code);
  if (!session) throw new Error('Session not found');

  const updatedRolls = [...(session.rolls || []), roll];
  
  const result = await updateSession(code, {
    rolls: updatedRolls
  });
  
  // Disparar evento global para notificar atualizações
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sessionRollsUpdated', { 
      detail: { session: result, rolls: updatedRolls } 
    }));
    console.log('Session rolls updated, event dispatched');
  }
  
  return result;
}

// Real-time subscription
export function subscribeToSession(code: string, callback: (payload: any) => void) {
  if (!supabase) {
    console.error('Supabase client not initialized');
    return { unsubscribe: () => {} };
  }
  
  console.log('Subscribing to session:', code);
  
  return supabase
    .channel(`session-${code}`)
    .on('postgres_changes', 
      { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'sessions', 
        filter: `code=eq.${code}` 
      }, 
      (payload) => {
        console.log('Session update received:', payload);
        callback(payload);
      }
    )
    .subscribe((status) => {
      console.log('Subscription status:', status);
    });
}
