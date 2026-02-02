import { NextRequest, NextResponse } from "next/server";
import { getConfig, patchConfig, restartGateway } from "@/lib/openclaw";

// GET /api/openclaw/config - Get OpenClaw configuration
export async function GET() {
  try {
    const result = await getConfig();
    
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error || "Failed to get config" },
        { status: 500 }
      );
    }

    return NextResponse.json(result.result);
  } catch (err) {
    console.error("OpenClaw config GET error:", err);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}

// POST /api/openclaw/config - Update OpenClaw configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, patch, reason } = body;

    if (action === "restart") {
      const result = await restartGateway(reason);
      return NextResponse.json(result);
    }

    if (action === "patch" && patch) {
      const result = await patchConfig(patch);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'restart' or 'patch'" },
      { status: 400 }
    );
  } catch (err) {
    console.error("OpenClaw config POST error:", err);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}
