// background.js

// 1) save any copiedText messages
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'copiedText' && msg.text) {
    console.log('[BG] got text:', msg.text);
    chrome.storage.local.set({ copiedText: msg.text });
  }
});


// 2) detect chrome-extension://…/pdf_viewer.html pages and inject
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  const PDF_VIEWER = 'chrome-extension://mhjfbmdgcfjbbpaeojofohoefgiehjai/';
  if (changeInfo.status === 'complete' && tab.url.startsWith(PDF_VIEWER)) {
    chrome.scripting.executeScript({
      target: { tabId, allFrames: true },
      files: ['content.js'],
+     world: 'MAIN'
    });
  }
});
