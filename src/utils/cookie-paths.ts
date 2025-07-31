import fs from "fs";
import path from "path";

export function getCookieContent(envVarName: string): string | null {
  // Check if we have cookie content from environment variables
  const envVarContent = process.env[envVarName];

  if (envVarContent) {
    return envVarContent;
  }

  return null;
}

export function getCookiePath(filename: string): string | null {
  // Try to get cookies from environment variable first
  const envVarName = filename.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase();
  const envVarContent = process.env[envVarName];

  if (envVarContent) {
    const cookiePath = path.join(process.cwd(), filename);

    // Write cookie content from environment variable if file doesn't exist
    if (!fs.existsSync(cookiePath)) {
      fs.writeFileSync(cookiePath, envVarContent);
      console.log(`Created ${filename} from environment variable`);
    }

    return cookiePath;
  }

  // Check if file exists locally (for backward compatibility)
  const cookiePath = path.join(process.cwd(), filename);
  if (fs.existsSync(cookiePath)) {
    return cookiePath;
  }

  // Return null if no cookies are available
  return null;
}

export const COOKIE_PATHS = {
  YT_DLP: () => getCookiePath("yt-dlp-cookies.txt"),
  YTJS: () => getCookiePath("ytjs-cookies.txt"),
};

export const COOKIE_CONTENT = {
  YT_DLP: () => getCookieContent("YT_DLP_COOKIES_TXT"),
  YTJS: () => getCookieContent("YTJS_COOKIES_TXT"),
};
