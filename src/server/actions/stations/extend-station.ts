import { stations } from "@/server/db";
import { Station } from "@/types/station";
import { traceable } from "langsmith/traceable";
import { findMoreSongs } from "./find-more-songs";

const _extendStation = async (stationId: string) => {
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

  const newPlaylistItems = await findMoreSongs(playlist);

  const newStation: Station = {
    ...stationData,
    playlist: [...playlist, ...newPlaylistItems],
  };

  await stations.doc(stationId).set(newStation);

  await stations.doc(stationId).update({ isExtending: false });

  return newStation;
};

export const extendStation = traceable(_extendStation, {
  name: "extend-station",
});
