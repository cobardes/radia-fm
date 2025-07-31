import fs from "fs";
import path from "path";

export function getCookiePath(filename: string): string {
  // In production, check if we have cookie content from environment variables
  if (process.env.NODE_ENV === "production") {
    const envVarName = filename.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase();
    const envVarContent = process.env[envVarName];

    if (envVarContent) {
      const cookiePath = path.join(process.cwd(), filename);

      // Write cookie content from environment variable if file doesn't exist
      if (!fs.existsSync(cookiePath)) {
        fs.writeFileSync(cookiePath, envVarContent);
        console.log(`Created ${filename} from environment variable`);
      }
    }
  }

  return path.join(process.cwd(), filename);
}

export const COOKIE_PATHS = {
  YT_DLP: () => getCookiePath("yt-dlp-cookies.txt"),
  YTJS: () => getCookiePath("ytjs-cookies.txt"),
};
