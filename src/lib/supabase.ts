import { createBrowserClient } from "@supabase/ssr";

export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables."
    );
  }

  return createBrowserClient(url, anonKey);
}

// Types for Mission Control tables
export interface Agent {
  id: string;
  name: string;
  role: string;
  session_key: string;
  status: 'idle' | 'active' | 'blocked';
  current_task_id: string | null;
  last_heartbeat: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'inbox' | 'assigned' | 'in_progress' | 'review' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_by: string | null;
  created_at: string;
  updated_at: string;
  due_date: string | null;
}

export interface Message {
  id: string;
  task_id: string;
  from_agent_id: string | null;
  content: string;
  created_at: string;
}

export interface Activity {
  id: string;
  agent_id: string | null;
  activity_type: string;
  message: string;
  task_id: string | null;
  created_at: string;
}
