"use server";

import { Song } from "@/types";
import { faker } from "@faker-js/faker";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { kebabCase } from "change-case";
import { randomUUID } from "crypto";
import { traceable } from "langsmith/traceable";

import { generateInstructionsPromptTemplate } from "@/prompts/stations/generate-guidelines";
import {
  greetingPromptTemplate,
  queryGreetingPromptTemplate,
} from "@/prompts/stations/greeting";
import { speeches, stations } from "@/server/db";
import {
  guidelinesSchema,
  Station,
  StationLanguage,
  StationQueueSong,
  StationQueueTalkSegment,
} from "@/types/station";
import { getMessageContentText } from "@/utils";
import { getSongPlaybackUrl, getSpeechPlaybackUrl } from "@/utils/url-utils";
import chalk from "chalk";
import { attachYoutubeIds } from "./attach-youtube-ids";
import { extendStationQueue } from "./extend-station-queue";
import { updateQueue } from "./update-queue";

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

const guidelinesModel = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
}).withStructuredOutput(guidelinesSchema);

const _createStation = async (
  seedInput: Song | string,
  language: StationLanguage,
  creatorId: string
): Promise<string> => {
  const isQueryMode = typeof seedInput === "string";

  if (!isQueryMode && (!seedInput || !seedInput.id)) {
    throw new Error("Valid initialSong is required");
  }

  if (isQueryMode && !seedInput.trim()) {
    throw new Error("Valid query is required");
  }

  const stationId = kebabCase(faker.word.words(3));

  // Create initial station based on mode
  if (isQueryMode) {
    // Query mode: Create station and find songs asynchronously
    const initialStation: Station = {
      id: stationId,
      playlist: [],
      queue: [],
      isExtending: true,
      language,
      createdAt: new Date().toISOString(),
      creatorId,
      currentIndex: -1,
      lastPlaybackUpdate: new Date().toISOString(),
    };

    await stations.doc(stationId).set(initialStation);

    // Handle query mode asynchronously
    (async () => {
      try {
        const query = seedInput as string;

        stations.doc(stationId).update({
          statusMessage: "Thinking about your request",
        });

        console.log(chalk.yellow("Generating guidelines from query..."));

        const guidelinesResponse = await groundedFlashModel.invoke(
          await generateInstructionsPromptTemplate.invoke({ query }),
          { runName: "generate-guidelines" }
        );

        const guidelinesDraft = getMessageContentText(
          guidelinesResponse.content
        );

        const { guidelines, initialSong } = await guidelinesModel.invoke(
          guidelinesDraft,
          {
            runName: "parse-guidelines",
          }
        );

        console.log(chalk.green(`Generated guidelines: ${guidelines}`));
        console.log(
          chalk.green(
            `Initial song: ${initialSong.title} - ${
              initialSong.artist
            }. Reason: ${initialSong.reason.slice(0, 100)}...`
          )
        );

        // Update station with guidelines
        await stations.doc(stationId).update({
          guidelines,
          statusMessage: "Updating playlist",
        });

        const initialPlaylist = await attachYoutubeIds([initialSong]);

        await stations.doc(stationId).update({
          playlist: initialPlaylist,
          statusMessage: "Putting everything together",
        });

        if (initialPlaylist.length > 0) {
          const firstSong = initialPlaylist[0];

          console.log(chalk.yellow("Generating query greeting..."));

          const greeting = await greetingModel.invoke(
            await queryGreetingPromptTemplate.invoke({
              query,
              songTitle: firstSong.title,
              artistName: firstSong.artist,
              songAbout: firstSong.reason,
              language,
            }),
            { runName: "generate-query-greeting" }
          );

          console.log(
            chalk.green(`Generated query greeting: ${greeting.content}`)
          );

          const greetingSegmentId = randomUUID().slice(0, 8);
          await speeches.doc(greetingSegmentId).set({
            text: greeting.content.toString(),
            language,
          });

          console.log(
            chalk.green(`Saved query greeting segment: ${greetingSegmentId}`)
          );

          const greetingSegment: StationQueueTalkSegment = {
            id: greetingSegmentId,
            type: "talk",
            text: greeting.content.toString(),
            audioUrl: getSpeechPlaybackUrl(greetingSegmentId),
          };

          const firstSongSegment: StationQueueSong = {
            type: "song",
            id: firstSong.id,
            title: firstSong.title,
            artist: firstSong.artist,
            reason: firstSong.reason,
            audioUrl: getSongPlaybackUrl(firstSong.id),
          };

          // Set the greeting and first song as the initial queue items
          await stations.doc(stationId).update({
            queue: [greetingSegment, firstSongSegment],
          });

          console.log(chalk.green("Added greeting to queue"));

          // Now update the queue with songs (this will add songs after the greeting)
          await updateQueue(stationId);

          console.log(chalk.green("Updated queue with songs"));
        }
      } catch (error) {
        console.error("Error in query mode station creation:", error);
        await stations.doc(stationId).update({
          statusMessage: `Error: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        });
      }
    })();
  } else {
    // Song mode: Original behavior with initial song
    const initialSong = seedInput as Song;

    const initialStation: Station = {
      id: stationId,
      playlist: [],
      queue: [],
      isExtending: true,
      language,
      createdAt: new Date().toISOString(),
      creatorId,
      currentIndex: -1,
      lastPlaybackUpdate: new Date().toISOString(),
    };

    await stations.doc(stationId).set(initialStation);

    (async () => {
      const greetingSegmentId = randomUUID().slice(0, 8);

      stations.doc(stationId).update({
        statusMessage: "Creating station",
      });

      console.log(chalk.yellow("Researching initial song..."));

      const initialSongInfo = await groundedFlashModel.invoke(
        `
      Research the song ${initialSong.title} by ${initialSong.artists[0]} and write a brief 200 word paragraph about it. Return the paragraph and nothing else.
      `,
        { runName: "get-initial-song-info" }
      );

      const initialSongInfoText = getMessageContentText(
        initialSongInfo.content
      );

      console.log(
        chalk.green(`Found initial song info: ${initialSongInfoText}`)
      );

      stations.doc(stationId).update({
        statusMessage: "Doing some research",
      });

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
      const songUrl = `/api/playback/mp3/${initialSong.id}`;

      const greetingSegment: StationQueueTalkSegment = {
        id: greetingSegmentId,
        type: "talk",
        text: greeting.content.toString(),
        audioUrl: speechUrl,
      };

      const updatedStation: Station = {
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
        statusMessage: undefined,
        lastPlaybackUpdate: new Date().toISOString(),
      };

      await stations.doc(stationId).set(updatedStation);

      // Extend station asynchronously
      void extendStationQueue(stationId, 15, true);
    })();
  }

  return stationId;
};

export const createStation = traceable(_createStation, {
  name: "create-station",
});
