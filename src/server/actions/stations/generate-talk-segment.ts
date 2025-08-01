import { generateTalkSegmentPromptTemplate } from "@/prompts/stations/generate-talk-segment";
import { speeches, stations } from "@/server/db";
import {
  Station,
  StationQueue,
  StationQueueSong,
  StationQueueTalkSegment,
} from "@/types/station";
import { formatStationPlaylist, formatStationQueue } from "@/utils";
import { getLanguageName } from "@/utils/language";
import { ChatOpenAI } from "@langchain/openai";
import chalk from "chalk";
import { randomUUID } from "crypto";
import { traceable } from "langsmith/traceable";

const model = new ChatOpenAI({
  model: "gpt-4.1",
});

const randomFromArray = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

export const generateNextSegment = traceable(
  async (stationId: string) => {
    console.log(
      chalk.cyan(`🎯 Generating next segment for station: ${stationId}`)
    );

    const station = await stations.doc(stationId).get();

    const {
      playlist,
      queue,
      language,
      guidelines = "",
    } = station.data() as Station;

    // Find the last talk segment in the queue
    const lastTalkSegmentIndex = queue.findLastIndex(
      (item) => item.type === "talk"
    );

    // Split queue into broadcastHistory (up to and including last DJ commentary) and lastSongs (after last DJ commentary)
    const broadcastHistory =
      lastTalkSegmentIndex >= 0
        ? formatStationQueue(queue.slice(0, lastTalkSegmentIndex + 1))
        : "";

    const lastSongs =
      lastTalkSegmentIndex >= 0
        ? formatStationQueue(queue.slice(lastTalkSegmentIndex + 1))
        : formatStationQueue(queue);

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
        guidelines,
        broadcastHistory,
        lastSongs,
        upcomingSongs: formatStationPlaylist(upcomingSongs),
        language: getLanguageName(language),
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
        }): "${newSegment.text.substring(0, 200)}..."`
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
          audioUrl: `/api/playback/mp3/${song.id}`,
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
