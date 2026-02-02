/**
 * OpenClaw Gateway API Client
 * 
 * Communicates with the OpenClaw gateway for agent management.
 */

const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || "http://localhost:18789";
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || "";

interface GatewayResponse<T = unknown> {
  ok: boolean;
  result?: T;
  error?: string;
}

interface OpenClawConfig {
  agents?: {
    defaults?: Record<string, unknown>;
    list?: AgentConfig[];
  };
  [key: string]: unknown;
}

interface AgentConfig {
  id: string;
  workspace?: string;
  agentDir?: string;
  groupChat?: {
    mentionPatterns?: string[];
  };
  [key: string]: unknown;
}

/**
 * Get the current OpenClaw configuration
 */
export async function getConfig(): Promise<GatewayResponse<{ config: OpenClawConfig }>> {
  try {
    const res = await fetch(`${GATEWAY_URL}/api/gateway/config`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(GATEWAY_TOKEN && { Authorization: `Bearer ${GATEWAY_TOKEN}` }),
      },
      body: JSON.stringify({ action: "config.get" }),
    });
    
    return await res.json();
  } catch (error) {
    console.error("OpenClaw getConfig error:", error);
    return { ok: false, error: String(error) };
  }
}

/**
 * Patch the OpenClaw configuration
 */
export async function patchConfig(patch: Partial<OpenClawConfig>): Promise<GatewayResponse> {
  try {
    const res = await fetch(`${GATEWAY_URL}/api/gateway/config`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(GATEWAY_TOKEN && { Authorization: `Bearer ${GATEWAY_TOKEN}` }),
      },
      body: JSON.stringify({ 
        action: "config.patch",
        raw: JSON.stringify(patch),
      }),
    });
    
    return await res.json();
  } catch (error) {
    console.error("OpenClaw patchConfig error:", error);
    return { ok: false, error: String(error) };
  }
}

/**
 * Get list of agents from OpenClaw config
 */
export async function getAgents(): Promise<AgentConfig[]> {
  const result = await getConfig();
  if (!result.ok || !result.result?.config) {
    return [];
  }
  return result.result.config.agents?.list || [];
}

/**
 * Update an agent's configuration
 */
export async function updateAgent(agentId: string, updates: Partial<AgentConfig>): Promise<GatewayResponse> {
  const result = await getConfig();
  if (!result.ok || !result.result?.config) {
    return { ok: false, error: "Failed to get current config" };
  }

  const config = result.result.config;
  const agents = config.agents?.list || [];
  const agentIndex = agents.findIndex(a => a.id === agentId);
  
  if (agentIndex === -1) {
    return { ok: false, error: "Agent not found" };
  }

  agents[agentIndex] = { ...agents[agentIndex], ...updates };
  
  return patchConfig({
    agents: {
      ...config.agents,
      list: agents,
    },
  });
}

/**
 * Restart the gateway
 */
export async function restartGateway(reason?: string): Promise<GatewayResponse> {
  try {
    const res = await fetch(`${GATEWAY_URL}/api/gateway/config`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(GATEWAY_TOKEN && { Authorization: `Bearer ${GATEWAY_TOKEN}` }),
      },
      body: JSON.stringify({ 
        action: "restart",
        reason: reason || "Houston agent management",
      }),
    });
    
    return await res.json();
  } catch (error) {
    console.error("OpenClaw restart error:", error);
    return { ok: false, error: String(error) };
  }
}
