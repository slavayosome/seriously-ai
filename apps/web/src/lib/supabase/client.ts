import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@seriously-ai/shared'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

export const createClient = () => 
  createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      flowType: 'pkce',
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      debug: process.env.NODE_ENV === 'development',
      // Session will be refreshed automatically when it expires
      // Server-side configuration will handle 7-day session timebox
    },
    // Configure storage to handle session persistence
    global: {
      headers: {
        'x-client-info': 'seriously-ai-web',
      },
    },
  })

export const supabase = createClient() 