"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";

interface Agent {
  id: string;
  name: string;
  role?: string;
  session_key: string;
  status: "active" | "idle" | "offline";
  last_heartbeat?: string;
}

interface AgentCardProps {
  agent: Agent;
  onClick?: () => void;
  selected?: boolean;
}

const statusColors = {
  active: "bg-green-500",
  idle: "bg-yellow-500",
  offline: "bg-gray-500",
};

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

export function AgentCard({ agent, onClick, selected }: AgentCardProps) {
  const router = useRouter();
  const emoji = agentEmojis[agent.name.toLowerCase()] || "🤖";
  const timeSinceHeartbeat = agent.last_heartbeat
    ? getTimeSince(new Date(agent.last_heartbeat))
    : "never";
  
  const handleClick = () => {
    if (onClick) onClick();
    router.push(`/agents/${agent.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className={`
        p-4 rounded-lg border cursor-pointer transition-all
        ${selected 
          ? "border-blue-500 bg-blue-500/10" 
          : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
        }
      `}
    >
      <div className="flex items-center gap-3">
        <div className="text-3xl">{emoji}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white">{agent.name}</span>
            <span className={`w-2 h-2 rounded-full ${statusColors[agent.status]}`} />
          </div>
          {agent.role && (
            <div className="text-sm text-gray-400">{agent.role}</div>
          )}
        </div>
        <Badge variant={agent.status === "active" ? "success" : "secondary"}>
          {agent.status}
        </Badge>
      </div>
      <div className="mt-2 text-xs text-gray-500">
        Last heartbeat: {timeSinceHeartbeat}
      </div>
    </div>
  );
}

function getTimeSince(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
