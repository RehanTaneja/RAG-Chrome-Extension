// background.js
console.log("Background script running");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "captureSelection") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
+      if (chrome.runtime.lastError || !tabs || tabs.length === 0) {
+        sendResponse({ error: chrome.runtime.lastError?.message || "No active tab found" });
+        return;
+      }
+
+      const tab = tabs[0];
+      const isPDF = tab.url.toLowerCase().endsWith('.pdf');
+
+      chrome.scripting.executeScript({
+        target: { tabId: tab.id },
+        func: getSelectionFromPage,
+        args: [isPDF]
+      })
+      .then(([injection]) => {
+        const text = injection.result || "";
+        chrome.storage.local.set({ selectedText: text }, () => {
+          console.log("Selection saved:", text.substring(0, 50) + "…");
+          sendResponse({ text });
+        });
+      })
+      .catch(err => {
+        console.error("Script execution error:", err);
+        sendResponse({ error: err.message });
+      });
+    });
    
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
// background.js (partial update)
function getSelectionFromPage(isPDF) {
  let retries = 0;
  const maxRetries = 3;

  function tryGetSelection() {
    const selection = window.getSelection();
    let text = selection ? selection.toString().trim() : '';
    
    if (text) return text;
    
    if (isPDF && retries < maxRetries) {
      retries++;
      console.log(`No selection found, retrying (${retries}/${maxRetries})`);
      return new Promise(resolve => 
        setTimeout(() => resolve(tryGetSelection()), 300)
      );
    }
    
    return text;
  }

  return tryGetSelection();
}
