import { NextResponse } from "next/server";

export async function GET() {
  const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
  
  return NextResponse.json({
    status: hasUrl && hasKey ? "ok" : "missing_config",
    config: {
      supabase_url: hasUrl,
      supabase_key: hasKey,
    },
  });
}
