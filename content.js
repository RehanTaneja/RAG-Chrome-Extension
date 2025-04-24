console.log('[CS] loaded into', window.location.href);

document.addEventListener('copy', () => {
  const text = window.getSelection().toString().trim();
  console.log('[CS] copy event →', text);
  if (text) {
    chrome.runtime.sendMessage({ action: 'copiedText', text });
  }
});
