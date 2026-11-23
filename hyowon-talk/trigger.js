// Single delegated listener also supports buttons rendered after client-side navigation.
(() => {
  const script = document.currentScript;
  if (!script || window.HyowonLG144Trigger) return;
  const guideURL = new URL('index.html', script.src);
  let dialog;
  let frame;
  let opener;
  let oldOverflow;

  function buildDialog() {
    dialog = document.createElement('dialog');
    dialog.dataset.lg144Guide = '';
    dialog.setAttribute('aria-label', '라이프앤조이 LG 결합상담');
    const top = document.createElement('div');
    top.dataset.lg144Top = '';
    const close = document.createElement('button');
    close.type = 'button';
    close.dataset.lg144Close = '';
    close.setAttribute('aria-label', '상담창 닫기');
    close.textContent = '×';
    close.addEventListener('click', () => dialog.close());
    top.append(close);
    frame = document.createElement('iframe');
    frame.title = 'LG 가전 목록과 가입 신청';
    frame.src = guideURL.href;
    dialog.append(top, frame);
    document.body.append(dialog);
    dialog.addEventListener('close', () => {
      document.documentElement.style.overflow = oldOverflow;
      opener?.focus({preventScroll:true});
    });
    window.addEventListener('message', event => {
      if (event.origin !== location.origin || event.source !== frame.contentWindow) return;
      if (event.data?.type === 'hyowon-lg144-close' && dialog.open) dialog.close();
      if (event.data?.type === 'hyowon-lg144-resize' && typeof event.data.height === 'number') {
        const maxH = Math.max(320, Math.floor(window.innerHeight * 0.94) - 52);
        frame.style.height = Math.min(Math.ceil(event.data.height), maxH) + 'px';
      }
      if (event.data?.type === 'hyowon-lg144-receipt' && typeof event.data.receipt === 'string') {
        window.dispatchEvent(new CustomEvent('hyowon-lg144:application-saved', {detail: {receipt: event.data.receipt}}));
      }
    });
  }

  function open(trigger) {
    if (!dialog) buildDialog();
    if (dialog.open) return;
    opener = trigger || document.activeElement;
    oldOverflow = document.documentElement.style.overflow;
    dialog.showModal();
    document.documentElement.style.overflow = 'hidden';
  }

  document.addEventListener('click', event => {
    const trigger = event.target.closest?.('[data-hyowon-talk]');
    if (!trigger) return;
    event.preventDefault();
    open(trigger);
  });
  window.HyowonLG144Trigger = Object.freeze({open});
})();
