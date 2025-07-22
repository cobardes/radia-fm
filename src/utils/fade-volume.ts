export function fadeVolume(
  audioElement: HTMLAudioElement,
  from: number,
  to: number,
  duration: number
): void {
  const startTime = performance.now();
  const volumeDiff = to - from;

  const interval = setInterval(() => {
    const elapsed = performance.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);

    audioElement.volume = from + volumeDiff * progress;

    if (progress >= 1) {
      clearInterval(interval);
    }
  }, 16); // ~60fps
}
