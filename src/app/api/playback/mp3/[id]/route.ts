import { getYoutubeMp3Url } from "@/server/actions/get-youtube-mp3-url";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const youtubeId = (await params).id;

    if (!youtubeId) {
      return NextResponse.json(
        { error: "YouTube ID is required" },
        { status: 400 }
      );
    }

    const mp3Url = await getYoutubeMp3Url(youtubeId);

    return NextResponse.redirect(mp3Url);
  } catch (error) {
    console.error("Error getting MP3 URL:", error);

    return NextResponse.json(
      { error: "Failed to get MP3 URL" },
      { status: 500 }
    );
  }
}
