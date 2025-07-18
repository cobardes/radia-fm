import { generatePlaylistPrompt } from "@/prompts";
import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { name, artist } = await request.json();

    // Load and process the prompt template
    const prompt = generatePlaylistPrompt({
      name,
      artist,
    });

    const result = streamText({
      model: google("gemini-2.5-pro", {
        useSearchGrounding: true,
      }),
      prompt,
      temperature: 1,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error generating playlist:", error);
    return Response.json(
      { message: "Failed to generate playlist" },
      { status: 500 }
    );
  }
}
