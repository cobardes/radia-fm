import { sessionService } from "@/server/services/session";
import { SessionResponse } from "@/types";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const sessionId = (await params).sessionId;

    const session = await sessionService.getSession(sessionId);

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const response: SessionResponse = {
      sessionId,
      session,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error retrieving session:", error);
    return NextResponse.json(
      { error: "Failed to retrieve session" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const sessionId = (await params).sessionId;
    const updates = await request.json();

    const session = await sessionService.updateSession(sessionId, updates);

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const response: SessionResponse = {
      sessionId,
      session,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error updating session:", error);
    return NextResponse.json(
      { error: "Failed to update session" },
      { status: 500 }
    );
  }
}
