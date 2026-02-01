import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

// POST /api/messages - Add a message/comment to a task
// Body: { task_id, content, agent_session?, mentions?: string[] }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { task_id, content, agent_session, mentions } = body;

    if (!task_id || !content) {
      return NextResponse.json({ error: "task_id and content required" }, { status: 400 });
    }

    const supabase = createServerClient();

    // Get agent
    let agentId = null;
    let agentName = "Anonymous";
    if (agent_session) {
      const { data: agent } = await supabase
        .from("mc_agents")
        .select("id, name")
        .eq("session_key", agent_session)
        .single();
      if (agent) {
        agentId = agent.id;
        agentName = agent.name;
      }
    }

    // Verify task exists
    const { data: task } = await supabase
      .from("mc_tasks")
      .select("id, title")
      .eq("id", task_id)
      .single();

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Create message
    const { data: message, error } = await supabase
      .from("mc_messages")
      .insert({
        task_id,
        from_agent_id: agentId,
        content,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Handle @mentions
    if (mentions && mentions.length > 0) {
      // Get mentioned agents by name or session_key
      const { data: mentionedAgents } = await supabase
        .from("mc_agents")
        .select("id, name")
        .or(mentions.map((m: string) => `name.ilike.${m},session_key.eq.${m}`).join(","));

      if (mentionedAgents && mentionedAgents.length > 0) {
        const notifications = mentionedAgents.map(agent => ({
          mentioned_agent_id: agent.id,
          from_agent_id: agentId,
          task_id,
          content: `${agentName} te mencionó en "${task.title}": ${content.substring(0, 100)}`,
        }));

        await supabase.from("mc_notifications").insert(notifications);
      }
    }

    // Log activity
    await supabase.from("mc_activity").insert({
      agent_id: agentId,
      activity_type: "message_added",
      message: `${agentName} commented on "${task.title}"`,
      task_id,
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (err) {
    console.error("Messages POST error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
