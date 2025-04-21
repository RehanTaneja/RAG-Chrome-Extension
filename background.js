// background.js
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'storeSelection') {
    chrome.storage.local.set({ selectedText: msg.text });
    return;
  }
  if (msg.action === 'captureSelection') {
    chrome.storage.local.get('selectedText', data => {
      sendResponse({ text: data.selectedText || '' });
    });
    return true;
  }
});

