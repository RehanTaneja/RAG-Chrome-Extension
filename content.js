document.addEventListener('copy', async () => {
  try {
    const text = await navigator.clipboard.readText();
    chrome.runtime.sendMessage({ action: 'copiedText', text });
  } catch (e) {
    console.warn("Clipboard read failed:", e);
  }
});
