import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";

// Default to demo project if no env vars are set
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || "https://xyzcompany.supabase.co";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example";

// Only create the client if we have valid credentials
if (!supabaseUrl.includes("supabase.co")) {
  console.warn(
    "Missing Supabase URL. Please set VITE_SUPABASE_URL in your .env file",
  );
}

if (!supabaseAnonKey.startsWith("eyJ")) {
  console.warn(
    "Missing Supabase Anon Key. Please set VITE_SUPABASE_ANON_KEY in your .env file",
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: "pkce",
    storageKey: "auth-storage-key",
    storage: window.localStorage,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  db: {
    schema: "public",
  },
  global: {
    headers: {
      "Cache-Control": "max-age=300, s-maxage=600",
    },
  },
});
