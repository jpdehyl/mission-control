import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

// GET /api/agents - List all agents
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query = supabase
      .from("mc_agents")
      .select("*")
      .order("name", { ascending: true });

    if (status) {
      query = query.eq("status", status);
    }

    const { data: agents, error } = await query;

    if (error) {
      console.error("Error fetching agents:", error);
      return NextResponse.json({ error: "Failed to fetch agents" }, { status: 500 });
    }

    return NextResponse.json({ agents: agents || [] });
  } catch (err) {
    console.error("List agents error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// POST /api/agents - Create or upsert an agent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, role, session_key, status = "idle" } = body;

    if (!name || !session_key) {
      return NextResponse.json(
        { error: "name and session_key are required" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Upsert agent by session_key
    const { data: agent, error } = await supabase
      .from("mc_agents")
      .upsert(
        {
          name,
          role: role || null,
          session_key,
          status,
          last_heartbeat: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "session_key" }
      )
      .select()
      .single();

    if (error) {
      console.error("Error creating agent:", error);
      return NextResponse.json({ error: "Failed to create agent" }, { status: 500 });
    }

    return NextResponse.json({ agent }, { status: 201 });
  } catch (err) {
    console.error("Create agent error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
