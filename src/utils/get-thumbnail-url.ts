export const getThumbnailUrl = (youtubeId: string, size: number = 300) => {
  return `https://wsrv.nl/?url=${encodeURIComponent(
    `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`
  )}&width=${size}&height=${size}&fit=cover`;
};
