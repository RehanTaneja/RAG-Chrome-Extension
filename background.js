// background.js
console.log("Background script running");

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // 1) Store any PDF‐injection text into storage
  if (msg.action === 'storeSelection') {
    chrome.storage.local.set({ selectedText: msg.text }, () => {
      console.log(
        '📥 PDF text stored:',
        msg.text.substring(0, 50) + '…'
      );
    });
    // no sendResponse needed here
    return;
  }

  // 2) Reply to popup when it asks for captureSelection
  if (msg.action === 'captureSelection') {
    chrome.storage.local.get('selectedText', (data) => {
      sendResponse({ text: data.selectedText || '' });
    });
    return true;  // keep channel open for async sendResponse
  }
});
