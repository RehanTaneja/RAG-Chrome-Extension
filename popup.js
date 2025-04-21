// popup.js
console.log("Popup opened");

const actionDropdown = document.getElementById('actionDropdown');
const selectedTextPreview = document.getElementById('selectedTextPreview');
const output = document.getElementById('output');
const refreshButton = document.getElementById('refreshSelection');

// When popup opens, load any stored selection
document.addEventListener('DOMContentLoaded', function() {
  loadStoredSelection();
  requestCurrentSelection();
});

// Function to load stored selection from storage
function loadStoredSelection() {
  chrome.storage.local.get('selectedText', function(data) {
    console.log("Popup checked storage for selection:", data);
    if (data.selectedText) {
      displaySelection(data.selectedText);
    }
  });
}

// Function to request fresh selection from content script
function requestCurrentSelection() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (!tabs || !tabs.length) return;
    
    try {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'getSelection'}, function(response) {
        if (chrome.runtime.lastError) {
          console.log("Error requesting selection:", chrome.runtime.lastError.message);
          return;
        }
        
        if (response && response.text) {
          console.log("Received fresh selection");
          displaySelection(response.text);
          chrome.storage.local.set({selectedText: response.text});
        }
      });
    } catch (e) {
      console.error("Error sending message:", e);
    }
  });
}

// Display selection in the UI
function displaySelection(text) {
  if (!text) return;
  
  const preview = text.length > 300 
    ? text.substring(0, 300) + "..." 
    : text;
    
  selectedTextPreview.textContent = preview;
  selectedTextPreview.style.color = "#000";
}

// When dropdown value changes
actionDropdown.addEventListener('change', function() {
  const selectedAction = actionDropdown.value;
  if (!selectedAction) {
    output.textContent = "Please select an action.";
    return;
  }
  
  chrome.storage.local.get('selectedText', function(data) {
    const text = data.selectedText;
    
    if (!text) {
      output.textContent = "No text selected. Please select text in your document first.";
      return;
    }
    
    if (selectedAction === 'summaryOption') {
      sendToFlask(text);
    } else if (selectedAction === 'synopsisOption') {
      output.textContent = "Synopsis generation coming soon...";
    } else if (selectedAction === 'linkOption') {
      output.textContent = "Link finding coming soon...";
    }
  });
});

// Handle refresh button click
refreshButton.addEventListener('click', function() {
  selectedTextPreview.textContent = "Refreshing selection...";
  requestCurrentSelection();
});

// Send text to Flask backend
function sendToFlask(text) {
  output.textContent = "Processing...";
  
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (!tabs || !tabs.length) {
      output.textContent = "No active tab found.";
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
