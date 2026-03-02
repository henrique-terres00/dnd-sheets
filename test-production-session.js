// Test production session behavior
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key exists:', !!supabaseAnonKey);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testProductionSession() {
  try {
    console.log('Testing production session behavior...');
    
    // Test 1: Try to get a session that doesn't exist
    console.log('\n=== Test 1: Non-existent session ===');
    const fakeCode = 'FAKE123';
    console.log('Trying to get session:', fakeCode);
    
    const { data: fakeData, error: fakeError } = await supabase
      .from('sessions')
      .select('*')
      .eq('code', fakeCode.toUpperCase())
      .single();
    
    console.log('Fake session result:', { data: fakeData, error: fakeError });
    
    if (fakeError) {
      console.log('Fake session error code:', fakeError.code);
      console.log('Fake session error message:', fakeError.message);
    }
    
    // Test 2: List all existing sessions
    console.log('\n=== Test 2: List all sessions ===');
    const { data: allSessions, error: listError } = await supabase
      .from('sessions')
      .select('code, created_at, active_players, characters, rolls')
      .limit(10);
    
    if (listError) {
      console.error('Error listing sessions:', listError);
    } else {
      console.log('All sessions:', allSessions);
      console.log('Number of sessions:', allSessions?.length || 0);
    }
    
    // Test 3: Try to get a real session if any exist
    if (allSessions && allSessions.length > 0) {
      console.log('\n=== Test 3: Real session ===');
      const realCode = allSessions[0].code;
      console.log('Trying to get real session:', realCode);
      
      const { data: realData, error: realError } = await supabase
        .from('sessions')
        .select('*')
        .eq('code', realCode)
        .single();
      
      console.log('Real session result:', { data: realData, error: realError });
      
      if (realError) {
        console.log('Real session error code:', realError.code);
        console.log('Real session error message:', realError.message);
      }
    }
    
  } catch (err) {
    console.error('Test failed:', err);
  }
}

testProductionSession();
