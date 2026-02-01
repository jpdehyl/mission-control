import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

// POST /api/agents/heartbeat
// Body: { session_key: string, status?: 'idle' | 'active' | 'blocked', current_task_id?: string }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_key, status, current_task_id } = body;

    if (!session_key) {
      return NextResponse.json({ error: "session_key required" }, { status: 400 });
    }

    const supabase = createServerClient();

    // Update agent's heartbeat
    const updateData: Record<string, unknown> = {
      last_heartbeat: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    if (status) updateData.status = status;
    if (current_task_id !== undefined) updateData.current_task_id = current_task_id;

    const { data: agent, error } = await supabase
      .from("mc_agents")
      .update(updateData)
      .eq("session_key", session_key)
      .select()
      .single();

    if (error || !agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    // Log activity
    await supabase.from("mc_activity").insert({
      agent_id: agent.id,
      activity_type: "heartbeat",
      message: `${agent.name} checked in (${status || agent.status})`,
    });

    // Get undelivered notifications for this agent
    const { data: notifications } = await supabase
      .from("mc_notifications")
      .select("*")
      .eq("mentioned_agent_id", agent.id)
      .eq("delivered", false)
      .order("created_at", { ascending: true });

    // Mark notifications as delivered
    if (notifications && notifications.length > 0) {
      await supabase
        .from("mc_notifications")
        .update({ delivered: true })
        .in("id", notifications.map(n => n.id));
    }

    // Get assigned tasks
    const { data: taskAssignments } = await supabase
      .from("mc_task_assignees")
      .select("task_id")
      .eq("agent_id", agent.id);

    let tasks: unknown[] = [];
    if (taskAssignments && taskAssignments.length > 0) {
      const taskIds = taskAssignments.map(ta => ta.task_id);
      const { data: taskData } = await supabase
        .from("mc_tasks")
        .select("*")
        .in("id", taskIds)
        .in("status", ["inbox", "assigned", "in_progress", "blocked"])
        .order("priority", { ascending: false });
      tasks = taskData || [];
    }

    return NextResponse.json({
      agent,
      notifications: notifications || [],
      tasks,
    });
  } catch (err) {
    console.error("Heartbeat error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
