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

// read from chrome.storage the last copied text & PDF URL
async function loadState() {
    // 1) get the last copied text
  const { copiedText = '' } = await chrome.storage.local.get(['copiedText']);
  document.getElementById('copiedText').textContent = copiedText || 'No text copied yet.';
  
    // 2) get current tab URL
  let pdfUrl = '';
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.url) {
    try {
      const u = new URL(tab.url);
      // if it's the Chrome PDF viewer, extract the real file parameter
      const fileParam = u.searchParams.get('file');
      pdfUrl = fileParam ? decodeURIComponent(fileParam) : tab.url;
    } catch {
      pdfUrl = tab.url;
    }
  }
  
  return { text: copiedText, url: pdfUrl };
}

function showChatInput(show) {
  document.getElementById('chatInput').style.display = show ? 'block' : 'none';
}

document.addEventListener('DOMContentLoaded', async () => {
  let state = await loadState();
  updateDisplay();
  document.getElementById('refresh').addEventListener('click', updateDisplay);

  const actionSel = document.getElementById('action');
  actionSel.addEventListener('change', () => {
    showChatInput(actionSel.value === 'chat');
  });

  document.getElementById('process').addEventListener('click', async () => {
    const act = actionSel.value;
    let payload = { pdfUrl: state.url };

    if (act === 'chat') {
      payload.question = document.getElementById('chatInput').value.trim();
      if (!payload.question) return alert('Please ask a question.');
    } else {
      // grab exactly what’s showing in the “Last Copied Text” div
      const copied = document.getElementById('copiedText').textContent.trim();
      if (!copied || copied === 'No text copied yet.') return alert('Nothing copied yet.');
      payload.text = copied;
    }

    const endpoint = act === 'synopsis'
      ? '/synopsis'
      : act === 'define'
        ? '/define'
        : '/chat';

    document.getElementById('result').textContent = '⏳ Loading…';
    try {
      const res = await fetch(`https://rag-service-868962904696.us-central1.run.app${endpoint}`, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      });
      // grab raw text so we don’t choke on empty or non-JSON responses
      const text = await res.text();
      if (!res.ok) {
        // server returned an HTTP error code
        document.getElementById('result').textContent =
        `Server Error (${res.status}): ${text}`;
        return;
      }
      let json;
      try {
        json = JSON.parse(text);
      } catch (e) {
        // response wasn’t valid JSON
        document.getElementById('result').textContent =
          `Invalid JSON response: ${text}`;
        return;
      }
      document.getElementById('result').textContent = json.result;
    } catch(err) {
      document.getElementById('result').textContent = '⚠️ '+ err;
    }
  });
});

