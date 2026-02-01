import { NextResponse } from "next/server";

export async function GET() {
  const hasUrl = !!(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL);
  const hasKey = !!(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY);
  
  return NextResponse.json({
    status: hasUrl && hasKey ? "ok" : "missing_config",
    config: {
      supabase_url: hasUrl,
      supabase_key: hasKey,
    },
    env_names_checked: [
      "NEXT_PUBLIC_SUPABASE_URL",
      "SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY", 
      "SUPABASE_ANON_KEY"
    ]
  });
}
