import { loadPrompt } from "@/utils/load-prompt";
import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const parsedRequest: { prompt: string } = await request.json();

    // Load and process the prompt template
    const prompt = loadPrompt("generate-script", {
      playlist: parsedRequest.prompt,
    });

    const result = streamText({
      model: google("gemini-2.5-flash", {
        useSearchGrounding: false,
      }),
      prompt,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error generating script:", error);
    return Response.json(
      { message: "Failed to generate script" },
      { status: 500 }
    );
  }
}
