import { promises as fs } from "fs";
import { join } from "path";

export class FileManager {
  private static downloadsDir = join(process.cwd(), "downloads");

  static async ensureDownloadsDir() {
    try {
      await fs.access(this.downloadsDir);
    } catch {
      await fs.mkdir(this.downloadsDir, { recursive: true });
      console.log("Created downloads directory");
    }
  }

  static async cleanupOldFiles(maxAgeHours = 24) {
    try {
      const files = await fs.readdir(this.downloadsDir);
      const now = Date.now();
      const maxAge = maxAgeHours * 60 * 60 * 1000;

      let cleanedCount = 0;
      for (const file of files) {
        const filePath = join(this.downloadsDir, file);
        try {
          const stats = await fs.stat(filePath);

          if (now - stats.mtimeMs > maxAge) {
            await fs.unlink(filePath);
            cleanedCount++;
            console.log(`Cleaned up old file: ${file}`);
          }
        } catch (error) {
          console.warn(`Could not clean up ${file}:`, error);
        }
      }

      if (cleanedCount > 0) {
        console.log(`Cleanup completed: ${cleanedCount} files removed`);
      }
    } catch (error) {
      console.error("Cleanup failed:", error);
    }
  }

  static async getDiskUsage() {
    try {
      const files = await fs.readdir(this.downloadsDir);
      let totalSize = 0;

      for (const file of files) {
        const filePath = join(this.downloadsDir, file);
        try {
          const stats = await fs.stat(filePath);
          totalSize += stats.size;
        } catch (error) {
          // Skip files that can't be accessed
        }
      }

      return {
        fileCount: files.length,
        totalSizeMB: Math.round((totalSize / (1024 * 1024)) * 100) / 100,
      };
    } catch (error) {
      console.error("Could not get disk usage:", error);
      return { fileCount: 0, totalSizeMB: 0 };
    }
  }
}

// Initialize downloads directory on module load
FileManager.ensureDownloadsDir();
