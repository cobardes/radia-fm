import db from "@/server/clients/firestore";
import {
  BaseErrorResponse,
  SessionMetadata,
  SessionQueue,
  Song,
} from "@/types";
import { randomUUID } from "crypto";
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

    const sessionId = randomUUID();

    const speechUrl = `/api/generate-greeting?trackTitle=${body.seedSong.title}&trackArtist=${body.seedSong.artists[0]}`;
    const songUrl = `/api/songs/playback/${body.seedSong.videoId}`;

    const sessionQueue: SessionQueue = {
      sessionId,
      queue: [
        {
          type: "segment",
          id: "greeting" + Math.random().toString(36).substring(2, 15),
          title: "DJ Greeting",
          audioUrl: speechUrl,
        },
        {
          type: "song",
          id: body.seedSong.id,
          title: body.seedSong.title,
          artists: body.seedSong.artists,
          thumbnail: body.seedSong.thumbnail,
          audioUrl: songUrl,
        },
      ],
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
