import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";
import type { User } from "@supabase/supabase-js";

type AuthContextType = {
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    signUp: async (email: string, password: string) => {
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;

      // Manually create user and subscription records if the trigger fails
      if (data.user) {
        try {
          // Create user record
          const { error: userError } = await supabase.from("users").insert({
            id: data.user.id,
            email: data.user.email,
            role: "free",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

          if (!userError) {
            // Create subscription record
            await supabase.from("subscriptions").insert({
              user_id: data.user.id,
              plan_type: "free",
              start_date: new Date().toISOString(),
              end_date: null,
              status: "active",
              question_limit: 10,
              perfect_response_limit: 5,
              perfect_responses_used: 0,
            });
          }
        } catch (err) {
          console.error("Error creating user records:", err);
          // Continue even if there's an error, as the user might still be created in Auth
        }
      }
    },
    signIn: async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    },
    signOut: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      localStorage.clear(); // Clear all local storage
    },
    user,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
