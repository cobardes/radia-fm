import { talkSegments } from "@/server/db";
import { generateSpeech } from "@/utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const segment = await talkSegments.doc(id).get();
    const segmentData = segment.data();

    if (!segment.exists || !segmentData?.text) {
      return NextResponse.json(
        { error: "Segment not found or no text" },
        { status: 404 }
      );
    }

    const mp3Buffer = await generateSpeech(segmentData.text);

    // Return the MP3 data as a binary response
    return new NextResponse(mp3Buffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": mp3Buffer.length.toString(),
        "Content-Disposition": 'attachment; filename="speech.mp3"',
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=43200",
      },
    });
  } catch (error) {
    console.error("Error generating speech:", error);
    return NextResponse.json(
      { error: "Failed to generate speech" },
      { status: 500 }
    );
  }
}
