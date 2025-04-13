chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Listen for the "getSelectedText" action from the popup script
    if (request.action === "getSelectedText") {
        const selectedText = window.getSelection().toString(); // Get the highlighted text
        console.log("Content script received the request. Highlighted Text:", selectedText); // Debugging log
        sendResponse({ text: selectedText }); // Send the text back to the popup script
    }
});