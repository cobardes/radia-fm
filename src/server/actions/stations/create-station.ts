"use server";

import { Song } from "@/types";
import { faker } from "@faker-js/faker";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { kebabCase } from "change-case";
import { randomUUID } from "crypto";
import { traceable } from "langsmith/traceable";

import { greetingPromptTemplate } from "@/prompts/stations/greeting";
import { speeches, stations } from "@/server/db";
import {
  Station,
  StationLanguage,
  StationQueueTalkSegment,
} from "@/types/station";
import { getMessageContentText } from "@/utils";
import chalk from "chalk";
import { extendStationQueue } from "./extend-station-queue";

const groundedFlashModel = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
}).bindTools([
  {
    googleSearch: {},
  },
]);

const greetingModel = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  temperature: 1.5,
});

const _createStation = async (
  initialSong: Song,
  language: StationLanguage,
  creatorId: string
): Promise<string> => {
  if (!initialSong || !initialSong.id) {
    throw new Error("Valid initialSong is required");
  }

  const stationId = kebabCase(faker.word.words(3));

  const greetingSegmentId = randomUUID().slice(0, 8);

  console.log(chalk.yellow("Researching initial song..."));

  const initialSongInfo = await groundedFlashModel.invoke(
    `
    Research the song ${initialSong.title} by ${initialSong.artists[0]} and write a brief 200 word paragraph about it. Return the paragraph and nothing else.
    `,
    { runName: "get-initial-song-info" }
  );

  const initialSongInfoText = getMessageContentText(initialSongInfo.content);

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

  const greetingSegment: StationQueueTalkSegment = {
    id: greetingSegmentId,
    type: "talk",
    text: greeting.content.toString(),
    audioUrl: speechUrl,
  };

  const initialStation: Station = {
    id: stationId,
    playlist: [
      {
        id: initialSong.id,
        title: initialSong.title,
        artist: initialSong.artists[0],
        reason: `This song was selected by the user. ${initialSongInfoText}`,
      },
    ],
    queue: [
      greetingSegment,
      {
        type: "song",
        id: initialSong.id,
        title: initialSong.title,
        artist: initialSong.artists[0],
        reason: `This song was selected by the user. ${initialSongInfoText}`,
        audioUrl: songUrl,
      },
    ],
    isExtending: false,
    language,
    createdAt: new Date().toISOString(),
    creatorId,
    currentIndex: -1,
    lastPlaybackUpdate: new Date().toISOString(),
  };

  await stations.doc(stationId).set(initialStation);

  // Extend station asynchronously
  void extendStationQueue(stationId);

  return stationId;
};

export const createStation = traceable(_createStation, {
  name: "create-station",
});
