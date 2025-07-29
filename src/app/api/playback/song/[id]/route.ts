import { exec } from "child_process";
import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { promisify } from "util";

const execAsync = promisify(exec);

// Helper function to get content type based on file extension
function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".mp3":
      return "audio/mpeg";
    case ".m4a":
      return "audio/mp4";
    case ".webm":
      return "audio/webm";
    case ".ogg":
      return "audio/ogg";
    case ".opus":
      return "audio/opus";
    case ".aac":
      return "audio/aac";
    default:
      return "audio/mpeg"; // fallback
  }
}

// Helper function to find downloaded file with any audio extension
function findDownloadedFile(outputDir: string, id: string): string | null {
  const possibleExtensions = [".m4a", ".webm", ".mp3", ".ogg", ".opus", ".aac"];

  for (const ext of possibleExtensions) {
    const filePath = path.join(outputDir, `${id}${ext}`);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = (await params).id;

  // Define the output path
  const cookiesPath = path.join(process.cwd(), "yt-dlp-cookies.txt");
  const outputDir = path.join(process.cwd(), "downloads");

  try {
    // Ensure the downloads directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Check if file already exists with any audio extension
    let outputPath = findDownloadedFile(outputDir, id);

    if (!outputPath) {
      console.log(`Downloading audio for video ID: ${id}`);

      // Download best available audio format without conversion
      // Use %(ext)s to let yt-dlp determine the extension
      const outputTemplate = path.join(outputDir, `${id}.%(ext)s`);
      const command = `yt-dlp --cookies "${cookiesPath}" -f ba -o "${outputTemplate}" "https://www.youtube.com/watch?v=${id}"`;
      await execAsync(command);

      // Find the downloaded file
      outputPath = findDownloadedFile(outputDir, id);

      if (outputPath) {
        console.log(`Audio downloaded successfully: ${outputPath}`);
      }
    } else {
      console.log(`Audio file already exists: ${outputPath}`);
    }

    // Check if file exists after download attempt
    if (!outputPath || !fs.existsSync(outputPath)) {
      return NextResponse.json(
        { error: "Audio file not found after download" },
        { status: 404 }
      );
    }

    // Get file stats and content type
    const stats = fs.statSync(outputPath);
    const fileSize = stats.size;
    const contentType = getContentType(outputPath);
    const fileName = path.basename(outputPath);

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
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=3600",
        },
      });
    } else {
      // No range request, return full file
      const audioBuffer = fs.readFileSync(outputPath);

      return new NextResponse(audioBuffer, {
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `inline; filename="${fileName}"`,
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
