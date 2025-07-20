import { exec } from "child_process";
import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = (await params).id;

  // Define the output path
  const outputDir = path.join(process.cwd(), "downloads");
  const outputPath = path.join(outputDir, `${id}.mp3`);

  try {
    // Ensure the downloads directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Check if file already exists
    if (!fs.existsSync(outputPath)) {
      console.log(`Downloading audio for video ID: ${id}`);

      // Download audio as MP3 using yt-dlp
      const command = `yt-dlp -f ba -x --audio-format mp3 --audio-quality 192K -o "${outputPath}" "https://www.youtube.com/watch?v=${id}"`;
      await execAsync(command);

      console.log(`Audio downloaded successfully: ${outputPath}`);
    } else {
      console.log(`Audio file already exists: ${outputPath}`);
    }

    // Check if file exists after download attempt
    if (!fs.existsSync(outputPath)) {
      return NextResponse.json(
        { error: "Audio file not found after download" },
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
          "Cache-Control": "public, max-age=3600",
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
          "Cache-Control": "public, max-age=3600",
        },
      });
    }
  } catch (error) {
    console.error("Error downloading or serving audio:", error);
    return NextResponse.json(
      {
        error: "Failed to download or serve audio",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
