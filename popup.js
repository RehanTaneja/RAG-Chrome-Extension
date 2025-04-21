function updateDisplay() {
  chrome.storage.local.get('copiedText', (data) => {
    const text = data.copiedText || 'No text copied yet.';
    document.getElementById('copiedText').textContent = text;
  });
}

// Refresh on button click
document.getElementById('refresh').addEventListener('click', updateDisplay);

// Load when popup opens
document.addEventListener('DOMContentLoaded', updateDisplay);
