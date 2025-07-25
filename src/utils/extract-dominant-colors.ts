/**
 * Extracts the dominant colors from an image URL
 * @param imageUrl - The URL of the image to analyze
 * @returns Promise that resolves to an array of RGB color strings
 */

/**
 * Calculates the vibrancy of a color based on saturation and luminance
 * @param r - Red component (0-255)
 * @param g - Green component (0-255)
 * @param b - Blue component (0-255)
 * @returns Vibrancy score (higher = more vibrant)
 */
const calculateVibrancy = (r: number, g: number, b: number): number => {
  // Convert RGB to HSL for better vibrancy calculation
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const diff = max - min;

  // Calculate lightness
  const lightness = (max + min) / 2;

  // Calculate saturation
  let saturation = 0;
  if (diff !== 0) {
    saturation = lightness > 0.5 ? diff / (2 - max - min) : diff / (max + min);
  }

  // Vibrancy favors high saturation and moderate lightness
  // Penalize very dark (< 0.2) and very light (> 0.8) colors
  const lightnessPenalty = lightness < 0.2 || lightness > 0.8 ? 0.5 : 1;

  return saturation * lightnessPenalty;
};

export const extractDominantColors = (imageUrl: string): Promise<string[]> => {
  return new Promise((resolve) => {
    const img = document.createElement("img");
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        resolve([]);
        return;
      }

      // Resize for performance
      const size = 150;
      canvas.width = size;
      canvas.height = size;

      ctx.drawImage(img, 0, 0, size, size);

      try {
        const imageData = ctx.getImageData(0, 0, size, size);
        const pixels = imageData.data;

        // Count color frequency and store RGB values
        const colorData = new Map<
          string,
          { count: number; r: number; g: number; b: number }
        >();

        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const a = pixels[i + 3];

          // Skip transparent/very transparent pixels
          if (a < 125) continue;

          // Group similar colors by reducing precision
          const groupedR = Math.floor(r / 32) * 32;
          const groupedG = Math.floor(g / 32) * 32;
          const groupedB = Math.floor(b / 32) * 32;

          const color = `rgb(${groupedR}, ${groupedG}, ${groupedB})`;
          const existing = colorData.get(color);

          if (existing) {
            existing.count++;
          } else {
            colorData.set(color, {
              count: 1,
              r: groupedR,
              g: groupedG,
              b: groupedB,
            });
          }
        }

        // Sort by frequency and get top colors
        const sortedByFrequency = Array.from(colorData.entries())
          .sort((a, b) => b[1].count - a[1].count)
          .slice(0, 5);

        if (sortedByFrequency.length === 0) {
          resolve([]);
          return;
        }

        // Find the most vibrant color among the top colors
        let mostVibrantIndex = 0;
        let highestVibrancy = 0;

        sortedByFrequency.forEach(([color, data], index) => {
          const vibrancy = calculateVibrancy(data.r, data.g, data.b);
          if (vibrancy > highestVibrancy) {
            highestVibrancy = vibrancy;
            mostVibrantIndex = index;
          }
        });

        // Reorder: most vibrant first, then the rest by frequency
        const result = [sortedByFrequency[mostVibrantIndex][0]];

        // Add the remaining colors (excluding the most vibrant one)
        sortedByFrequency.forEach(([color], index) => {
          if (index !== mostVibrantIndex) {
            result.push(color);
          }
        });

        resolve(result);
      } catch (error) {
        console.warn("Could not extract colors from image:", error);
        resolve([]);
      }
    };

    img.onerror = () => {
      resolve([]);
    };

    img.src = imageUrl;
  });
};
