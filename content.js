// content.js
console.log("Content script is loaded!");

// Function to store the selected text
function storeSelectedText() {
    const selectedText = window.getSelection().toString().trim();
    
    if (selectedText) {
        console.log("Selection detected:", selectedText.substring(0, 50) + (selectedText.length > 50 ? "..." : ""));
        
        chrome.storage.local.set({ selectedText: selectedText }, () => {
            if (chrome.runtime.lastError) {
                console.error("Error storing selected text:", chrome.runtime.lastError.message);
            } else {
                console.log("Selected text stored successfully");
            }
        });
    }
}

// Listen for selection changes
document.addEventListener("selectionchange", function() {
    // Small delay to ensure selection is complete
    setTimeout(storeSelectedText, 100);
});

// Also listen for mouseup events
document.addEventListener("mouseup", storeSelectedText);

// Store any existing selection when the script loads
storeSelectedText();
