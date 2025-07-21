"use server";

import db from "@/server/firestore";
import {
  SessionMetadata,
  SessionQueue,
  Song,
  TalkSegment,
  TalkSegmentLanguage,
} from "@/types";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { randomUUID } from "crypto";
import { z } from "zod";
import { generateSessionQueue } from "./generate-session-queue";

export async function startSession(
  seedSong: Song,
  language: TalkSegmentLanguage
): Promise<string> {
  if (!seedSong || !seedSong.id) {
    throw new Error("Valid seedSong is required");
  }

  const sessionId = randomUUID();

  const greetingSegmentId = randomUUID();

  console.log(`[SID:${sessionId.slice(0, 8)}] Generating greeting...`);

  const generatedGreeting = await generateObject({
    model: openai("gpt-4.1-nano"),
    prompt: `You are a DJ for an AI radio app called Radius. Do not mention you are AI. Use a friendly but not too enthusiastic tone. In a brief message, greet the user and introduce the first song: ${seedSong.title} by ${seedSong.artists[0]}. When mentioning the song, ignore any tags like "Remastered", "Live" or "Version". Use the following language: ${language}`,
    schema: z.object({
      text: z.string().describe("The text of the greeting"),
    }),
  });

  console.log(
    `[SID:${sessionId.slice(0, 8)}] Generated greeting: ${
      generatedGreeting.object.text
    }`
  );

  const greetingSegment: TalkSegment = {
    text: generatedGreeting.object.text,
    language,
  };

  await db
    .collection("talkSegments")
    .doc(greetingSegmentId)
    .set(greetingSegment);

  console.log(
    `[SID:${sessionId.slice(
      0,
      8
    )}] Saved greeting segment: ${greetingSegmentId}`
  );

  const speechUrl = `/api/playback/segment/${greetingSegmentId}`;
  const songUrl = `/api/playback/song/${seedSong.id}`;

  const sessionQueue: SessionQueue = {
    queue: [
      {
        type: "segment",
        id: greetingSegmentId,
        text: greetingSegment.text,
        audioUrl: speechUrl,
      },
      {
        type: "song",
        id: seedSong.id,
        title: seedSong.title,
        artists: seedSong.artists,
        thumbnail: seedSong.thumbnail,
        audioUrl: songUrl,
      },
    ],
    extending: false,
  };

  const sessionMetadata: SessionMetadata = {
    playlist: [
      {
        id: seedSong.id,
        song: seedSong,
        reason: "This song was selected by the user.",
      },
    ],
    language,
    createdAt: new Date().toISOString(),
  };

  // Save to database
  await Promise.all([
    db.collection("sessions").doc(sessionId).set(sessionMetadata),
    db.collection("sessionQueues").doc(sessionId).set(sessionQueue),
  ]);

  void generateSessionQueue(sessionId);

  return sessionId;
}
