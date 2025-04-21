// content.js
// 1. inject our PDF‐injection helper into the page itself
const s = document.createElement('script');
s.src = chrome.runtime.getURL('pdf-inject.js');
s.onload = () => s.remove();
(document.head || document.documentElement).appendChild(s);

// 2. listen for postMessage from pdf-inject.js
window.addEventListener('message', (e) => {
  if (e.source === window && e.data?.source === 'PDF_TEXT_SELECTION') {
    chrome.runtime.sendMessage({
      action: 'storeSelection',
      text: e.data.text
    });
  }
});
