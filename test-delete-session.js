// Test delete session function
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key exists:', !!supabaseAnonKey);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDeleteSession() {
  try {
    console.log('Testing delete session function...');
    
    // First create a test session
    const testCode = 'DELETE_TEST';
    console.log('Creating test session:', testCode);
    
    const { data: createdSession, error: createError } = await supabase
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
    
    if (createError) {
      console.error('Error creating test session:', createError);
      return;
    }
    
    console.log('Test session created:', createdSession);
    
    // Now try to delete it
    console.log('Deleting session:', testCode);
    
    const { data: deletedData, error: deleteError } = await supabase
      .from('sessions')
      .delete()
      .eq('code', testCode)
      .select(); // Add .select() to return deleted data
    
    if (deleteError) {
      console.error('Error deleting session:', deleteError);
      return;
    }
    
    console.log('Delete result:', deletedData);
    
    // Check if session still exists
    console.log('Checking if session still exists...');
    
    const { data: checkData, error: checkError } = await supabase
      .from('sessions')
      .select('*')
      .eq('code', testCode)
      .single();
    
    if (checkError && checkError.code === 'PGRST116') {
      console.log('✅ Session successfully deleted - no longer found');
    } else if (checkError) {
      console.error('Error checking session:', checkError);
    } else {
      console.log('❌ Session still exists:', checkData);
    }
    
  } catch (err) {
    console.error('Test failed:', err);
  }
}

testDeleteSession();
