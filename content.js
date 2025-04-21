// content.js
alert("Content script is loaded!");

// Function to store the selected text
function storeSelectedText() {
    const selectedText = window.getSelection().toString().trim();
    console.log("Selection changed. Current selection:", selectedText);
    
    if (selectedText) {
      chrome.storage.local.set({ selectedText: selectedText }, () => {
        if (chrome.runtime.lastError) {
          console.error("Error storing selected text:", chrome.runtime.lastError.message);
        } else {
          console.log("Selected text stored:", selectedText);
        }
      });
    } else {
      console.log("No text selected.");
    }
  }
  
// Listen for selection changes (fires when selection changes)
document.addEventListener("selectionchange", storeSelectedText);

// Also listen for mouseup events (in case selectionchange isn’t firing as expected)
document.addEventListener("mouseup", storeSelectedText);
