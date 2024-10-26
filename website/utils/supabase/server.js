import { createServerClient} from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    "https://ktgqzkosmrtfgeppcfty.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0Z3F6a29zbXJ0ZmdlcHBjZnR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk5MzIxMzIsImV4cCI6MjA0NTUwODEzMn0.9WkDviNluCrctVuC362FLND_i0c_zEPiPfW_LhMBrwk",

    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}