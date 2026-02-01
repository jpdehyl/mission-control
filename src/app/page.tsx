"use client";

import { useEffect, useState, useCallback } from "react";
import { UserButton } from "@clerk/nextjs";
import { createClient, isSupabaseConfigured, Agent, Task, Activity } from "@/lib/supabase";
import { KanbanBoard } from "@/components/kanban";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";

export default function Dashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium",
    assignee_id: "",
    due_date: "",
  });
  const [creating, setCreating] = useState(false);
  const [showAgentPanel, setShowAgentPanel] = useState(true);
  const [showActivityPanel, setShowActivityPanel] = useState(true);

  const fetchData = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setConfigError(true);
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      const [agentsRes, tasksRes, activitiesRes] = await Promise.all([
        supabase.from("mc_agents").select("*").order("name"),
        supabase.from("mc_tasks").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("mc_activity").select("*").order("created_at", { ascending: false }).limit(30),
      ]);

      if (agentsRes.data) setAgents(agentsRes.data);
      if (tasksRes.data) setTasks(tasksRes.data);
      if (activitiesRes.data) setActivities(activitiesRes.data);
    } catch {
      setConfigError(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // 'n' for new task
      if (e.key === "n" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setShowForm(true);
      }
      // 'r' for refresh
      if (e.key === "r" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        fetchData();
      }
      // '1' toggle agents
      if (e.key === "1") {
        setShowAgentPanel((prev) => !prev);
      }
      // '2' toggle activity
      if (e.key === "2") {
        setShowActivityPanel((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [fetchData]);

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);

    try {
      const supabase = createClient();

      const { data: task, error } = await supabase
        .from("mc_tasks")
        .insert({
          title: newTask.title,
          description: newTask.description || null,
          priority: newTask.priority,
          status: newTask.assignee_id ? "assigned" : "inbox",
          due_date: newTask.due_date || null,
        })
        .select()
        .single();

      if (error) throw error;

      if (newTask.assignee_id && task) {
        await supabase.from("mc_task_assignees").insert({
          task_id: task.id,
          agent_id: newTask.assignee_id,
        });
      }

      if (task) {
        await supabase.from("mc_activity").insert({
          activity_type: "task_created",
          message: `New task: "${newTask.title}"`,
          task_id: task.id,
        });
      }

      setNewTask({ title: "", description: "", priority: "medium", assignee_id: "", due_date: "" });
      setShowForm(false);
      fetchData();
    } catch (err) {
      console.error("Error creating task:", err);
    }

    setCreating(false);
  }

  // Task operations for KanbanBoard
  const handleTaskUpdate = useCallback(async (taskId: string, updates: Partial<Task>) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update task");
      }

      // Optimistically update local state
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, ...updates, updated_at: new Date().toISOString() } : t))
      );
    } catch (err) {
      console.error("Failed to update task:", err);
      throw err;
    }
  }, []);

  const handleTaskDelete = useCallback(async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete task");
      }

      // Remove from local state
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      console.error("Failed to delete task:", err);
      throw err;
    }
  }, []);

  const handleAddComment = useCallback(async (taskId: string, content: string) => {
    try {
      const supabase = createClient();
      await supabase.from("mc_messages").insert({
        task_id: taskId,
        content,
      });
    } catch (err) {
      console.error("Failed to add comment:", err);
      throw err;
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading Mission Control...</p>
        </div>
      </div>
    );
  }

  if (configError) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Mission Control Setup Required</h1>
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <p className="text-gray-300 mb-4">
              Supabase is not configured. Add environment variables in Vercel.
            </p>
            <div className="bg-gray-800 rounded p-4 mb-4">
              <pre className="text-sm text-green-400 overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-anon-key`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 p-4 flex justify-between items-center flex-shrink-0">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Mission Control</h1>
            <p className="text-gray-400 text-sm">DeHyl Agent Squad</p>
          </div>
          <div className="hidden md:flex gap-2 ml-4">
            <button
              onClick={() => setShowAgentPanel((prev) => !prev)}
              className={`px-3 py-1 rounded text-sm transition ${
                showAgentPanel ? "bg-blue-600" : "bg-gray-800"
              }`}
              title="Toggle Agents Panel (1)"
            >
              Agents
            </button>
            <button
              onClick={() => setShowActivityPanel((prev) => !prev)}
              className={`px-3 py-1 rounded text-sm transition ${
                showActivityPanel ? "bg-blue-600" : "bg-gray-800"
              }`}
              title="Toggle Activity Panel (2)"
            >
              Activity
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-gray-500 text-sm hidden sm:block">
            Press <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-xs">n</kbd> for new task
          </span>
          <Button onClick={() => setShowForm(true)}>+ New Task</Button>
          <UserButton
            afterSignOutUrl="/sign-in"
            appearance={{
              elements: {
                avatarBox: "w-9 h-9",
              },
            }}
          />
        </div>
      </header>

      {/* Task Creation Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="New Task" size="md">
        <form onSubmit={createTask} className="p-6 space-y-4">
          <Input
            label="Title *"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            placeholder="e.g., Review invoices from Certified"
            required
            autoFocus
          />
          <Textarea
            label="Description"
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            placeholder="Task details..."
            rows={3}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Priority"
              value={newTask.priority}
              onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
              options={[
                { value: "low", label: "Low" },
                { value: "medium", label: "Medium" },
                { value: "high", label: "High" },
                { value: "urgent", label: "Urgent" },
              ]}
            />
            <Select
              label="Assign to"
              value={newTask.assignee_id}
              onChange={(e) => setNewTask({ ...newTask, assignee_id: e.target.value })}
              options={[
                { value: "", label: "Unassigned" },
                ...agents.map((agent) => ({
                  value: agent.id,
                  label: `${agent.name} (${agent.role})`,
                })),
              ]}
            />
          </div>
          <Input
            label="Due Date"
            type="date"
            value={newTask.due_date}
            onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
          />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" loading={creating} disabled={!newTask.title} className="flex-1">
              Create Task
            </Button>
          </div>
        </form>
      </Modal>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Agents Panel */}
        {showAgentPanel && (
          <div className="w-64 border-r border-gray-800 p-4 overflow-y-auto flex-shrink-0 hidden lg:block">
            <h2 className="text-sm font-semibold mb-3 text-gray-400 uppercase tracking-wide">
              Agents ({agents.length})
            </h2>
            <div className="space-y-2">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className="bg-gray-900 rounded-lg p-3 border border-gray-800 hover:border-gray-700 transition"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{agent.name}</span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        agent.status === "active"
                          ? "bg-green-500"
                          : agent.status === "blocked"
                          ? "bg-red-500"
                          : "bg-gray-500"
                      }`}
                      title={agent.status}
                    />
                  </div>
                  <p className="text-xs text-gray-500">{agent.role}</p>
                  {agent.last_heartbeat && (
                    <p className="text-xs text-gray-600 mt-1">
                      Last seen: {new Date(agent.last_heartbeat).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              ))}
              {agents.length === 0 && (
                <p className="text-gray-500 text-sm">No agents registered</p>
              )}
            </div>
          </div>
        )}

        {/* Kanban Board */}
        <div className="flex-1 p-4 overflow-auto">
          <KanbanBoard
            tasks={tasks}
            onTaskUpdate={handleTaskUpdate}
            onTaskDelete={handleTaskDelete}
            onAddComment={handleAddComment}
            onRefresh={fetchData}
          />
        </div>

        {/* Activity Panel */}
        {showActivityPanel && (
          <div className="w-72 border-l border-gray-800 p-4 overflow-y-auto flex-shrink-0 hidden xl:block">
            <h2 className="text-sm font-semibold mb-3 text-gray-400 uppercase tracking-wide">
              Recent Activity
            </h2>
            {activities.length === 0 ? (
              <p className="text-gray-500 text-sm">No activity yet</p>
            ) : (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="text-sm border-b border-gray-800 pb-3 last:border-0"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg">
                        {activity.activity_type === "task_created" && "📝"}
                        {activity.activity_type === "task_updated" && "✏️"}
                        {activity.activity_type === "task_deleted" && "🗑️"}
                        {!["task_created", "task_updated", "task_deleted"].includes(
                          activity.activity_type
                        ) && "📡"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-300 leading-tight">{activity.message}</p>
                        <p className="text-gray-600 text-xs mt-1">
                          {new Date(activity.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Help */}
      <footer className="border-t border-gray-800 px-4 py-2 text-xs text-gray-600 flex-shrink-0 hidden sm:block">
        <span className="mr-4">
          <kbd className="px-1 py-0.5 bg-gray-800 rounded">n</kbd> New task
        </span>
        <span className="mr-4">
          <kbd className="px-1 py-0.5 bg-gray-800 rounded">r</kbd> Refresh
        </span>
        <span className="mr-4">
          <kbd className="px-1 py-0.5 bg-gray-800 rounded">1</kbd> Toggle agents
        </span>
        <span className="mr-4">
          <kbd className="px-1 py-0.5 bg-gray-800 rounded">2</kbd> Toggle activity
        </span>
        <span>
          <kbd className="px-1 py-0.5 bg-gray-800 rounded">Esc</kbd> Close modal
        </span>
      </footer>
    </div>
  );
}
