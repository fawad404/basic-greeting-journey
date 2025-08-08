import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://hywkmccpblatkfsbnapn.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5d2ttY2NwYmxhdGtmc2JuYXBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2ODIxMTEsImV4cCI6MjA3MDI1ODExMX0.5TPSvRnhUTawD_iWS4hmIoXadOHHADQ8VaNHYeN1zuE";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);