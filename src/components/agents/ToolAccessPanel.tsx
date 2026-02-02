"use client";

import { useState } from "react";
import { ToolToggle } from "./ToolToggle";
import { Button } from "@/components/ui/Button";

interface ToolAccessPanelProps {
  agentId: string;
  initialTools?: Record<string, boolean>;
  onSave?: (tools: Record<string, boolean>) => void;
}

const TOOL_CATEGORIES = [
  {
    name: "Fs",
    description: "File system operations",
    tools: ["read", "write", "edit", "apply_patch"],
  },
  {
    name: "Runtime",
    description: "Command execution",
    tools: ["exec", "process"],
  },
  {
    name: "Web",
    description: "Web access",
    tools: ["web_search", "web_fetch"],
  },
  {
    name: "Memory",
    description: "Memory operations",
    tools: ["memory_search", "memory_get"],
  },
  {
    name: "Sessions",
    description: "Session management",
    tools: ["sessions_list", "sessions_history", "sessions_send", "sessions_spawn", "session_status", "agents_list"],
  },
  {
    name: "UI",
    description: "Browser and canvas",
    tools: ["browser", "canvas"],
  },
  {
    name: "Messaging",
    description: "Communication",
    tools: ["message", "tts", "voice_call"],
  },
];

const PRESETS = {
  status: ["session_status"],
  coding: ["read", "write", "edit", "exec", "process", "web_search", "web_fetch", "memory_search", "memory_get"],
  messaging: ["message", "tts", "sessions_send", "session_status"],
  full: TOOL_CATEGORIES.flatMap(c => c.tools),
};

export function ToolAccessPanel({ agentId, initialTools = {}, onSave }: ToolAccessPanelProps) {
  const [tools, setTools] = useState<Record<string, boolean>>(initialTools);
  const [hasChanges, setHasChanges] = useState(false);

  const toggleTool = (tool: string, enabled: boolean) => {
    setTools(prev => ({ ...prev, [tool]: enabled }));
    setHasChanges(true);
  };

  const applyPreset = (preset: keyof typeof PRESETS) => {
    const newTools: Record<string, boolean> = {};
    TOOL_CATEGORIES.forEach(cat => {
      cat.tools.forEach(tool => {
        newTools[tool] = PRESETS[preset].includes(tool);
      });
    });
    setTools(newTools);
    setHasChanges(true);
  };

  const enableAll = () => {
    const newTools: Record<string, boolean> = {};
    TOOL_CATEGORIES.forEach(cat => {
      cat.tools.forEach(tool => {
        newTools[tool] = true;
      });
    });
    setTools(newTools);
    setHasChanges(true);
  };

  const disableAll = () => {
    const newTools: Record<string, boolean> = {};
    TOOL_CATEGORIES.forEach(cat => {
      cat.tools.forEach(tool => {
        newTools[tool] = false;
      });
    });
    setTools(newTools);
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave?.(tools);
    setHasChanges(false);
  };

  const enabledCount = Object.values(tools).filter(Boolean).length;
  const totalCount = TOOL_CATEGORIES.reduce((sum, cat) => sum + cat.tools.length, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-white">Tool Access</h3>
          <p className="text-sm text-gray-400">{enabledCount}/{totalCount} tools enabled</p>
        </div>
        {hasChanges && (
          <Button onClick={handleSave}>Save Changes</Button>
        )}
      </div>

      {/* Quick Presets */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-400 mb-3">Quick Presets</h4>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => applyPreset("status")}
            className="px-3 py-1.5 bg-gray-700 text-gray-300 rounded text-sm hover:bg-gray-600"
          >
            📊 Status
          </button>
          <button
            onClick={() => applyPreset("coding")}
            className="px-3 py-1.5 bg-gray-700 text-gray-300 rounded text-sm hover:bg-gray-600"
          >
            💻 Coding
          </button>
          <button
            onClick={() => applyPreset("messaging")}
            className="px-3 py-1.5 bg-gray-700 text-gray-300 rounded text-sm hover:bg-gray-600"
          >
            💬 Messaging
          </button>
          <button
            onClick={() => applyPreset("full")}
            className="px-3 py-1.5 bg-gray-700 text-gray-300 rounded text-sm hover:bg-gray-600"
          >
            🔓 Full
          </button>
        </div>
      </div>

      {/* Tool Categories */}
      {TOOL_CATEGORIES.map((category) => {
        const categoryEnabled = category.tools.filter(t => tools[t]).length;
        return (
          <div key={category.name} className="bg-gray-800 rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h4 className="text-sm font-medium text-white">{category.name}</h4>
                <p className="text-xs text-gray-500">{category.description}</p>
              </div>
              <span className="text-xs text-gray-500">
                {categoryEnabled}/{category.tools.length}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {category.tools.map((tool) => (
                <ToolToggle
                  key={tool}
                  name={tool}
                  enabled={tools[tool] || false}
                  onChange={(enabled) => toggleTool(tool, enabled)}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="secondary" onClick={enableAll}>
          Enable All
        </Button>
        <Button variant="secondary" onClick={disableAll}>
          Disable All
        </Button>
      </div>
    </div>
  );
}
