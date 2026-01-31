"use client";

import { useEffect, useState } from "react";
import { createClient, isSupabaseConfigured, Agent, Task, Activity } from "@/lib/supabase";

export default function Dashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", description: "", priority: "medium", assignee_id: "" });
  const [creating, setCreating] = useState(false);

  async function fetchData() {
    if (!isSupabaseConfigured()) {
      setConfigError(true);
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      const [agentsRes, tasksRes, activitiesRes] = await Promise.all([
        supabase.from("mc_agents").select("*").order("name"),
        supabase.from("mc_tasks").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("mc_activity").select("*").order("created_at", { ascending: false }).limit(20),
      ]);

      if (agentsRes.data) setAgents(agentsRes.data);
      if (tasksRes.data) setTasks(tasksRes.data);
      if (activitiesRes.data) setActivities(activitiesRes.data);
    } catch {
      setConfigError(true);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

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
          message: `Nueva tarea: "${newTask.title}"`,
          task_id: task.id,
        });
      }

      setNewTask({ title: "", description: "", priority: "medium", assignee_id: "" });
      setShowForm(false);
      fetchData();
    } catch (err) {
      console.error("Error creating task:", err);
    }

    setCreating(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-8">
        <div className="animate-pulse">Loading Mission Control...</div>
      </div>
    );
  }

  if (configError) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">🚀 Mission Control Setup Required</h1>
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <p className="text-gray-300 mb-4">
              Supabase is not configured. Add environment variables in Vercel.
            </p>
            <div className="bg-gray-800 rounded p-4 mb-4">
              <pre className="text-sm text-green-400 overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL=https://pwcczlrjguvhvhnzupuv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tasksByStatus = {
    inbox: tasks.filter(t => t.status === "inbox" || t.status === "assigned"),
    in_progress: tasks.filter(t => t.status === "in_progress"),
    review: tasks.filter(t => t.status === "review"),
    done: tasks.filter(t => t.status === "done"),
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 p-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">🚀 Mission Control</h1>
          <p className="text-gray-400">DeHyl Agent Squad</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition"
        >
          + Nueva Tarea
        </button>
      </header>

      {/* Task Creation Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md border border-gray-700">
            <h2 className="text-xl font-bold mb-4">Nueva Tarea</h2>
            <form onSubmit={createTask} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Título *</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="Ej: Revisar invoices de Certified"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Descripción</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 h-24 focus:border-blue-500 focus:outline-none"
                  placeholder="Detalles de la tarea..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Prioridad</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
                  >
                    <option value="low">🟢 Baja</option>
                    <option value="medium">🔵 Media</option>
                    <option value="high">🟠 Alta</option>
                    <option value="urgent">🔴 Urgente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Asignar a</label>
                  <select
                    value={newTask.assignee_id}
                    onChange={(e) => setNewTask({ ...newTask, assignee_id: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
                  >
                    <option value="">Sin asignar</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name} ({agent.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating || !newTask.title}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 py-2 rounded disabled:opacity-50 transition"
                >
                  {creating ? "Creando..." : "Crear Tarea"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Agents Panel */}
        <div className="lg:col-span-1">
          <h2 className="text-lg font-semibold mb-4">👥 Agents ({agents.length})</h2>
          <div className="space-y-3">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="bg-gray-900 rounded-lg p-4 border border-gray-800 hover:border-gray-700 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{agent.name}</span>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      agent.status === "active"
                        ? "bg-green-900 text-green-300"
                        : agent.status === "blocked"
                        ? "bg-red-900 text-red-300"
                        : "bg-gray-800 text-gray-400"
                    }`}
                  >
                    {agent.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{agent.role}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tasks Kanban */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">📋 Tasks ({tasks.length})</h2>
          <div className="grid grid-cols-3 gap-4">
            {/* Inbox */}
            <div className="bg-gray-900 rounded-lg p-3 border border-gray-800 min-h-[250px]">
              <h3 className="text-sm font-medium text-gray-400 mb-3">
                📥 Inbox ({tasksByStatus.inbox.length})
              </h3>
              <div className="space-y-2">
                {tasksByStatus.inbox.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>

            {/* In Progress */}
            <div className="bg-gray-900 rounded-lg p-3 border border-gray-800 min-h-[250px]">
              <h3 className="text-sm font-medium text-yellow-400 mb-3">
                🔄 In Progress ({tasksByStatus.in_progress.length})
              </h3>
              <div className="space-y-2">
                {tasksByStatus.in_progress.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>

            {/* Done */}
            <div className="bg-gray-900 rounded-lg p-3 border border-gray-800 min-h-[250px]">
              <h3 className="text-sm font-medium text-green-400 mb-3">
                ✅ Done ({tasksByStatus.done.length})
              </h3>
              <div className="space-y-2">
                {tasksByStatus.done.slice(0, 8).map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="lg:col-span-1">
          <h2 className="text-lg font-semibold mb-4">📡 Activity</h2>
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 max-h-[400px] overflow-y-auto">
            {activities.length === 0 ? (
              <p className="text-gray-500 text-sm">No activity yet</p>
            ) : (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div key={activity.id} className="text-sm border-b border-gray-800 pb-2 last:border-0">
                    <p className="text-gray-300">{activity.message}</p>
                    <p className="text-gray-600 text-xs mt-1">
                      {new Date(activity.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskCard({ task }: { task: Task }) {
  const priorityColors = {
    low: "border-l-gray-600",
    medium: "border-l-blue-500",
    high: "border-l-orange-500",
    urgent: "border-l-red-500",
  };

  const priorityEmoji = {
    low: "🟢",
    medium: "🔵",
    high: "🟠",
    urgent: "🔴",
  };

  return (
    <div className={`bg-gray-800 rounded p-3 border-l-4 ${priorityColors[task.priority]} hover:bg-gray-750 transition`}>
      <div className="flex items-start gap-2">
        <span className="text-sm">{priorityEmoji[task.priority]}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-tight">{task.title}</p>
          {task.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
