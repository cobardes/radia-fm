import { searchYouTube } from "@/server/actions/search-youtube";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query is required and must be a string" },
        { status: 400 }
      );
    }

    const songs = await searchYouTube(query);

    return NextResponse.json({ songs }, { status: 200 });
  } catch (error) {
    console.error("Error searching songs:", error);
    return NextResponse.json(
      { error: "Failed to search songs" },
      { status: 500 }
    );
  }
}
