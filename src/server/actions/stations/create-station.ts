"use server";

import { langsmithClient } from "@/lib/langsmith";
import { Song } from "@/types";
import { type MessageContentText } from "@langchain/core/messages";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { randomUUID } from "crypto";
import { traceable } from "langsmith/traceable";

import { greetingPromptTemplate } from "@/prompts/stations/greeting";
import { speeches, stations } from "@/server/db";
import {
  Station,
  StationLanguage,
  StationScriptTalkSegment,
} from "@/types/station";
import { ChatOpenAI } from "@langchain/openai";
import chalk from "chalk";

const groundedFlashModel = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
}).bindTools([
  {
    googleSearch: {},
  },
]);

const greetingModel = new ChatOpenAI({
  model: "gpt-4.1-mini",
});

const _createStation = async (
  initialSong: Song,
  language: StationLanguage
): Promise<string> => {
  if (!initialSong || !initialSong.id) {
    throw new Error("Valid initialSong is required");
  }

  const stationId = randomUUID();
  const greetingSegmentId = randomUUID();

  console.log(chalk.yellow("Researching initial song..."));

  const initialSongInfo = await groundedFlashModel.invoke(
    `
    Research the song ${initialSong.title} by ${initialSong.artists[0]} and write a brief 200 word paragraph about it. Return the paragraph and nothing else.
    `,
    { runName: "get-initial-song-info" }
  );

  const initialSongInfoText =
    typeof initialSongInfo.content === "string"
      ? initialSongInfo.content
      : (
          initialSongInfo.content.findLast(
            (content) => content.type === "text"
          ) as MessageContentText
        )?.text;

  console.log(chalk.green(`Found initial song info: ${initialSongInfoText}`));

  console.log(chalk.yellow("Generating greeting..."));

  const greeting = await greetingModel.invoke(
    await greetingPromptTemplate.invoke({
      songTitle: initialSong.title,
      artistName: initialSong.artists[0],
      language,
    }),
    { runName: "generate-greeting" }
  );

  console.log(chalk.green(`Generated greeting: ${greeting.content}`));

  await speeches.doc(greetingSegmentId).set({
    text: greeting.content.toString(),
    language,
  });

  console.log(chalk.green(`Saved greeting segment: ${greetingSegmentId}`));

  const speechUrl = `/api/playback/segment/${greetingSegmentId}`;
  const songUrl = `/api/playback/song/${initialSong.id}`;

  const greetingSegment: StationScriptTalkSegment = {
    id: greetingSegmentId,
    type: "talk_segment",
    text: greeting.content.toString(),
    audioUrl: speechUrl,
  };

  const initialStation: Station = {
    id: stationId,
    playlist: [
      {
        id: initialSong.id,
        song: initialSong,
        reason: `This song was selected by the user. ${initialSongInfoText}`,
        isInScript: true,
      },
    ],
    script: [
      {
        type: "song",
        id: initialSong.id,
        song: initialSong,
        audioUrl: songUrl,
      },
      {
        type: "talk_segment",
        id: greetingSegmentId,
        text: greetingSegment.text,
        audioUrl: speechUrl,
      },
    ],
    isExtending: false,
    createdAt: new Date().toISOString(),
  };

  await stations.doc(stationId).set(initialStation);

  // Flush traces to LangSmith
  await langsmithClient.awaitPendingTraceBatches();

  return stationId;
};

export const createStation = traceable(_createStation, {
  name: "create-station",
});
