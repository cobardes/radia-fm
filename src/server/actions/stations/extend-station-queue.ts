import { stations } from "@/server/db";
import { Station } from "@/types/station";
import { traceable } from "langsmith/traceable";
import { findMoreSongs } from "./find-more-songs";
import { updateQueue } from "./update-queue";

export const extendStationQueue = traceable(
  async (
    stationId: string,
    count: number = 15,
    force: boolean = false,
    skipQueueUpdate: boolean = false
  ) => {
    const station = await stations.doc(stationId).get();

    if (!station.exists) {
      throw new Error("Station not found");
    }

    const stationData = station.data() as Station;

    if (station.data()?.isExtending && !force) {
      return;
    }

    await stations.doc(stationId).update({ isExtending: true });

    const { playlist, guidelines } = stationData;

    const newPlaylistItems = await findMoreSongs(playlist, count, guidelines);

    // Update the station with the new songs
    await stations.doc(stationId).update({
      playlist: newPlaylistItems,
    });

    // Only update the queue if not skipped
    if (!skipQueueUpdate) {
      // Update the queue with talk segments and songs
      await updateQueue(stationId);

      // Finish the extension process
      await stations.doc(stationId).update({ isExtending: false });
    }

    return true;
  },
  {
    name: "extend-station",
  }
);
