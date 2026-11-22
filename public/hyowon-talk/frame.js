(() => {
  const topic = window.location.hash.slice(1);
  window.startProductAssistant({choice: ''}, topic);

  if (window.parent !== window) {
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        window.parent.postMessage({type: 'hyowon-lg144-close'}, location.origin);
      }
    });
  }
})();
