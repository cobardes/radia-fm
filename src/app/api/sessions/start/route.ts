import { startSession } from "@/server/actions/start-session";
import { BaseErrorResponse, Song } from "@/types";
import { NextRequest, NextResponse } from "next/server";

export interface SessionStartRequest {
  seedSong: Song;
}

export interface SessionStartSuccessResponse {
  sessionId: string;
}

export type SessionStartErrorResponse = BaseErrorResponse;

// Union type for all possible responses from this endpoint
export type SessionStartResponse =
  | SessionStartSuccessResponse
  | BaseErrorResponse;

export async function POST(
  request: NextRequest
): Promise<NextResponse<SessionStartResponse>> {
  try {
    const body: SessionStartRequest = await request.json();

    if (!body.seedSong || !body.seedSong.id) {
      return NextResponse.json(
        { error: "Valid seedSong is required" } as BaseErrorResponse,
        { status: 400 }
      );
    }

    const sessionId = await startSession(body.seedSong);

    return NextResponse.json({
      sessionId,
    });
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      { error: "Failed to create session" } as BaseErrorResponse,
      { status: 500 }
    );
  }
}
