import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://patqbcvvcywmcchdsqml.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhdHFiY3Z2Y3l3bWNjaGRzcW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MzgzNDksImV4cCI6MjA2NjAxNDM0OX0.u75n6-XB4D6dq0BwC-Yt4yhCuHttw2Bn59EoAAxZ_M8";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
