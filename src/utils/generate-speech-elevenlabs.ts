"use server";

import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY || "",
});

import { TalkSegmentLanguage } from "@/types";
import { TextToSpeechRequest } from "@elevenlabs/elevenlabs-js/api";

const Voices: Record<
  TalkSegmentLanguage,
  {
    voiceId: string;
    voiceSettings: TextToSpeechRequest["voiceSettings"];
  }
> = {
  "Neutral Spanish": {
    voiceId: "B10SmiMIwxTlneUpKPyE",
    voiceSettings: {
      speed: 1.1,
      stability: 0.25,
      similarityBoost: 0.5,
    },
  },
  "British English": {
    voiceId: "8Ol13ghALtr4tWI7wPIz",
    voiceSettings: {
      speed: 1.15,
      stability: 0.2,
      similarityBoost: 0.75,
      useSpeakerBoost: true,
    },
  },
};

export async function generateSpeech(
  prompt: string,
  language: TalkSegmentLanguage
): Promise<ReadableStream<Uint8Array>> {
  const { voiceId, voiceSettings } = Voices[language];

  const audio = await elevenlabs.textToSpeech.convert(voiceId, {
    text: prompt,
    modelId: "eleven_multilingual_v2",
    outputFormat: "mp3_44100_128",
    voiceSettings,
  });

  return audio;
}

// Helper function to convert stream to buffer if needed for compatibility
export async function generateSpeechBuffer(
  prompt: string,
  language: TalkSegmentLanguage
): Promise<Buffer> {
  const stream = await generateSpeech(prompt, language);

  const chunks: Uint8Array[] = [];
  const reader = stream.getReader();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  // Convert Uint8Array chunks to Buffer
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const buffer = Buffer.allocUnsafe(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.length;
  }

  return buffer;
}

export default generateSpeech;
