import fs from "fs";
import path from "path";
import Innertube, { UniversalCache } from "youtubei.js";

const ytCache = new UniversalCache(true);

const cookie = await fs.readFileSync(
  path.join(process.cwd(), "ytjs-cookies.txt"),
  "utf8"
);

const innertube = await Innertube.create({
  cache: ytCache,
  cookie,
});

export default innertube;
