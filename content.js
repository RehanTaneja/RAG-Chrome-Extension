// Run in every page—including PDF viewer
document.addEventListener('copy', (event) => {
  const selectedText = window.getSelection().toString().trim();
  if (selectedText) {
    chrome.runtime.sendMessage({
      action: 'copiedText',
      text: selectedText
    });
  }
});
