import { extendSessionQueue } from "@/server/actions/extend-session-queue";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id) {
    return NextResponse.json(
      { error: "Session ID is required" },
      { status: 400 }
    );
  }

  try {
    await extendSessionQueue(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error extending session:", error);
    return NextResponse.json(
      { error: "Failed to extend session" },
      { status: 500 }
    );
  }
}
