import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client for API routes
export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!url || !anonKey) {
    console.error("Supabase config missing:", { url: !!url, anonKey: !!anonKey });
    throw new Error("Supabase not configured - check env vars");
  }

  return createClient(url, anonKey);
}

// Re-export types
export type { Agent, Task, Message, Activity } from "./supabase";
