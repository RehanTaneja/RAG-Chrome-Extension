chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'copiedText' && msg.text) {
    // Save the latest copied text
    chrome.storage.local.set({ copiedText: msg.text });
  }
});
