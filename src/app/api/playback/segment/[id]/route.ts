import { speeches } from "@/server/db";
import { generateSpeech } from "@/utils/generate-speech-elevenlabs";
import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    // Define the output path for cached speech files
    const outputDir = path.join(process.cwd(), "downloads", "speech");
    const outputPath = path.join(outputDir, `${id}.mp3`);

    // Ensure the downloads/speech directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Check if file already exists
    if (!fs.existsSync(outputPath)) {
      console.log(`Generating speech for segment ID: ${id}`);

      const segment = await speeches.doc(id).get();
      const segmentData = segment.data();

      if (!segment.exists || !segmentData?.text) {
        return NextResponse.json(
          { error: "Segment not found or no text" },
          { status: 404 }
        );
      }

      // Get the streaming audio response from ElevenLabs
      const audioStream = await generateSpeech(
        segmentData.text,
        segmentData.language
      );

      // Save the stream to file
      const writer = fs.createWriteStream(outputPath);
      const reader = audioStream.getReader();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          writer.write(Buffer.from(value));
        }
        writer.end();

        // Wait for write to complete
        await new Promise<void>((resolve, reject) => {
          writer.on("finish", () => resolve());
          writer.on("error", reject);
        });

        console.log(`Speech generated and cached: ${outputPath}`);
      } catch (error) {
        // Clean up partial file on error
        if (fs.existsSync(outputPath)) {
          fs.unlinkSync(outputPath);
        }
        throw error;
      }
    } else {
      console.log(`Speech file already exists: ${outputPath}`);
    }

    // Check if file exists after generation attempt
    if (!fs.existsSync(outputPath)) {
      return NextResponse.json(
        { error: "Speech file not found after generation" },
        { status: 404 }
      );
    }

    // Get file stats
    const stats = fs.statSync(outputPath);
    const fileSize = stats.size;

    // Check for range request
    const range = request.headers.get("range");

    if (range) {
      // Parse range header
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      // Read the requested range
      const buffer = Buffer.alloc(chunkSize);
      const fd = fs.openSync(outputPath, "r");
      fs.readSync(fd, buffer, 0, chunkSize, start);
      fs.closeSync(fd);

      return new NextResponse(buffer, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize.toString(),
          "Content-Type": "audio/mpeg",
          "Cache-Control":
            "public, max-age=86400, stale-while-revalidate=43200",
        },
      });
    } else {
      // No range request, return full file
      const audioBuffer = fs.readFileSync(outputPath);

      return new NextResponse(audioBuffer, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Disposition": `inline; filename="${id}.mp3"`,
          "Content-Length": audioBuffer.length.toString(),
          "Accept-Ranges": "bytes",
          "Cache-Control":
            "public, max-age=86400, stale-while-revalidate=43200",
        },
      });
    }
  } catch (error) {
    console.error("Error generating or serving speech:", error);
    return NextResponse.json(
      {
        error: "Failed to generate or serve speech",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
