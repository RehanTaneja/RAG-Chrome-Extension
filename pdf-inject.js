// pdf-inject.js
console.log("PDF injection script loaded");

// Function that will run in the context of the PDF viewer
function captureTextFromPDF() {
  try {
    // For Chrome's PDF viewer
    if (window.PDFViewerApplication) {
      window.PDFViewerApplication.pdfViewer.eventBus.on('textlayerrendered', function() {
        console.log("PDF text layer rendered");
        monitorSelection();
      });
    }
    
    // General selection monitoring
    monitorSelection();
    
    function monitorSelection() {
      document.addEventListener('mouseup', sendSelectedText);
      document.addEventListener('keyup', function(e) {
        if (e.key === 'c' && e.ctrlKey) sendSelectedText();
      });
    }

    function sendSelectedText() {
      setTimeout(() => {
        const selectedText = window.getSelection().toString().trim();
        if (selectedText) {
          console.log("Selected text in PDF:", selectedText.substring(0, 50) + "...");
          
          // Use postMessage to communicate with content script
          window.postMessage({
            type: "FROM_PDF_PAGE",
            text: selectedText
          }, "*");
        }
      }, 100);
    }
  } catch (e) {
    console.error("Error in PDF injection:", e);
  }
}

// Execute immediately
captureTextFromPDF();
