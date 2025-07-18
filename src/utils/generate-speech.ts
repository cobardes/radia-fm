import { GoogleGenAI } from "@google/genai";
import ffmpeg from "fluent-ffmpeg";
import { promises as fs } from "fs";
import mime from "mime";
import { tmpdir } from "os";
import { join } from "path";

interface WavConversionOptions {
  numChannels: number;
  sampleRate: number;
  bitsPerSample: number;
}

interface GenerateSpeechOptions {
  temperature?: number;
  voiceName?: string;
}

export async function generateSpeech(
  prompt: string,
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

  const model = "gemini-2.5-pro-preview-tts";
  const contents = [
    {
      role: "user" as const,
      parts: [
        {
          text: `Read aloud, in a brisk pace and conversational tone, in the style of an indie radio DJ, and aim for a lower tone:
          ${prompt}
          (brief pause)`,
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

function convertToWav(rawData: string, mimeType: string): Buffer {
  const options = parseMimeType(mimeType);
  const dataBuffer = Buffer.from(rawData, "base64");
  const wavHeader = createWavHeader(dataBuffer.length, options);

  return Buffer.concat([wavHeader, dataBuffer]);
}

function parseMimeType(mimeType: string): WavConversionOptions {
  const [fileType, ...params] = mimeType.split(";").map((s) => s.trim());
  const [_, format] = fileType.split("/");

  const options: Partial<WavConversionOptions> = {
    numChannels: 1,
    sampleRate: 16000,
    bitsPerSample: 16,
  };

  if (format && format.startsWith("L")) {
    const bits = parseInt(format.slice(1), 10);
    if (!isNaN(bits)) {
      options.bitsPerSample = bits;
    }
  }

  for (const param of params) {
    const [key, value] = param.split("=").map((s) => s.trim());
    if (key === "rate") {
      options.sampleRate = parseInt(value, 10);
    }
  }

  return options as WavConversionOptions;
}

function createWavHeader(
  dataLength: number,
  options: WavConversionOptions
): Buffer {
  const { numChannels, sampleRate, bitsPerSample } = options;

  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const buffer = Buffer.alloc(44);

  buffer.write("RIFF", 0); // ChunkID
  buffer.writeUInt32LE(36 + dataLength, 4); // ChunkSize
  buffer.write("WAVE", 8); // Format
  buffer.write("fmt ", 12); // Subchunk1ID
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (PCM)
  buffer.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
  buffer.writeUInt16LE(numChannels, 22); // NumChannels
  buffer.writeUInt32LE(sampleRate, 24); // SampleRate
  buffer.writeUInt32LE(byteRate, 28); // ByteRate
  buffer.writeUInt16LE(blockAlign, 32); // BlockAlign
  buffer.writeUInt16LE(bitsPerSample, 34); // BitsPerSample
  buffer.write("data", 36); // Subchunk2ID
  buffer.writeUInt32LE(dataLength, 40); // Subchunk2Size

  return buffer;
}

async function convertToMp3(audioBuffer: Buffer): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      // Create temporary files
      const tempDir = tmpdir();
      const inputFile = join(tempDir, `input-${Date.now()}.wav`);
      const outputFile = join(tempDir, `output-${Date.now()}.mp3`);

      // Write the audio buffer to a temporary file
      await fs.writeFile(inputFile, audioBuffer);

      // Convert to MP3 using ffmpeg
      ffmpeg(inputFile)
        .audioCodec("libmp3lame")
        .audioQuality(2) // High quality
        .on("end", async () => {
          try {
            // Read the converted MP3 file
            const mp3Buffer = await fs.readFile(outputFile);

            // Clean up temporary files
            await fs.unlink(inputFile).catch(() => {});
            await fs.unlink(outputFile).catch(() => {});

            resolve(mp3Buffer);
          } catch (error) {
            reject(error);
          }
        })
        .on("error", (error) => {
          // Clean up temporary files on error
          fs.unlink(inputFile).catch(() => {});
          fs.unlink(outputFile).catch(() => {});
          reject(error);
        })
        .save(outputFile);
    } catch (error) {
      reject(error);
    }
  });
}

export default generateSpeech;
