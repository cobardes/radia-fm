import { sessions } from "@/server/db";
import { BaseErrorResponse, SessionPlaylistItem } from "@/types";
import { formatPlaylistAsString } from "@/utils/format-playlist";
import { NextRequest, NextResponse } from "next/server";

export interface SessionPlaylistResponse {
  playlist: SessionPlaylistItem[];
}

export type SessionPlaylistApiResponse =
  | SessionPlaylistResponse
  | BaseErrorResponse;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<SessionPlaylistApiResponse> | Response> {
  const { id } = params;
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format");
  const includeSongIds = searchParams.get("includeSongIds") === "true";

  if (!id) {
    return NextResponse.json(
      { error: "Session ID is required" } as BaseErrorResponse,
      { status: 400 }
    );
  }

  try {
    // Fetch session metadata from Firestore
    const sessionDoc = await sessions.doc(id).get();

    if (!sessionDoc.exists) {
      return NextResponse.json(
        { error: "Session not found" } as BaseErrorResponse,
        { status: 404 }
      );
    }

    const sessionData = sessionDoc.data();

    if (!sessionData) {
      return NextResponse.json(
        { error: "Session data not found" } as BaseErrorResponse,
        { status: 404 }
      );
    }

    const playlist = sessionData.playlist || [];

    // Return plain text format if requested
    if (format === "text") {
      const formattedPlaylist = formatPlaylistAsString(
        playlist,
        includeSongIds
      );
      return new Response(formattedPlaylist, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
        },
      });
    }

    // Default: Return JSON format
    return NextResponse.json({
      playlist: playlist,
    } as SessionPlaylistResponse);
  } catch (error) {
    console.error("Error fetching session playlist:", error);
    return NextResponse.json(
      { error: "Failed to fetch session playlist" } as BaseErrorResponse,
      { status: 500 }
    );
  }
}
