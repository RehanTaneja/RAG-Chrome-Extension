// content.js
console.log("Content script loaded");

// Check if page is a PDF
function isPDF() {
  return document.contentType === 'application/pdf' || 
         window.location.href.toLowerCase().endsWith('.pdf') ||
         document.querySelector('embed[type="application/pdf"]') ||
         document.querySelector('object[type="application/pdf"]');
}

// Inject script into the page to access PDF viewer
function injectPDFScript() {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('pdf-inject.js');
  (document.head || document.documentElement).appendChild(script);
  console.log("PDF script injected");
}

// Listen for messages from the injected script
window.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'FROM_PDF_PAGE') {
    console.log("Received selection from PDF page:", event.data.text.substring(0, 50) + "...");
    
    // Save to storage
    chrome.storage.local.set({selectedText: event.data.text}, function() {
      console.log("Selection saved to storage");
    });
    
    // Also notify the background script
    chrome.runtime.sendMessage({
      action: 'pdfTextSelected',
      text: event.data.text
    });
  }
});

// For non-PDF pages, use standard selection capture
function captureStandardSelection() {
  function saveSelection() {
    const selectedText = window.getSelection().toString().trim();
    if (selectedText) {
      console.log("Standard selection captured:", selectedText.substring(0, 50) + "...");
      chrome.storage.local.set({selectedText: selectedText});
      chrome.runtime.sendMessage({
        action: 'textSelected', 
        text: selectedText
      });
    }
  }
  
  document.addEventListener('mouseup', saveSelection);
  document.addEventListener('keyup', function(e) {
    if (e.key === 'c' && e.ctrlKey) saveSelection();
  });
}

// Setup based on page type
if (isPDF()) {
  console.log("PDF detected - using specialized selection capture");
  injectPDFScript();
} else {
  console.log("Standard page - using normal selection capture");
  captureStandardSelection();
}

// Respond to requests from popup
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.action === 'getSelection') {
    const selectedText = window.getSelection().toString().trim();
    sendResponse({text: selectedText});
  }
  return true;
});
