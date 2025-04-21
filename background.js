// background.js
console.log("Background script running");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "captureSelection") {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (!tabs || !tabs.length) {
        sendResponse({error: "No active tab"});
        return;
      }
      
      // First check if URL is a PDF
      const url = tabs[0].url;
      const isPDF = url.toLowerCase().endsWith('.pdf') || url.includes('pdf');
      
      // Execute script to capture the selection with special PDF handling
      chrome.scripting.executeScript({
        target: {tabId: tabs[0].id},
        function: getSelectionFromPage,
        args: [isPDF]
      }).then(results => {
        if (results && results[0]) {
          const selectedText = results[0].result;
          
          if (selectedText) {
            // Store the selection
            chrome.storage.local.set({selectedText: selectedText}, () => {
              console.log("Selection saved:", selectedText.substring(0, 50) + "...");
              sendResponse({text: selectedText});
            });
          } else {
            console.log("No text selected");
            sendResponse({text: ""});
          }
        } else {
          sendResponse({error: "Failed to get selection"});
        }
      }).catch(error => {
        console.error("Script execution error:", error);
        sendResponse({error: error.message});
      });
    });
    
    return true; // Keep the messaging channel open for async response
  }
});

// This function runs in the context of the page with special PDF handling
function getSelectionFromPage(isPDF) {
  console.log("getSelectionFromPage called, isPDF:", isPDF);
  
  // Standard selection method
  const selection = window.getSelection();
  let text = selection ? selection.toString().trim() : "";
  
  if (text) {
    console.log("Got selection using standard method:", text.substring(0, 50) + "...");
    return text;
  }
  
  // If we're in a PDF and didn't get text, try alternative methods
  if (isPDF) {
    console.log("Trying PDF-specific methods");
    
    // Method 1: Try to access PDF.js viewer
    try {
      if (window.PDFViewerApplication) {
        const pdfViewer = window.PDFViewerApplication.pdfViewer;
        if (pdfViewer) {
          const currentPageNumber = pdfViewer.currentPageNumber;
          const textContent = window.PDFViewerApplication.pdfDocument.getPage(currentPageNumber)
            .then(page => page.getTextContent())
            .then(textContent => {
              return textContent.items.map(item => item.str).join(' ');
            });
          if (textContent) {
            console.log("Got text using PDF.js API:", textContent.substring(0, 50) + "...");
            return textContent;
          }
        }
      }
    } catch (e) {
      console.log("PDF.js method failed:", e);
    }
    
    // Method 2: Look for text layers in the DOM
    try {
      const textLayers = document.querySelectorAll('.textLayer');
      if (textLayers.length > 0) {
        // If text layers exist, try to get highlighted text within them
        for (let layer of textLayers) {
          const highlightedElements = layer.querySelectorAll('.highlight');
          if (highlightedElements.length > 0) {
            const highlightedText = Array.from(highlightedElements)
              .map(el => el.textContent)
              .join(' ');
            if (highlightedText) {
              console.log("Got text from highlights:", highlightedText.substring(0, 50) + "...");
              return highlightedText;
            }
          }
          
          // If no highlighted elements, get visible text from the current text layer
          const visibleText = layer.textContent.trim();
          if (visibleText) {
            console.log("Got text from text layer:", visibleText.substring(0, 50) + "...");
            return visibleText;
          }
        }
      }
    } catch (e) {
      console.log("Text layer method failed:", e);
    }
    
    // Method 3: Last resort - search for any visible text in PDF embeds
    try {
      const pdfEmbed = document.querySelector('embed[type="application/pdf"]');
      if (pdfEmbed && pdfEmbed.contentDocument) {
        const embedText = pdfEmbed.contentDocument.body.textContent.trim();
        if (embedText) {
          console.log("Got text from embed:", embedText.substring(0, 50) + "...");
          return embedText;
        }
      }
    } catch (e) {
      console.log("Embed method failed:", e);
    }
    
    console.log("All PDF text capture methods failed");
  }
  
  // If nothing worked, return empty string
  return "";
}
