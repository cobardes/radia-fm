import { stations } from "@/server/db";
import { Station } from "@/types/station";
import { traceable } from "langsmith/traceable";
import { findMoreSongs } from "./find-more-songs";
import { updateQueue } from "./update-queue";

export const extendStationQueue = traceable(
  async (stationId: string) => {
    const station = await stations.doc(stationId).get();

    if (!station.exists) {
      throw new Error("Station not found");
    }

    const stationData = station.data() as Station;

    if (station.data()?.isExtending) {
      return;
    }

    await stations.doc(stationId).update({ isExtending: true });

    const { playlist } = stationData;

    const newPlaylistItems = await findMoreSongs(playlist, 15);

    // Update the station with the new songs
    await stations.doc(stationId).update({
      playlist: newPlaylistItems,
    });

    // Update the queue with talk segments and songs
    await updateQueue(stationId);

    // Finish the extension process
    await stations.doc(stationId).update({ isExtending: false });

    return true;
  },
  {
    name: "extend-station",
  }
);
