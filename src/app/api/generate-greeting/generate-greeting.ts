import { google } from "@ai-sdk/google";
import { experimental_generateSpeech as generateSpeech } from "ai";

import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { name, artist } = await request.json();

    const result = generateSpeech({
      model: google.speechModel!("gemini-2.5-pro-preview-tts"),
      text: `Welcome to Radius. Let's get started with ${name} by ${artist}.`,
      voice: "Iapetus",
      outputFormat: "mp3",
    });

    const audioData = (await result).audio.uint8Array;

    return new Response(audioData, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioData.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error generating playlist:", error);
    return Response.json(
      { message: "Failed to generate playlist" },
      { status: 500 }
    );
  }
}
