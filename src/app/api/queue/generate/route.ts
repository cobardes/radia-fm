import { generateScriptPrompt } from "@/prompts";
import { generatePlaylistPrompt } from "@/prompts/generate-playlist";
import { google } from "@ai-sdk/google";
import { generateObject, generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

// Define a new song type specifically for queue generation
interface QueueSong {
  title: string;
  artist: string;
  reason: string;
}

interface QueueGenerateRequest {
  songs: QueueSong[];
}

export async function POST(request: NextRequest) {
  try {
    const body: QueueGenerateRequest = await request.json();

    // Validate the request body
    if (!body.songs || !Array.isArray(body.songs)) {
      return NextResponse.json(
        { error: "Songs array is required" },
        { status: 400 }
      );
    }

    // Validate each song in the array
    for (const song of body.songs) {
      if (!song.title || !song.artist || !song.reason) {
        return NextResponse.json(
          { error: "Each song must have title, artist, and reason" },
          { status: 400 }
        );
      }
    }

    const playlist = await generateText({
      model: google("gemini-2.5-pro", {
        useSearchGrounding: true,
      }),
      prompt: generatePlaylistPrompt({
        previousPlaylist: JSON.stringify(body.songs, null, 2),
      }),
    });

    const script = await generateText({
      model: google("gemini-2.5-pro"),
      prompt: generateScriptPrompt({
        playlist: playlist.text,
        language: "English",
      }),
    });

    const structuredScript = await generateObject({
      model: google("gemini-2.5-flash"),
      prompt: script.text,
      schema: z.object({
        queue: z
          .array(
            z.object({
              type: z.enum(["segment", "song"]),
              title: z
                .string()
                .optional()
                .describe("If it's a song, the title of the song"),
              artist: z
                .string()
                .optional()
                .describe("If it's a song, the artist of the song"),
              segment: z
                .string()
                .optional()
                .describe("If it's a segment, the text of the segment"),
            })
          )
          .describe("The queue of songs and segments"),
      }),
    });

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${body.songs.length} songs`,
      script: structuredScript.object,
    });
  } catch (error) {
    console.error("Error processing queue generation:", error);
    return NextResponse.json(
      { error: "Failed to process songs" },
      { status: 500 }
    );
  }
}
