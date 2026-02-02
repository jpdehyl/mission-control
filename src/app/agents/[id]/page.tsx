"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

interface Agent {
  id: string;
  name: string;
  role?: string;
  session_key: string;
  status: "active" | "idle" | "offline";
  last_heartbeat?: string;
}

type TabType = "soul" | "tools" | "tasks" | "logs";

const agentEmojis: Record<string, string> = {
  robbie: "🤖",
  adan: "💻",
  adam: "💰",
  amanda: "🛠️",
  leo: "🎨",
  maya: "📣",
  zaldy: "📐",
  main: "🤖",
};

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("soul");

  useEffect(() => {
    fetchAgent();
  }, [params.id]);

  async function fetchAgent() {
    try {
      const res = await fetch("/api/agents");
      const data = await res.json();
      const found = data.agents?.find((a: Agent) => a.id === params.id);
      setAgent(found || null);
    } catch (err) {
      console.error("Error fetching agent:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-8">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-gray-900 p-8">
        <div className="text-red-400">Agent not found</div>
        <Button onClick={() => router.push("/agents")} className="mt-4">
          Back to Agents
        </Button>
      </div>
    );
  }

  const emoji = agentEmojis[agent.name.toLowerCase()] || "🤖";

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-800 p-6">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => router.push("/agents")}
            className="text-gray-400 hover:text-white mb-4 flex items-center gap-2"
          >
            ← Back to Agents
          </button>
          <div className="flex items-center gap-4">
            <div className="text-5xl">{emoji}</div>
            <div>
              <h1 className="text-2xl font-bold text-white">{agent.name}</h1>
              {agent.role && (
                <p className="text-gray-400">{agent.role}</p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span className={`w-2 h-2 rounded-full ${
                  agent.status === "active" ? "bg-green-500" :
                  agent.status === "idle" ? "bg-yellow-500" : "bg-gray-500"
                }`} />
                <span className="text-sm text-gray-400">{agent.status}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto flex gap-1 p-2">
          {(["soul", "tools", "tasks", "logs"] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                activeTab === tab
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-6">
        {activeTab === "soul" && <SoulTab agent={agent} />}
        {activeTab === "tools" && <ToolsTab agent={agent} />}
        {activeTab === "tasks" && <TasksTab agent={agent} />}
        {activeTab === "logs" && <LogsTab agent={agent} />}
      </div>
    </div>
  );
}

function SoulTab({ agent }: { agent: Agent }) {
  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-medium text-white mb-4">Agent Info</h3>
        <dl className="space-y-3">
          <div>
            <dt className="text-sm text-gray-400">Session Key</dt>
            <dd className="text-white font-mono text-sm">{agent.session_key}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-400">Last Heartbeat</dt>
            <dd className="text-white">
              {agent.last_heartbeat 
                ? new Date(agent.last_heartbeat).toLocaleString()
                : "Never"}
            </dd>
          </div>
        </dl>
      </div>
      
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-medium text-white mb-4">SOUL.md</h3>
        <p className="text-gray-400 text-sm">
          Agent soul file content will be displayed here when OpenClaw integration is complete.
        </p>
      </div>
    </div>
  );
}

function ToolsTab({ agent }: { agent: Agent }) {
  const toolCategories = [
    {
      name: "Fs",
      tools: ["read", "write", "edit", "apply_patch"],
    },
    {
      name: "Runtime",
      tools: ["exec", "process"],
    },
    {
      name: "Web",
      tools: ["web_search", "web_fetch"],
    },
    {
      name: "Memory",
      tools: ["memory_search", "memory_get"],
    },
    {
      name: "Sessions",
      tools: ["sessions_list", "sessions_history", "sessions_send", "sessions_spawn", "session_status", "agents_list"],
    },
    {
      name: "UI",
      tools: ["browser", "canvas"],
    },
    {
      name: "Messaging",
      tools: ["message", "tts"],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Presets */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-400 mb-3">Quick Presets</h3>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm">
            📊 Status
          </button>
          <button className="px-3 py-1.5 bg-gray-700 text-gray-300 rounded text-sm hover:bg-gray-600">
            💻 Coding
          </button>
          <button className="px-3 py-1.5 bg-gray-700 text-gray-300 rounded text-sm hover:bg-gray-600">
            💬 Messaging
          </button>
          <button className="px-3 py-1.5 bg-gray-700 text-gray-300 rounded text-sm hover:bg-gray-600">
            🔓 Full
          </button>
        </div>
      </div>

      {/* Tool Categories */}
      {toolCategories.map((category) => (
        <div key={category.name} className="bg-gray-800 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-medium text-white">{category.name}</h3>
            <span className="text-xs text-gray-500">0/{category.tools.length}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {category.tools.map((tool) => (
              <div
                key={tool}
                className="flex items-center justify-between p-2 bg-gray-900 rounded"
              >
                <span className="text-sm text-gray-300">{tool}</span>
                <button className="w-10 h-5 bg-gray-700 rounded-full relative">
                  <span className="absolute left-1 top-1 w-3 h-3 bg-gray-500 rounded-full" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="secondary">Enable All</Button>
        <Button variant="secondary">Disable All</Button>
      </div>
    </div>
  );
}

function TasksTab({ agent }: { agent: Agent }) {
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    fetchTasks();
  }, [agent]);

  async function fetchTasks() {
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      // Filter tasks assigned to this agent (if we had that field)
      setTasks(data.tasks?.slice(0, 5) || []);
    } catch (err) {
      console.error("Error fetching tasks:", err);
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-white">Recent Tasks</h3>
      {tasks.length === 0 ? (
        <p className="text-gray-400">No tasks assigned</p>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <div key={task.id} className="bg-gray-800 rounded-lg p-4">
              <div className="flex justify-between">
                <span className="text-white">{task.title}</span>
                <span className={`text-xs px-2 py-1 rounded ${
                  task.status === "done" ? "bg-green-900 text-green-300" :
                  task.status === "in_progress" ? "bg-blue-900 text-blue-300" :
                  "bg-gray-700 text-gray-300"
                }`}>
                  {task.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LogsTab({ agent }: { agent: Agent }) {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-lg font-medium text-white mb-4">Activity Logs</h3>
      <p className="text-gray-400 text-sm">
        Agent activity logs will be displayed here when logging is implemented.
      </p>
    </div>
  );
}
