"use server";

import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY || "",
});

import { StationLanguage } from "@/types/station";
import { TextToSpeechRequest } from "@elevenlabs/elevenlabs-js/api";

const Voices: Record<
  StationLanguage,
  {
    voiceId: string;
    voiceSettings: TextToSpeechRequest["voiceSettings"];
  }
> = {
  "Neutral Spanish": {
    voiceId: "B10SmiMIwxTlneUpKPyE",
    voiceSettings: {
      speed: 1.1,
      stability: 0.75,
      similarityBoost: 0.5,
      useSpeakerBoost: true,
    },
  },
  "British English": {
    voiceId: "nrD2uNU2IUYtedZegcGx",
    voiceSettings: {
      speed: 1.1,
      stability: 0.5,
      similarityBoost: 0.5,
      useSpeakerBoost: true,
    },
  },
};

export async function generateSpeech(
  prompt: string,
  language: StationLanguage
): Promise<ReadableStream<Uint8Array>> {
  const { voiceId, voiceSettings } = Voices[language];

  const audio = await elevenlabs.textToSpeech.convert(voiceId, {
    text: prompt,
    modelId: "eleven_turbo_v2_5",
    outputFormat: "mp3_44100_192",
    voiceSettings,
  });

  return audio;
}

// Helper function to convert stream to buffer if needed for compatibility
export async function generateSpeechBuffer(
  prompt: string,
  language: StationLanguage
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
