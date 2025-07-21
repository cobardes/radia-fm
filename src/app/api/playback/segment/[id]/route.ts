import { talkSegments } from "@/server/db";
import { generateSpeech } from "@/utils/generate-speech";
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

    // Get the streaming audio response from ElevenLabs
    const audioStream = await generateSpeech(
      segmentData.text,
      segmentData.language
    );

    // Convert ReadableStream<Uint8Array> to ReadableStream<Uint8Array> for NextResponse
    const stream = new ReadableStream({
      start(controller) {
        const reader = audioStream.getReader();

        function pump(): Promise<void> {
          return reader.read().then(({ done, value }) => {
            if (done) {
              controller.close();
              return;
            }

            controller.enqueue(value);
            return pump();
          });
        }

        return pump().catch((error) => {
          console.error("Stream error:", error);
          controller.error(error);
        });
      },
    });

    // Return streaming response
    return new NextResponse(stream, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": 'attachment; filename="speech.mp3"',
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=43200",
        // Remove Content-Length since we're streaming
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
