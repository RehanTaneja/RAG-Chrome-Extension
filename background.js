// background.js
console.log("Background script running");

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "captureSelection") {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (!tabs || !tabs.length) {
        sendResponse({error: "No active tab"});
        return;
      }
      
      // Execute script to capture the selection
      chrome.scripting.executeScript({
        target: {tabId: tabs[0].id},
        function: getSelectionFromPage
      }).then(results => {
        if (results && results[0]) {
          const selectedText = results[0].result;
          
          // Store the selection
          chrome.storage.local.set({selectedText: selectedText}, () => {
            console.log("Selection saved:", selectedText ? selectedText.substring(0, 50) + "..." : "none");
            sendResponse({text: selectedText});
          });
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

// This function runs in the context of the page
function getSelectionFromPage() {
  const selection = window.getSelection();
  return selection ? selection.toString().trim() : "";
}
