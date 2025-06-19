import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@seriously-ai/shared'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

export const createClient = async () => {
  const cookieStore = await cookies()

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore.set({ 
            name, 
            value, 
            ...options,
            // Ensure session cookies last for the full session duration
            maxAge: options.maxAge || 7 * 24 * 60 * 60, // 7 days in seconds
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
          })
        } catch (error) {
          // The `set` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
      remove(name: string, options: any) {
        try {
          cookieStore.set({ 
            name, 
            value: '', 
            ...options,
            maxAge: 0,
          })
        } catch (error) {
          // The `delete` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
    auth: {
      flowType: 'pkce',
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      debug: process.env.NODE_ENV === 'development',
    },
    global: {
      headers: {
        'x-client-info': 'seriously-ai-web-server',
      },
    },
  })
}

// Helper function for creating a client instance
export const getSupabaseClient = () => createClient() 