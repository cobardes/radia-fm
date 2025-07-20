import { sessionService } from "@/server/services/session";
import { SessionCreateRequest, SessionResponse } from "@/types";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body: SessionCreateRequest = await request.json();

    if (!body.seedSong || !body.seedSong.id) {
      return NextResponse.json(
        { error: "Valid seedSong is required" },
        { status: 400 }
      );
    }

    const session = await sessionService.createSession(body.seedSong);

    const response: SessionResponse = {
      sessionId: session.id,
      queue: session.queue,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}
