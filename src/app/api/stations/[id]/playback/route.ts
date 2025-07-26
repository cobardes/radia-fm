import { stations } from "@/server/db";
import { getAuth } from "firebase-admin/auth";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Verify Firebase Auth token
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    const { currentIndex } = await request.json();
    const params = await context.params;
    const stationId = params.id;

    if (typeof currentIndex !== "number" || currentIndex < -1) {
      return NextResponse.json(
        { error: "Invalid currentIndex" },
        { status: 400 }
      );
    }

    // Get current station
    const stationDoc = await stations.doc(stationId).get();
    if (!stationDoc.exists) {
      return NextResponse.json({ error: "Station not found" }, { status: 404 });
    }

    const station = stationDoc.data();

    // Check if user is the creator
    if (station?.creatorId !== userId) {
      return NextResponse.json(
        { error: "Forbidden - Only station creator can update playback" },
        { status: 403 }
      );
    }

    // Update currentIndex and related fields
    await stations.doc(stationId).update({
      currentIndex,
      lastPlaybackUpdate: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, currentIndex });
  } catch (error) {
    console.error("Error updating playback:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
