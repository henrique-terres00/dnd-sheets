// Test Supabase connection
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key exists:', !!supabaseAnonKey);
console.log('Supabase Key length:', supabaseAnonKey.length);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    console.log('Testing connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('sessions')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Connection error:', error);
      console.error('Error details:', error.message);
      console.error('Error code:', error.code);
      console.error('Error hint:', error.hint);
      return;
    }
    
    console.log('Connection successful!');
    console.log('Data:', data);
    
    // Test creating a session
    const testCode = 'TEST123';
    console.log('Creating test session:', testCode);
    
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        code: testCode,
        characters: [],
        rolls: [],
        map_state: {},
        active_players: 0
      })
      .select()
      .single();
    
    if (sessionError) {
      console.error('Session creation error:', sessionError);
      console.error('Session error details:', sessionError.message);
      console.error('Session error code:', sessionError.code);
      return;
    }
    
    console.log('Session created:', sessionData);
    
    // Clean up
    await supabase
      .from('sessions')
      .delete()
      .eq('code', testCode);
    
    console.log('Test session deleted');
    console.log('✅ Supabase connection is working!');
    
  } catch (err) {
    console.error('Test failed:', err);
    console.error('Error details:', err.message);
  }
}

testConnection();
