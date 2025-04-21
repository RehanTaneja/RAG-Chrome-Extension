chrome.storage.local.get(['copiedText'], (result) => {
  const display = document.getElementById('captured');
  display.textContent = result.copiedText || 'Nothing copied yet.';
});
