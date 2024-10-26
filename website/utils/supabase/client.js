import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    "https://ktgqzkosmrtfgeppcfty.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0Z3F6a29zbXJ0ZmdlcHBjZnR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk5MzIxMzIsImV4cCI6MjA0NTUwODEzMn0.9WkDviNluCrctVuC362FLND_i0c_zEPiPfW_LhMBrwk"
  ) 
}