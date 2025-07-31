import { exec } from "child_process";
import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  try {
    // Check if ffmpeg is available
    await execAsync("ffmpeg -version");

    // Check if yt-dlp is available
    await execAsync("yt-dlp --version");

    // Check if downloads directory exists and is writable
    const downloadsDir = path.join(process.cwd(), "downloads");

    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true });
    }

    return NextResponse.json({
      status: "healthy",
      ffmpeg: "available",
      ytdlp: "available",
      downloads: "ready",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
