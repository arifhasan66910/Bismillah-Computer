
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nulmmjmhgnusrfoopisl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51bG1tam1oZ251c3Jmb29waXNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1ODE2OTQsImV4cCI6MjA4NTE1NzY5NH0.98WOLGQdfRDxa8QVqFZSKD0RRFsCeiwhX2kDCIdisfc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
