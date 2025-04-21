chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs[0];
  if (tab.url && tab.url.includes("chrome-extension://mhjfbmdgcfjbbpaeojofohoefgiehjai")) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    });
  }

  // Show stored copied text
  chrome.storage.local.get(['copiedText'], (result) => {
    const display = document.getElementById('captured');
    display.textContent = result.copiedText || 'Nothing copied yet.';
  });
});
