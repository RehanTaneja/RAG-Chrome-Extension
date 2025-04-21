chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "captureSelection") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError || !tabs || tabs.length === 0) {
        sendResponse({ error: chrome.runtime.lastError?.message || "No active tab found" });
        return;
      }

      const tab = tabs[0];
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const selection = window.getSelection();
          return selection ? selection.toString().trim() : "";
        }
      })
      .then(([result]) => {
        const text = result.result || "";
        chrome.storage.local.set({ selectedText: text }, () => {
          console.log("Saved selected text:", text);
          sendResponse({ text });
        });
      })
      .catch((err) => {
        console.error("Script execution failed:", err);
        sendResponse({ error: err.message });
      });
    });

    return true; // Required for async response
  }
});
