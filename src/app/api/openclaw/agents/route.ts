import { NextRequest, NextResponse } from "next/server";
import { getAgents, updateAgent } from "@/lib/openclaw";

// GET /api/openclaw/agents - Get agents from OpenClaw config
export async function GET() {
  try {
    const agents = await getAgents();
    return NextResponse.json({ agents });
  } catch (err) {
    console.error("OpenClaw agents GET error:", err);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}

// PATCH /api/openclaw/agents - Update an agent
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId, updates } = body;

    if (!agentId) {
      return NextResponse.json(
        { error: "agentId is required" },
        { status: 400 }
      );
    }

    const result = await updateAgent(agentId, updates);
    return NextResponse.json(result);
  } catch (err) {
    console.error("OpenClaw agents PATCH error:", err);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}
