import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gfbmjxlwtvxvuwxzpxfn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmYm1qeGx3dHZ4dnV3eHpweGZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNTkyODgsImV4cCI6MjA2OTkzNTI4OH0.peymxWCDYokLxefiD6v6iEVOL0i9qXWrvii7WzqX0r0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);