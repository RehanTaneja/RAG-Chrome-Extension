document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("extract-btn").addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "captureSelection" }, (response) => {
      const output = document.getElementById("output");
      if (response.error) {
        output.textContent = "❌ Error: " + response.error;
      } else {
        output.textContent = "✅ Selected Text:\n" + response.text;
      }
    });
  });
});
