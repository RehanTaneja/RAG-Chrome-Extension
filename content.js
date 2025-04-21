// content.js
console.log("Content script loaded");

// Check if the current page is a PDF
function isPDF() {
  return document.contentType === 'application/pdf' ||
         window.location.href.toLowerCase().endsWith('.pdf') ||
         document.querySelector('embed[type="application/pdf"]') ||
         document.querySelector('object[type="application/pdf"]');
}

// Inject the PDF script directly into the page context
function injectPDFScript() {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('pdf-script.js');
  (document.head || document.documentElement).appendChild(script);
  console.log("PDF script injected");
}

// Listen for messages from the injected script
window.addEventListener('message', function(event) {
  // Only accept messages from the same frame
  if (event.source !== window) return;
  
  // Check if this is our message with selected text
  if (event.data && event.data.source === 'PDF_TEXT_SELECTION') {
    console.log("Content script received PDF selection:", 
                event.data.text.substring(0, 50) + (event.data.text.length > 50 ? "..." : ""));
    
    // Store the selection
    chrome.storage.local.set({selectedText: event.data.text}, function() {
      console.log("Selection saved to storage");
      
      // Let the popup know if it's open
      chrome.runtime.sendMessage({
        action: "selectionUpdated",
        text: event.data.text
      });
    });
  }
});

// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  console.log("Content script received message:", message);
  
  if (message.action === "getSelection") {
    // First, try to get it from the DOM
    const currentSelection = window.getSelection().toString().trim();
    
    if (currentSelection) {
      console.log("Sending current DOM selection to popup");
      sendResponse({text: currentSelection});
      
      // Also store it
      chrome.storage.local.set({selectedText: currentSelection});
    } else {
      // If no current selection, check storage as fallback
      chrome.storage.local.get('selectedText', function(data) {
        if (data.selectedText) {
          console.log("Sending stored selection to popup");
          sendResponse({text: data.selectedText});
        } else {
          console.log("No selection available");
          sendResponse({text: ""});
        }
      });
    }
    return true; // Required for async response
  }
});

// Function to capture standard text selection (for non-PDF pages)
function setupStandardSelectionCapture() {
  document.addEventListener('mouseup', function() {
    setTimeout(function() {
      const selection = window.getSelection().toString().trim();
      if (selection) {
        console.log("Standard selection captured");
        chrome.storage.local.set({selectedText: selection});
        
        // Let the popup know if it's open
        chrome.runtime.sendMessage({
          action: "selectionUpdated",
          text: selection
        });
      }
    }, 100);
  });
}

// Initialize based on page type
if (isPDF()) {
  console.log("PDF detected, using specialized selection capture");
  injectPDFScript();
} else {
  console.log("Standard page, using normal selection capture");
  setupStandardSelectionCapture();
}

// Send a ready message
chrome.runtime.sendMessage({action: "contentScriptReady"});
// content.js (partial update)
window.addEventListener('message', function(event) {
  if (event.source !== window) return;
  
  if (event.data && event.data.source === 'PDF_TEXT_SELECTION') {
    console.log("Received PDF selection:", event.data.text);
    
    // Store and forward the selection
    chrome.storage.local.set({selectedText: event.data.text}, () => {
      chrome.runtime.sendMessage({
        action: "selectionUpdated",
        text: event.data.text
      });
    });
  }
});
