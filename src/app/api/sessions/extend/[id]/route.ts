import { generateSessionQueue } from "@/server/actions/generate-session-queue";
import { sessions } from "@/server/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const session = await sessions.doc(id).get();

  if (!session.exists) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  await generateSessionQueue(id);

  return NextResponse.json({ message: "Session extension started" });
}
