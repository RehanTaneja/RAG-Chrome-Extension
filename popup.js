async function updateDisplay() {
  try {
    const text = await navigator.clipboard.readText();
    document.getElementById('copiedText').textContent =
      text.trim() || 'No text on your clipboard.';
  } catch (err) {
    console.error('Clipboard read failed:', err);
    document.getElementById('copiedText').textContent =
      '⚠️ Unable to read clipboard.';
  }
}

document
  .getElementById('refresh')
  .addEventListener('click', updateDisplay);

document.addEventListener('DOMContentLoaded', updateDisplay);
