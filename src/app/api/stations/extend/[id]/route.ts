import { extendStationQueue } from "@/server/actions/stations/extend-station-queue";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { error: "Station ID is required" },
      { status: 400 }
    );
  }

  try {
    await extendStationQueue(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error extending station:", error);
    return NextResponse.json(
      { error: "Failed to extend station" },
      { status: 500 }
    );
  }
}
