const ENDPOINT = "https://youtube-to-mp337.p.rapidapi.com/api/converttomp3";

export const getYoutubeMp3Url = async (youtubeId: string) => {
  const options = {
    method: "POST",
    headers: {
      "x-rapidapi-key": process.env.RAPIDAPI_KEY as string,
      "x-rapidapi-host": "youtube-to-mp337.p.rapidapi.com",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: `https://www.youtube.com/watch?v=${youtubeId}`,
    }),
  };

  // Ensure the header values are all strings (not possibly undefined)
  if (!process.env.RAPIDAPI_KEY) {
    throw new Error("RAPIDAPI_KEY environment variable is not set");
  }

  const response = await fetch(ENDPOINT, options);
  const data = await response.json();

  if (data.status !== "ok") {
    throw new Error(`Failed to convert YouTube video to MP3: ${data.message}`);
  }

  if (!data.url) {
    throw new Error("No URL returned from YouTube to MP3 API");
  }

  return data.url;
};
