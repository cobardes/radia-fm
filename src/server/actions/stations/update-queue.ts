import { stations } from "@/server/db";
import chalk from "chalk";
import { traceable } from "langsmith/traceable";
import { generateNextSegment } from "./generate-talk-segment";

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

    await stations.doc(stationId).update({
      isExtending: false,
    });

    return true;
  },
  {
    name: "update-queue",
  }
);
