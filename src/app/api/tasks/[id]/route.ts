import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

// GET /api/tasks/[id] - Get a single task with details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerClient();

    const { data: task, error } = await supabase
      .from("mc_tasks")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Get assignees
    const { data: assignments } = await supabase
      .from("mc_task_assignees")
      .select("agent_id, mc_agents(name, session_key)")
      .eq("task_id", id);

    // Get messages
    const { data: messages } = await supabase
      .from("mc_messages")
      .select("*, mc_agents(name)")
      .eq("task_id", id)
      .order("created_at", { ascending: true });

    return NextResponse.json({
      task,
      assignees: assignments || [],
      messages: messages || [],
    });
  } catch (err) {
    console.error("Task GET error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// PATCH /api/tasks/[id] - Update task status/details
// Body: { status?, priority?, agent_session? (for logging who made the change) }
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, priority, agent_session, message } = body;

    const supabase = createServerClient();

    // Get agent if specified
    let agentId = null;
    let agentName = "System";
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

    // Get current task
    const { data: currentTask } = await supabase
      .from("mc_tasks")
      .select("*")
      .eq("id", id)
      .single();

    if (!currentTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Build update
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;

    // Update task
    const { data: task, error } = await supabase
      .from("mc_tasks")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Add message/comment if provided
    if (message) {
      await supabase.from("mc_messages").insert({
        task_id: id,
        from_agent_id: agentId,
        content: message,
      });
    }

    // Log activity
    const changes: string[] = [];
    if (status && status !== currentTask.status) {
      changes.push(`status: ${currentTask.status} → ${status}`);
    }
    if (priority && priority !== currentTask.priority) {
      changes.push(`priority: ${currentTask.priority} → ${priority}`);
    }

    if (changes.length > 0) {
      await supabase.from("mc_activity").insert({
        agent_id: agentId,
        activity_type: "task_updated",
        message: `${agentName} updated "${currentTask.title}": ${changes.join(", ")}`,
        task_id: id,
      });
    }

    return NextResponse.json({ task });
  } catch (err) {
    console.error("Task PATCH error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
