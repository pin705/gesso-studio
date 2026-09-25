// Injected into HTML asset previews in the studio: lets the viewer pause and scrub CSS/SMIL animations.
// Scripted assets (defineAsset) handle the same messages themselves.
addEventListener('message', (event) => {
  const message = event.data?.gesso;
  if (!message || window.gesso) return;
  const t = event.data.t ?? 0;
  for (const svg of document.querySelectorAll('svg')) {
    if (message === 'seek') { svg.pauseAnimations?.(); svg.setCurrentTime?.(t); } else svg.unpauseAnimations?.();
  }
  for (const animation of document.getAnimations()) {
    animation.currentTime = t * 1000;
    if (message === 'seek') animation.pause(); else animation.play();
  }
});
