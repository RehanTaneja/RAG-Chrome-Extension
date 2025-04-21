// pdf-inject.js
console.log("PDF injection script loaded");

function captureTextFromPDF() {
  let isChromePDFViewer = false;
  
  try {
    // Detect Chrome's PDF viewer
    if (window.PDFViewerApplication) {
      isChromePDFViewer = true;
      console.log("Detected Chrome PDF viewer");
      
      // Wait until the document is fully loaded
      if (document.readyState === 'complete') {
        initPDFHandlers();
      } else {
        window.addEventListener('load', initPDFHandlers);
      }
    }
    
    // General PDF handling
    if (!isChromePDFViewer) {
      monitorSelection();
    }

    function initPDFHandlers() {
      console.log("Initializing PDF handlers");
      
      // Hook into text layer updates
      const eventBus = window.PDFViewerApplication.eventBus;
      eventBus.on('textlayerrendered', function(event) {
        console.log("Text layer rendered, page:", event.pageNumber);
        monitorSelection();
      });

      // Initial check in case text layer was already rendered
      monitorSelection();
    }

    function monitorSelection() {
      console.log("Setting up selection monitoring");
      document.addEventListener('mouseup', handleSelection);
      document.addEventListener('keyup', handleKeySelection);
    }

    function handleKeySelection(e) {
      if (e.ctrlKey && e.key === 'c') {
        handleSelection();
      }
    }

    function handleSelection() {
      setTimeout(() => {
        const selection = window.getSelection();
        const selectedText = selection ? selection.toString().trim() : '';
        
        if (selectedText) {
          console.log("PDF selection detected:", selectedText.substring(0, 50));
          window.postMessage({
            source: 'PDF_TEXT_SELECTION',
            text: selectedText
          }, '*');
        }
      }, 
