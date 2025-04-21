chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'copiedText') {
    chrome.storage.local.set({ copiedText: msg.text }, () => {
      console.log("✅ Text saved from clipboard:", msg.text);
    });
  }
});
