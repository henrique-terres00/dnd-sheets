// Test RLS policies
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRLSPolicies() {
  try {
    console.log('Testing RLS policies...');
    
    // First, let's check existing policies
    console.log('Checking existing policies...');
    
    const { data: policies, error: policyError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'sessions');
    
    if (policyError) {
      console.log('Cannot check policies (expected):', policyError.message);
    } else {
      console.log('Existing policies:', policies);
    }
    
    // Try to delete the existing test session first
    console.log('Attempting to delete existing DELETE_TEST session...');
    
    const { data: deleteResult, error: deleteError } = await supabase
      .from('sessions')
      .delete()
      .eq('code', 'DELETE_TEST')
      .select();
    
    if (deleteError) {
      console.log('Delete error:', deleteError);
      console.log('Delete error code:', deleteError.code);
      console.log('Delete error message:', deleteError.message);
    } else {
      console.log('Delete result:', deleteResult);
    }
    
    // Check if session still exists
    const { data: checkResult, error: checkError } = await supabase
      .from('sessions')
      .select('*')
      .eq('code', 'DELETE_TEST');
    
    if (checkError) {
      console.log('Check error:', checkError);
    } else {
      console.log('Session still exists:', checkResult);
    }
    
  } catch (err) {
    console.error('Test failed:', err);
  }
}

testRLSPolicies();
