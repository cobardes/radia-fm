import { spawn } from "child_process";
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

      // Convert to MP3 using direct ffmpeg call
      const ffmpegProcess = spawn("ffmpeg", [
        "-i",
        inputFile, // Input file
        "-acodec",
        "libmp3lame", // Audio codec
        "-aq",
        "2", // Audio quality (high quality)
        "-y", // Overwrite output file if it exists
        outputFile, // Output file
      ]);

      ffmpegProcess.on("close", async (code) => {
        try {
          if (code !== 0) {
            throw new Error(`ffmpeg process exited with code ${code}`);
          }

          // Read the converted MP3 file
          const mp3Buffer = await fs.readFile(outputFile);

          // Clean up temporary files
          await fs.unlink(inputFile).catch(() => {});
          await fs.unlink(outputFile).catch(() => {});

          resolve(mp3Buffer);
        } catch (error) {
          // Clean up temporary files on error
          await fs.unlink(inputFile).catch(() => {});
          await fs.unlink(outputFile).catch(() => {});
          reject(error);
        }
      });

      ffmpegProcess.on("error", async (error) => {
        // Clean up temporary files on error
        await fs.unlink(inputFile).catch(() => {});
        await fs.unlink(outputFile).catch(() => {});
        reject(new Error(`Failed to start ffmpeg process: ${error.message}`));
      });
    } catch (error) {
      reject(error);
    }
  });
}
