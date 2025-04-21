// popup.js
console.log("Popup opened");

const actionDropdown = document.getElementById('actionDropdown');
const selectionContainer = document.getElementById('selectionContainer');
const output = document.getElementById('output');
const captureButton = document.getElementById('captureButton');

// When popup opens, load any stored selection
document.addEventListener('DOMContentLoaded', function() {
  loadStoredSelection();
});

// Load any previously stored selection
function loadStoredSelection() {
  chrome.storage.local.get('selectedText', function(data) {
    console.log("Checking stored selection:", data);
    if (data.selectedText) {
      displaySelection(data.selectedText);
    }
  });
}

// Capture button click handler
captureButton.addEventListener('click', function() {
  selectionContainer.textContent = "Capturing selection...";
  
  chrome.runtime.sendMessage({action: "captureSelection"}, function(response) {
    console.log("Capture response:", response);
    
    if (response.error) {
      selectionContainer.textContent = "Error: " + response.error;
    } else if (response.text) {
      displaySelection(response.text);
    } else {
      selectionContainer.textContent = "No text selected. Please make sure to:\n\n" +
                                     "1. Open a PDF document\n" +
                                     "2. Select text with your mouse\n" +
                                     "3. Try clicking this button again";
    }
  });
});

// Display the selection in the UI
function displaySelection(text) {
  if (!text) {
    selectionContainer.textContent = "No text selected";
    return;
  }
  
  selectionContainer.textContent = text;
}

// Process dropdown selection
actionDropdown.addEventListener('change', function() {
  const selectedOption = actionDropdown.value;
  if (!selectedOption) {
    output.textContent = "Please select an action";
    return;
  }
  
  chrome.storage.local.get('selectedText', function(data) {
    const selectedText = data.selectedText;
    
    if (!selectedText) {
      output.textContent = "No text selected. Please capture text first.";
      return;
    }
    
    if (selectedOption === 'summaryOption') {
      sendTextToFlask(selectedText);
    } else if (selectedOption === 'synopsisOption') {
      output.textContent = "Synopsis generation coming soon...";
    } else if (selectedOption === 'linkOption') {
      output.textContent = "Link finding coming soon...";
    }
  });
});

// Send text to Flask backend
function sendTextToFlask(text) {
  output.textContent = "Processing...";
  
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (!tabs || !tabs.length) {
      output.textContent = "No active tab found";
      return;
    }
    
    const pdfUrl = tabs[0].url;
    const backendUrl = 'http://127.0.0.1:5000/receive-text';
    
    fetch(backendUrl, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      mode: 'cors',
      body: JSON.stringify({
        highlightedTextContent: text,
        url: pdfUrl
      })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (data.error) {
        output.textContent = `Error: ${data.error}`;
      } else {
        output.innerHTML = JSON.stringify(data, null, 2);
      }
    })
    .catch(error => {
      console.error("Fetch error:", error);
      output.textContent = "Error: " + error.message;
    });
  });
}
