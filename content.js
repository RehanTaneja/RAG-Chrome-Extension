// content.js
console.log("[Content Script] Loaded and running");

// Create a more robust selection capture function
function captureSelection() {
    try {
        const selectedText = window.getSelection().toString().trim();
        
        if (selectedText && selectedText.length > 0) {
            console.log("[Content Script] Text selected:", selectedText.substring(0, 30) + "...");
            
            // Store the selection in chrome.storage
            chrome.storage.local.set({ selectedText: selectedText }, () => {
                console.log("[Content Script] Text stored in chrome.storage");
            });
            
            // Also send a message to the extension to be extra safe
            chrome.runtime.sendMessage({
                action: "textSelected",
                text: selectedText
            }, (response) => {
                console.log("[Content Script] Message sent to extension");
            });
        }
    } catch (error) {
        console.error("[Content Script] Error capturing selection:", error);
    }
}

// Use multiple events to ensure we capture the selection
document.addEventListener("mouseup", captureSelection);
document.addEventListener("keyup", captureSelection);
document.addEventListener("selectionchange", function() {
    // Delay to ensure selection is complete
    setTimeout(captureSelection, 200);
});

// Initial capture in case text is already selected
captureSelection();

// Add a message listener for the popup requesting selection
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getSelection") {
        const selectedText = window.getSelection().toString().trim();
        console.log("[Content Script] Selection requested by popup:", selectedText ? "Text found" : "No text");
        sendResponse({ text: selectedText });
    }
    return true; // Indicates async response
});
