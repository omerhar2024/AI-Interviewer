import { createClient } from "@supabase/supabase-js";

// Create a separate client for admin operations using the service role key
export const supabaseAdmin = createClient(
  import.meta.env.VITE_SUPABASE_URL || "",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5b291emZlY2ZhZ3B3dnBwcm14Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDI3NzcyOSwiZXhwIjoyMDU1ODUzNzI5fQ.bms8ZMGDhpMW5F2NstD-zDSoAGgdauF2J404O3gEhGU", // Service role key for admin operations
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
