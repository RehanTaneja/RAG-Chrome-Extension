// Listen for copy‐text messages
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.action === 'copiedText' && msg.text) {
    chrome.storage.local.set({ copiedText: msg.text });
  }
});

// Inject content.js into the built‑in PDF viewer frames
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  const PDF_VIEWER_EXT = 'chrome-extension://mhjfbmdgcfjbbpaeojofohoefgiehjai/';
  if (
    changeInfo.status === 'complete' &&
    tab.url.startsWith(PDF_VIEWER_EXT)
  ) {
    chrome.scripting.executeScript({
      target: { tabId, allFrames: true },
      files: ['content.js']
    });
  }
});
