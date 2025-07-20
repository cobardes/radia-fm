import { sessionService } from "@/server/services/session";
import { SessionCreateRequest, SessionResponse } from "@/types";
import { NextRequest, NextResponse } from "next/server";

// Error response types for this endpoint
export interface SessionErrorResponse {
  error: string;
}

// Union type for all possible responses from this endpoint
export type SessionStartResponse = SessionResponse | SessionErrorResponse;

export async function POST(
  request: NextRequest
): Promise<NextResponse<SessionStartResponse>> {
  try {
    const body: SessionCreateRequest = await request.json();

    if (!body.seedSong || !body.seedSong.id) {
      return NextResponse.json(
        { error: "Valid seedSong is required" } as SessionErrorResponse,
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
      { error: "Failed to create session" } as SessionErrorResponse,
      { status: 500 }
    );
  }
}
