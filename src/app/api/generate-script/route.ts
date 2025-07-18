import { generateScriptPrompt } from "@/prompts";
import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const parsedRequest: { prompt: string } = await request.json();

    const prompt = generateScriptPrompt({
      playlist: parsedRequest.prompt,
      language: "Spanish",
    });

    const result = streamText({
      model: google("gemini-2.5-pro"),
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
