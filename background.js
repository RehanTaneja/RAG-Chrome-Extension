// background.js
console.log("[Background] Service worker started");

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "textSelected") {
        // Store the selected text in chrome.storage
        chrome.storage.local.set({ selectedText: message.text }, () => {
            console.log("[Background] Text stored from content script");
            sendResponse({ success: true });
        });
    }
    return true; // Keep the message channel open for async response
});
