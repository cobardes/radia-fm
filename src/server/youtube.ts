import fs from "fs";
import path from "path";
import Innertube, { UniversalCache } from "youtubei.js";
import { COOKIE_CONTENT } from "../utils/cookie-paths";

const ytCache = new UniversalCache(true);

// Try to get cookie content from environment variable or file
let cookie: string | undefined;

const cookieContent = COOKIE_CONTENT.YTJS();
if (cookieContent) {
  cookie = cookieContent;
  console.log("Using YouTube cookies from environment variable");
} else {
  // Check if file exists for backward compatibility
  const cookieFilePath = path.join(process.cwd(), "ytjs-cookies.txt");
  if (fs.existsSync(cookieFilePath)) {
    cookie = fs.readFileSync(cookieFilePath, "utf8");
    console.log("Using YouTube cookies from file");
  } else {
    console.log("No YouTube cookies found - proceeding without authentication");
  }
}

const innertube = await Innertube.create({
  cache: ytCache,
  ...(cookie && { cookie }),
});

export default innertube;
