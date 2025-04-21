// pdf-inject.js
(function() {
  function monitorSelection() {
    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('keyup', (e) => {
      if (e.ctrlKey && e.key === 'c') handleSelection();
    });
  }
  function handleSelection() {
    setTimeout(() => {
      const sel = window.getSelection().toString().trim();
      if (sel) {
        window.postMessage({ source: 'PDF_TEXT_SELECTION', text: sel }, '*');
      }
    }, 10);
  }

  // If PDF.js viewer is present, hook its textlayerrendered event
  if (window.PDFViewerApplication?.eventBus) {
    window.PDFViewerApplication.eventBus.on('textlayerrendered', monitorSelection);
  }
  // Always start listening
  monitorSelection();
})();
