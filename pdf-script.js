// pdf-script.js - This gets injected into the page context
console.log("PDF script injected into page");

// Function to monitor text selections in PDF viewer
function monitorPDFSelections() {
  // Monitor all mouse up events
  document.addEventListener('mouseup', function() {
    setTimeout(function() {
      const selection = window.getSelection();
      const text = selection.toString().trim();
      
      if (text) {
        console.log("PDF Selection detected:", text.substring(0, 50) + (text.length > 50 ? "..." : ""));
        
        // Send the selection to the content script
        window.postMessage({
          source: "PDF_TEXT_SELECTION",
          text: text
        }, "*");
      }
    }, 100); // Small delay to ensure selection is complete
  });

  // Special handling for Chrome's PDF viewer if available
  if (window.PDFViewerApplication) {
    console.log("Chrome PDF viewer detected!");
    
    // Wait for the viewer to be fully initialized
    if (PDFViewerApplication.initialized) {
      setupPDFViewerEvents();
    } else {
      PDFViewerApplication.initializedPromise.then(setupPDFViewerEvents);
    }
  }
  
  function setupPDFViewerEvents() {
    // Add event listener to the text layer
    const eventBus = PDFViewerApplication.eventBus;
    
    // Listen for text selection events
    eventBus.on('textlayerrendered', function() {
      console.log("PDF text layer rendered");
      
      // Find all text layers
      const textLayers = document.querySelectorAll('.textLayer');
      
      textLayers.forEach(layer => {
        layer.addEventListener('mouseup', function() {
          setTimeout(function() {
            const selection = window.getSelection();
            const text = selection.toString().trim();
            
            if (text) {
              console.log("PDF text layer selection:", text.substring(0, 50) + (text.length > 50 ? "..." : ""));
              
              // Send the selection to the content script
              window.postMessage({
                source: "PDF_TEXT_SELECTION",
                text: text
              }, "*");
            }
          }, 100);
        });
      });
    });
  }
}

// Start monitoring
monitorPDFSelections();
