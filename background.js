// background.js
console.log("Background script started");

// Store selection when received from content script
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.action === 'pdfTextSelected' || message.action === 'textSelected') {
    console.log("Background received selection, storing it");
    chrome.storage.local.set({selectedText: message.text}, function() {
      console.log("Background stored selection");
    });
  }
});
