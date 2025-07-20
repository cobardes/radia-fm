import db from "@/server/clients/firestore";
import {
  BaseErrorResponse,
  SessionCreateRequest,
  SessionMetadata,
  SessionQueue,
} from "@/types";
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

interface SessionStartSuccessResponse {
  sessionId: string;
}

// Union type for all possible responses from this endpoint
export type SessionStartResponse =
  | SessionStartSuccessResponse
  | BaseErrorResponse;

export async function POST(
  request: NextRequest
): Promise<NextResponse<SessionStartResponse>> {
  try {
    const body: SessionCreateRequest = await request.json();

    if (!body.seedSong || !body.seedSong.id) {
      return NextResponse.json(
        { error: "Valid seedSong is required" } as BaseErrorResponse,
        { status: 400 }
      );
    }

    const sessionId = randomUUID();

    const sessionQueue: SessionQueue = {
      sessionId,
      queue: [],
      lastUpdated: new Date().toISOString(),
    };

    const sessionMetadata: SessionMetadata = {
      id: sessionId,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      seedSong: body.seedSong,
      currentIndex: -1,
    };

    db.collection("sessions").doc(sessionId).set(sessionMetadata);
    db.collection("sessionQueues").doc(sessionId).set(sessionQueue);

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
