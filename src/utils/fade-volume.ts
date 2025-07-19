export function fadeVolume(
  audioElement: HTMLAudioElement,
  from: number,
  to: number,
  duration: number
): void {
  const startTime = performance.now();
  const volumeDiff = to - from;

  function updateVolume() {
    const elapsed = performance.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);

    audioElement.volume = from + volumeDiff * progress;

    if (progress < 1) {
      requestAnimationFrame(updateVolume);
    }
  }

  requestAnimationFrame(updateVolume);
}
