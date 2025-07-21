"use server";

import { TalkSegmentLanguage } from "@/types";
import { GoogleGenAI } from "@google/genai";
import mime from "mime";
import { convertToMp3 } from "./mp3-converter";
import { convertToWav } from "./wav-converter";

interface GenerateSpeechOptions {
  temperature?: number;
  voiceName?: string;
}

export async function generateSpeech(
  prompt: string,
  language: TalkSegmentLanguage,
  options: GenerateSpeechOptions = {}
): Promise<ReadableStream<Uint8Array>> {
  const buffer = await generateSpeechBuffer(prompt, language, options);

  // Convert Buffer to ReadableStream
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(buffer));
      controller.close();
    },
  });
}

// Helper function to generate speech as buffer (main implementation)
export async function generateSpeechBuffer(
  prompt: string,
  language: TalkSegmentLanguage,
  options: GenerateSpeechOptions = {}
): Promise<Buffer> {
  const { temperature = 1, voiceName = "Iapetus" } = options;

  const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || "",
  });

  const config = {
    temperature,
    responseModalities: ["audio"],
    speechConfig: {
      voiceConfig: {
        prebuiltVoiceConfig: {
          voiceName,
        },
      },
    },
  };

  const model = "gemini-2.5-flash-preview-tts";
  const contents = [
    {
      role: "user" as const,
      parts: [
        {
          text: `Read aloud, in a brisk pace and low pitch. The tone should be friendly and engaging, but not too excited. ${
            language === "British English"
              ? "Use a noticeable British accent."
              : ""
          } This is the text to read aloud:

          ${prompt}`,
        },
      ],
    },
  ];

  const response = await ai.models.generateContentStream({
    model,
    config,
    contents,
  });

  // Collect all audio chunks
  const audioChunks: Buffer[] = [];

  for await (const chunk of response) {
    if (
      !chunk.candidates ||
      !chunk.candidates[0].content ||
      !chunk.candidates[0].content.parts
    ) {
      continue;
    }

    if (chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
      const inlineData = chunk.candidates[0].content.parts[0].inlineData;
      let buffer: Buffer = Buffer.from(inlineData.data || "", "base64");

      // Check if we need to convert to WAV first
      const fileExtension = mime.getExtension(inlineData.mimeType || "");
      if (!fileExtension) {
        buffer = convertToWav(inlineData.data || "", inlineData.mimeType || "");
      }

      audioChunks.push(buffer);
    }
  }

  if (audioChunks.length === 0) {
    throw new Error("No audio data received from Gemini API");
  }

  // Combine all audio chunks
  const combinedAudio = Buffer.concat(audioChunks);

  // Convert to MP3
  const mp3Buffer = await convertToMp3(combinedAudio);

  return mp3Buffer;
}

export default generateSpeech;
