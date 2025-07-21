import ffmpeg from "fluent-ffmpeg";
import { promises as fs } from "fs";
import { tmpdir } from "os";
import { join } from "path";

export async function convertToMp3(audioBuffer: Buffer): Promise<Buffer> {
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
