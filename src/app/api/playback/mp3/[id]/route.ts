import { getYoutubeMp3Url } from "@/server/actions/get-youtube-mp3-url";
import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const youtubeId = (await params).id;

    if (!youtubeId) {
      return NextResponse.json(
        { error: "YouTube ID is required" },
        { status: 400 }
      );
    }

    // Check for cached file first
    const cacheDir = path.join(process.cwd(), "mp3-cache");
    const cachedFilePath = path.join(cacheDir, `${youtubeId}.mp3`);

    let shouldUseCache = false;
    let fileSize = 0;

    if (fs.existsSync(cachedFilePath)) {
      const stats = fs.statSync(cachedFilePath);
      fileSize = stats.size;
      shouldUseCache = true;
      console.log(`Using cached MP3 file: ${cachedFilePath}`);
    }

    // Handle range requests for cached files
    const range = request.headers.get("range");

    if (shouldUseCache && range) {
      // Parse range header
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      // Read the requested range
      const buffer = Buffer.alloc(chunkSize);
      const fd = fs.openSync(cachedFilePath, "r");
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
    }

    if (shouldUseCache && !range) {
      // Return full cached file
      const audioBuffer = fs.readFileSync(cachedFilePath);
      return new NextResponse(audioBuffer, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Disposition": `inline; filename="${youtubeId}.mp3"`,
          "Content-Length": audioBuffer.length.toString(),
          "Accept-Ranges": "bytes",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    // Get MP3 URL from the API
    const mp3Url = await getYoutubeMp3Url(youtubeId);

    // Fetch the MP3 content from the external URL
    const mp3Response = await fetch(mp3Url, {
      headers: range ? { Range: range } : {},
    });

    if (!mp3Response.ok) {
      throw new Error(`Failed to fetch MP3: ${mp3Response.status}`);
    }

    // Get the response body as a readable stream
    const mp3Stream = mp3Response.body;

    if (!mp3Stream) {
      throw new Error("No response body received");
    }

    // Prepare headers for streaming response
    const headers = new Headers();
    headers.set("Content-Type", "audio/mpeg");
    headers.set("Cache-Control", "public, max-age=3600");

    // Copy relevant headers from the original response
    if (mp3Response.headers.get("content-length")) {
      headers.set("Content-Length", mp3Response.headers.get("content-length")!);
    }
    if (mp3Response.headers.get("content-range")) {
      headers.set("Content-Range", mp3Response.headers.get("content-range")!);
    }
    if (mp3Response.headers.get("accept-ranges")) {
      headers.set("Accept-Ranges", mp3Response.headers.get("accept-ranges")!);
    } else {
      headers.set("Accept-Ranges", "bytes");
    }

    // Cache the file for future requests (only if not a range request)
    if (!range) {
      // Ensure cache directory exists
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      // Clone the stream for caching
      const [streamForResponse, streamForCache] = mp3Stream.tee();

      // Cache the file in the background
      const chunks: Uint8Array[] = [];
      streamForCache
        .pipeTo(
          new WritableStream({
            write(chunk) {
              chunks.push(chunk);
            },
            close() {
              const buffer = Buffer.concat(chunks);
              fs.writeFileSync(cachedFilePath, buffer);
              console.log(`Cached MP3 file: ${cachedFilePath}`);
            },
            abort(err) {
              console.error("Error caching MP3 file:", err);
            },
          })
        )
        .catch((err) => {
          console.error("Background caching failed:", err);
        });

      return new NextResponse(streamForResponse, {
        status: mp3Response.status,
        headers,
      });
    }

    return new NextResponse(mp3Stream, {
      status: mp3Response.status,
      headers,
    });
  } catch (error) {
    console.error("Error getting MP3 URL:", error);

    return NextResponse.json(
      { error: "Failed to get MP3 URL" },
      { status: 500 }
    );
  }
}
