"use server";

import { StationLanguage } from "@/types/station";
import { GoogleGenAI } from "@google/genai";
import mime from "mime";
import { convertToMp3 } from "./mp3-converter";
import { convertToWav } from "./wav-converter";

export async function generateSpeech(
  prompt: string,
  language: StationLanguage
): Promise<ReadableStream<Uint8Array>> {
  const buffer = await generateSpeechBuffer(prompt, language);

  // Convert Buffer to ReadableStream
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(buffer));
      controller.close();
    },
  });
}

interface VoiceSettings {
  voiceName: string;
  temperature: number;
  instructions: string;
}

const Voices: Record<StationLanguage, VoiceSettings> = {
  "en-GB": {
    voiceName: "Enceladus",
    temperature: 1.5,
    instructions:
      "You are having a conversation and speaking fast. Say this in an British accent:",
  },
  "es-ES": {
    voiceName: "Despina",
    temperature: 1.3,
    instructions:
      "Speak in a very fast and casual manner, like if you were talking to a friend.",
  },
  "es-CL": {
    voiceName: "Orus",
    temperature: 1.2,
    instructions:
      "Estás conversando y hablando rápido. Di lo siguiente en tono casual, agradable y con acento chileno:",
  },
};

// Helper function to generate speech as buffer (main implementation)
export async function generateSpeechBuffer(
  prompt: string,
  language: StationLanguage
): Promise<Buffer> {
  const { voiceName, temperature, instructions } = Voices[language];

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

  const model = "gemini-2.5-pro-preview-tts";
  const contents = [
    {
      role: "user" as const,
      parts: [
        {
          text: `${instructions} ${prompt}`,
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
