import { generateTalkSegmentPromptTemplate } from "@/prompts/stations/generate-talk-segment";
import { speeches, stations } from "@/server/db";
import {
  Station,
  StationQueue,
  StationQueueSong,
  StationQueueTalkSegment,
} from "@/types/station";
import { formatStationPlaylist, formatStationQueue } from "@/utils";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import chalk from "chalk";
import { randomUUID } from "crypto";
import { traceable } from "langsmith/traceable";

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-pro",
});

const randomFromArray = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

const generateNextSegment = traceable(
  async (stationId: string) => {
    console.log(
      chalk.cyan(`🎯 Generating next segment for station: ${stationId}`)
    );

    const station = await stations.doc(stationId).get();

    const { playlist, queue, language } = station.data() as Station;

    const previouslyPlayed = formatStationQueue(queue);
    const nonPlayedSongs = playlist.filter(
      (song) => !queue.some((s) => s.id === song.id)
    );

    console.log(
      chalk.blue(
        `📊 Playlist status: ${nonPlayedSongs.length} songs remaining out of ${playlist.length} total`
      )
    );

    const upcomingSongs = nonPlayedSongs.slice(
      0,
      randomFromArray([1, 2, 2, 2, 3, 3])
    );

    if (upcomingSongs.length === 0) {
      console.log(
        chalk.yellow(`⚠️ No more songs available for station ${stationId}`)
      );
      return null;
    }

    console.log(
      chalk.magenta(
        `🎵 Selecting ${upcomingSongs.length} upcoming songs: ${upcomingSongs
          .map((s) => `${s.artist} - ${s.title}`)
          .join(", ")}`
      )
    );

    // Generate the next talk segment and save it to the database
    console.log(chalk.cyan(`🤖 Generating talk segment using AI model...`));
    const nextSegment = await model.invoke(
      await generateTalkSegmentPromptTemplate.invoke({
        previouslyPlayed,
        upcomingSongs: formatStationPlaylist(upcomingSongs),
        language,
      }),
      { runName: "generate-talk-segment" }
    );

    const newSegmentId = randomUUID().slice(0, 8);

    const newSegment: StationQueueTalkSegment = {
      id: newSegmentId,
      type: "talk",
      text: nextSegment.content.toString(),
      audioUrl: `/api/playback/segment/${newSegmentId}`,
    };

    console.log(
      chalk.green(
        `✅ Generated talk segment (ID: ${
          newSegment.id
        }): "${newSegment.text.substring(0, 100)}..."`
      )
    );

    await speeches.doc(newSegmentId).set({
      text: newSegment.text,
      language,
    });

    console.log(
      chalk.blue(`💾 Saved speech to database for segment ${newSegment.id}`)
    );

    // Update the queue with the new segment and upcoming songs
    const newQueue: StationQueue = [
      ...queue,
      newSegment,
      ...upcomingSongs.map((song) => {
        const newSong: StationQueueSong = {
          id: song.id,
          type: "song" as const,
          title: song.title,
          artist: song.artist,
          reason: song.reason,
          audioUrl: `/api/playback/song/${song.id}`,
        };
        return newSong;
      }),
    ];

    await stations.doc(stationId).update({
      queue: newQueue,
    });

    console.log(
      chalk.green(
        `🔄 Updated station queue - added 1 talk segment + ${upcomingSongs.length} songs`
      )
    );

    return nextSegment.content.toString();
  },
  {
    name: "generate-next-segment",
  }
);

export const updateQueue = traceable(
  async (stationId: string) => {
    console.log(
      chalk.bold.blue(`🚀 Starting queue update for station: ${stationId}`)
    );

    const station = await stations.doc(stationId).get();

    if (!station.exists) {
      console.log(chalk.red(`❌ Station ${stationId} not found`));
      throw new Error("Station not found");
    }

    console.log(
      chalk.blue(`📻 Station found, beginning queue generation process...`)
    );

    let segmentCount = 0;
    let result = await generateNextSegment(stationId);

    while (result !== null) {
      segmentCount++;
      console.log(chalk.green(`✨ Generated segment ${segmentCount}`));
      result = await generateNextSegment(stationId);
    }

    console.log(
      chalk.bold.green(
        `🎉 Queue update completed for station ${stationId}! Generated ${segmentCount} segments total.`
      )
    );

    return true;
  },
  {
    name: "update-queue",
  }
);
