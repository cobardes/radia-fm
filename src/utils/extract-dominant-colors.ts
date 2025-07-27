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

export const extractDominantColors = (
  imageUrl: string
): Promise<
  [string, string, string, string, string, string, string, string]
> => {
  return new Promise((resolve) => {
    const img = document.createElement("img");
    img.crossOrigin = "anonymous";

    // Fallback colors to use when we can't extract enough colors
    const fallbackColors: [
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string
    ] = [
      "#6B7280", // Gray-500
      "#9CA3AF", // Gray-400
      "#D1D5DB", // Gray-300
      "#E5E7EB", // Gray-200
      "#F3F4F6", // Gray-100
      "#4B5563", // Gray-600
      "#374151", // Gray-700
      "#1F2937", // Gray-800
    ];

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        resolve(fallbackColors);
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

          // Calculate brightness (perceived luminance) to filter out dark colors
          const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

          // Skip colors that are too dark (brightness < 0.2)
          if (brightness < 0.25 || brightness > 0.85) continue;

          // Calculate vibrancy and filter out low-vibrancy colors early
          const vibrancy = calculateVibrancy(r, g, b);
          if (vibrancy < 0.2) continue;

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
          .slice(0, 8);

        if (sortedByFrequency.length === 0) {
          resolve(fallbackColors);
          return;
        }

        // Sort all colors by vibrancy (highest first)
        const sortedByVibrancy = sortedByFrequency
          .map(([color, data]) => ({
            color,
            vibrancy: calculateVibrancy(data.r, data.g, data.b),
          }))
          .sort((a, b) => b.vibrancy - a.vibrancy)
          .map(({ color }) => color);

        // Ensure we always have exactly 8 colors by padding with fallbacks
        const paddedColors = [...sortedByVibrancy];
        while (paddedColors.length < 8) {
          paddedColors.push(fallbackColors[paddedColors.length]);
        }

        resolve(
          paddedColors as [
            string,
            string,
            string,
            string,
            string,
            string,
            string,
            string
          ]
        );
      } catch (error) {
        console.warn("Could not extract colors from image:", error);
        resolve(fallbackColors);
      }
    };

    img.onerror = () => {
      resolve(fallbackColors);
    };

    img.src = imageUrl;
  });
};
