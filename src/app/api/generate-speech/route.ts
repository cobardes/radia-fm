import generateSpeech from "@/utils/generate-speech";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { trackTitle, trackArtist } = await request.json();

    // Generate speech from the prompt
    const mp3Buffer = await generateSpeech(
      `Welcome to Radius. Let's get started with ${trackTitle} by ${trackArtist}.`
    );

    // Return the MP3 data as a binary response
    return new NextResponse(mp3Buffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": mp3Buffer.length.toString(),
        "Content-Disposition": 'attachment; filename="speech.mp3"',
      },
    });
  } catch (error) {
    console.error("Error generating speech:", error);
    return NextResponse.json(
      { error: "Failed to generate speech" },
      { status: 500 }
    );
  }
}
