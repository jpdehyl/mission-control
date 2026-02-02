"use client";

import { useEffect, useState } from "react";
import { AgentCard } from "@/components/agents/AgentCard";

interface Agent {
  id: string;
  name: string;
  role?: string;
  session_key: string;
  status: "active" | "idle" | "offline";
  last_heartbeat?: string;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  useEffect(() => {
    fetchAgents();
  }, []);

  async function fetchAgents() {
    try {
      const res = await fetch("/api/agents");
      const data = await res.json();
      setAgents(data.agents || []);
    } catch (err) {
      console.error("Error fetching agents:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-6">Agents</h1>
          <div className="text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">🤖 Agent Squad</h1>
          <div className="text-sm text-gray-400">
            {agents.length} agents
          </div>
        </div>

        {agents.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">No agents registered yet</div>
            <p className="text-sm text-gray-500">
              Agents register when they send their first heartbeat
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                selected={selectedAgent === agent.id}
                onClick={() => setSelectedAgent(agent.id)}
              />
            ))}
          </div>
        )}

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-400">
              {agents.filter(a => a.status === "active").length}
            </div>
            <div className="text-sm text-gray-400">Active</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-400">
              {agents.filter(a => a.status === "idle").length}
            </div>
            <div className="text-sm text-gray-400">Idle</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-400">
              {agents.filter(a => a.status === "offline").length}
            </div>
            <div className="text-sm text-gray-400">Offline</div>
          </div>
        </div>
      </div>
    </div>
  );
}
