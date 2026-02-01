import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

// GET /api/tasks - List tasks (with optional filters)
// Query params: status, priority, assignee_session
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const assigneeSession = searchParams.get("assignee_session");

    const supabase = createServerClient();

    let query = supabase
      .from("mc_tasks")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (status) query = query.eq("status", status);
    if (priority) query = query.eq("priority", priority);

    const { data: tasks, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Filter by assignee if specified
    if (assigneeSession && tasks) {
      const { data: agent } = await supabase
        .from("mc_agents")
        .select("id")
        .eq("session_key", assigneeSession)
        .single();

      if (agent) {
        const { data: assignments } = await supabase
          .from("mc_task_assignees")
          .select("task_id")
          .eq("agent_id", agent.id);

        const assignedTaskIds = new Set(assignments?.map(a => a.task_id) || []);
        return NextResponse.json({
          tasks: tasks.filter(t => assignedTaskIds.has(t.id)),
        });
      }
    }

    return NextResponse.json({ tasks });
  } catch (err) {
    console.error("Tasks GET error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// POST /api/tasks - Create a new task
// Body: { title, description?, priority?, assignee_session?, created_by_session? }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, priority, assignee_session, created_by_session } = body;

    if (!title) {
      return NextResponse.json({ error: "title required" }, { status: 400 });
    }

    const supabase = createServerClient();

    // Get creator agent if specified
    let creatorId = null;
    if (created_by_session) {
      const { data: creator } = await supabase
        .from("mc_agents")
        .select("id")
        .eq("session_key", created_by_session)
        .single();
      creatorId = creator?.id;
    }

    // Create task
    const { data: task, error } = await supabase
      .from("mc_tasks")
      .insert({
        title,
        description: description || null,
        priority: priority || "medium",
        status: assignee_session ? "assigned" : "inbox",
        created_by: creatorId,
      })
      .select()
      .single();

    if (error || !task) {
      return NextResponse.json({ error: error?.message || "Failed to create" }, { status: 500 });
    }

    // Assign to agent if specified
    if (assignee_session) {
      const { data: assignee } = await supabase
        .from("mc_agents")
        .select("id, name")
        .eq("session_key", assignee_session)
        .single();

      if (assignee) {
        await supabase.from("mc_task_assignees").insert({
          task_id: task.id,
          agent_id: assignee.id,
        });

        // Create notification for assignee
        await supabase.from("mc_notifications").insert({
          mentioned_agent_id: assignee.id,
          from_agent_id: creatorId,
          task_id: task.id,
          content: `Nueva tarea asignada: "${title}"`,
        });
      }
    }

    // Log activity
    await supabase.from("mc_activity").insert({
      agent_id: creatorId,
      activity_type: "task_created",
      message: `Nueva tarea: "${title}"`,
      task_id: task.id,
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (err) {
    console.error("Tasks POST error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
