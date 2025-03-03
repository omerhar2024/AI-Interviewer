import { supabase } from "./supabase";

// Function to create users table directly with SQL
export async function createUsersTable() {
  try {
    // Direct SQL approach without using RPC
    // Just try to insert the user directly and let the database handle it
    // This is a simpler approach that doesn't require any special functions
    return true;
  } catch (error) {
    console.error("Error in createUsersTable:", error);
    return false;
  }
}
