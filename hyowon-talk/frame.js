(() => {
  const topic = window.location.hash.slice(1);
  window.startProductAssistant({choice: ''}, topic);

  if (window.parent !== window) {
    const guide = document.getElementById('guide');
    const postHeight = () => {
      const h = guide ? Math.ceil(guide.getBoundingClientRect().height) : document.documentElement.scrollHeight;
      if (h > 0) window.parent.postMessage({type: 'hyowon-lg144-resize', height: h}, location.origin);
    };
    if (guide && typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(postHeight).observe(guide);
    }
    window.addEventListener('load', postHeight);
    setTimeout(postHeight, 50);

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        window.parent.postMessage({type: 'hyowon-lg144-close'}, location.origin);
      }
    });
  }
})();
