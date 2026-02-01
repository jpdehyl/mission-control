import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

// POST /api/notify - Send a notification/mention to an agent
// Body: { to_session: string, from_session?: string, task_id?: string, content: string }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to_session, from_session, task_id, content } = body;

    if (!to_session || !content) {
      return NextResponse.json({ error: "to_session and content required" }, { status: 400 });
    }

    const supabase = createServerClient();

    // Get target agent
    const { data: toAgent } = await supabase
      .from("mc_agents")
      .select("id, name")
      .eq("session_key", to_session)
      .single();

    if (!toAgent) {
      return NextResponse.json({ error: "Target agent not found" }, { status: 404 });
    }

    // Get sender if specified
    let fromAgentId = null;
    if (from_session) {
      const { data: fromAgent } = await supabase
        .from("mc_agents")
        .select("id")
        .eq("session_key", from_session)
        .single();
      fromAgentId = fromAgent?.id;
    }

    // Create notification
    const { data: notification, error } = await supabase
      .from("mc_notifications")
      .insert({
        mentioned_agent_id: toAgent.id,
        from_agent_id: fromAgentId,
        task_id: task_id || null,
        content,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ notification, sent_to: toAgent.name }, { status: 201 });
  } catch (err) {
    console.error("Notify POST error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// GET /api/notify?session=xxx - Get pending notifications for an agent
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const session = searchParams.get("session");
    const markDelivered = searchParams.get("mark_delivered") !== "false";

    if (!session) {
      return NextResponse.json({ error: "session required" }, { status: 400 });
    }

    const supabase = createServerClient();

    // Get agent
    const { data: agent } = await supabase
      .from("mc_agents")
      .select("id")
      .eq("session_key", session)
      .single();

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    // Get undelivered notifications
    const { data: notifications, error } = await supabase
      .from("mc_notifications")
      .select("*, mc_agents!mc_notifications_from_agent_id_fkey(name)")
      .eq("mentioned_agent_id", agent.id)
      .eq("delivered", false)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Mark as delivered if requested
    if (markDelivered && notifications && notifications.length > 0) {
      await supabase
        .from("mc_notifications")
        .update({ delivered: true })
        .in("id", notifications.map(n => n.id));
    }

    return NextResponse.json({ notifications });
  } catch (err) {
    console.error("Notify GET error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
