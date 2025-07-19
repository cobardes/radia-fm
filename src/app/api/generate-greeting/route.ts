import generateSpeech from "@/utils/generate-speech";
import { NextRequest, NextResponse } from "next/server";

const greetings = [
  "Welcome to Radius. Let's get started with your choice, uh, {trackTitle} by {trackArtist}. Good one. Let's go.",
  "Hey there, welcome to Radius. You've picked {trackTitle} by {trackArtist}. Nice choice. Let's dive in.",
  "Welcome back to Radius. Per your request... this is {trackTitle} by {trackArtist}. Let's get started.",
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const trackTitle = searchParams.get("trackTitle");
    const trackArtist = searchParams.get("trackArtist");

    if (!trackTitle || !trackArtist) {
      return NextResponse.json(
        { error: "trackTitle and trackArtist are required" },
        { status: 400 }
      );
    }

    // Select a random greeting
    const randomGreeting =
      greetings[Math.floor(Math.random() * greetings.length)];

    // Replace placeholders with actual track info
    const personalizedGreeting = randomGreeting
      .replace("{trackTitle}", trackTitle)
      .replace("{trackArtist}", trackArtist);

    // Generate speech from the prompt
    const mp3Buffer = await generateSpeech(personalizedGreeting);

    // Return the MP3 data as a binary response
    return new NextResponse(mp3Buffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": mp3Buffer.length.toString(),
        "Content-Disposition": 'attachment; filename="speech.mp3"',
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=43200",
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
