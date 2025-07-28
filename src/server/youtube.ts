import fs from "fs";
import path from "path";
import Innertube, { UniversalCache } from "youtubei.js";

const ytCache = new UniversalCache(true);

const innertube = await Innertube.create({
  cache: ytCache,
  cookie: fs.readFileSync(path.join(process.cwd(), "ytjs-cookies.txt"), "utf8"),
});

export default innertube;
