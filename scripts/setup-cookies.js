import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Cookie files that need to be accessible in production
const cookieFiles = ["yt-dlp-cookies.txt", "ytjs-cookies.txt"];

// In Railway, we'll use environment variables for cookie content
// or copy them to a persistent location
function setupCookies() {
  console.log("Setting up cookie files for production...");

  cookieFiles.forEach((file) => {
    const sourcePath = path.join(process.cwd(), file);

    // Check if file exists locally
    if (fs.existsSync(sourcePath)) {
      console.log(`✅ ${file} found locally`);

      // In production, we might want to store cookies as environment variables
      // for better security and deployment flexibility
      if (process.env.NODE_ENV === "production") {
        const envVarName = file.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase();
        const envVarContent = process.env[envVarName];

        if (envVarContent) {
          // Write cookie content from environment variable
          fs.writeFileSync(sourcePath, envVarContent);
          console.log(`✅ ${file} created from environment variable`);
        } else {
          console.log(
            `⚠️  Consider setting ${envVarName} environment variable for production`
          );
        }
      }
    } else {
      console.log(`❌ ${file} not found`);

      // Create empty cookie file as fallback
      fs.writeFileSync(sourcePath, "");
      console.log(`✅ Created empty ${file} as fallback`);
    }
  });

  console.log("Cookie setup completed");
}

// Run setup if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupCookies();
}

export { setupCookies };
