import Innertube, { UniversalCache } from "youtubei.js";

const ytCache = new UniversalCache(true);

const innertube = await Innertube.create({
  cache: ytCache,
});

export default innertube;
