"use client";

import { useEffect, useState } from "react";
import { createClient, isSupabaseConfigured, Agent, Task, Activity } from "@/lib/supabase";

export default function Dashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState(false);

  useEffect(() => {
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
          supabase.from("mc_tasks").select("*").order("created_at", { ascending: false }).limit(20),
          supabase.from("mc_activity").select("*").order("created_at", { ascending: false }).limit(10),
        ]);

        if (agentsRes.data) setAgents(agentsRes.data);
        if (tasksRes.data) setTasks(tasksRes.data);
        if (activitiesRes.data) setActivities(activitiesRes.data);
      } catch {
        setConfigError(true);
      }
      setLoading(false);
    }

    fetchData();
  }, []);

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
          <h1 className="text-3xl font-bold mb-6">Mission Control Setup Required</h1>
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <p className="text-gray-300 mb-4">
              Supabase is not configured. To get started, you need to set up your environment variables.
            </p>
            <div className="bg-gray-800 rounded p-4 mb-4">
              <p className="text-sm text-gray-400 mb-2">Add these to your <code className="text-blue-400">.env.local</code> file:</p>
              <pre className="text-sm text-green-400 overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key`}
              </pre>
            </div>
            <p className="text-gray-400 text-sm">
              You can find these values in your{" "}
              <a
                href="https://supabase.com/dashboard/project/_/settings/api"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                Supabase project settings
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    );
  }

  const tasksByStatus = {
    inbox: tasks.filter(t => t.status === "inbox"),
    assigned: tasks.filter(t => t.status === "assigned"),
    in_progress: tasks.filter(t => t.status === "in_progress"),
    review: tasks.filter(t => t.status === "review"),
    done: tasks.filter(t => t.status === "done"),
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 p-4">
        <h1 className="text-2xl font-bold">🚀 Mission Control</h1>
        <p className="text-gray-400">DeHyl Agent Squad</p>
      </header>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Agents Panel */}
        <div className="lg:col-span-1">
          <h2 className="text-lg font-semibold mb-4">👥 Agents</h2>
          <div className="space-y-3">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="bg-gray-900 rounded-lg p-4 border border-gray-800"
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
          <h2 className="text-lg font-semibold mb-4">📋 Tasks</h2>
          <div className="grid grid-cols-3 gap-4">
            {/* Inbox */}
            <div className="bg-gray-900 rounded-lg p-3 border border-gray-800">
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
            <div className="bg-gray-900 rounded-lg p-3 border border-gray-800">
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
            <div className="bg-gray-900 rounded-lg p-3 border border-gray-800">
              <h3 className="text-sm font-medium text-green-400 mb-3">
                ✅ Done ({tasksByStatus.done.length})
              </h3>
              <div className="space-y-2">
                {tasksByStatus.done.slice(0, 5).map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="lg:col-span-1">
          <h2 className="text-lg font-semibold mb-4">📡 Activity</h2>
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
            {activities.length === 0 ? (
              <p className="text-gray-500 text-sm">No activity yet</p>
            ) : (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div key={activity.id} className="text-sm">
                    <p className="text-gray-300">{activity.message}</p>
                    <p className="text-gray-600 text-xs">
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

  return (
    <div
      className={`bg-gray-800 rounded p-2 border-l-2 ${priorityColors[task.priority]}`}
    >
      <p className="text-sm font-medium truncate">{task.title}</p>
      {task.description && (
        <p className="text-xs text-gray-500 truncate">{task.description}</p>
      )}
    </div>
  );
}
