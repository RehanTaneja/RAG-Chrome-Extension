// popup.js
console.log("Popup opened");

const dropdown = document.getElementById('dropdown');
const selectionContainer = document.getElementById('selectionContainer');
const output = document.getElementById('output');
const refreshButton = document.getElementById('refreshButton');

// When popup opens, check for stored text selection
document.addEventListener('DOMContentLoaded', function() {
  console.log("Popup DOM loaded, checking for selections");
  checkForStoredSelection();
  requestFreshSelection();
  
  // Listen for selection updates from content script
  chrome.runtime.onMessage.addListener(function(message) {
    if (message.action === "selectionUpdated") {
      console.log("Popup received selection update");
      displaySelection(message.text);
    }
  });
});

// Check for stored selection
function checkForStoredSelection() {
  chrome.storage.local.get('selectedText', function(data) {
    console.log("Checking storage for selection:", data);
    if (data.selectedText) {
      displaySelection(data.selectedText);
    }
  });
}

// Request fresh selection from content script
function requestFreshSelection() {
  selectionContainer.textContent = "Refreshing...";
  
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (!tabs || !tabs.length) return;
    
    chrome.tabs.sendMessage(tabs[0].id, {action: "getSelection"}, function(response) {
      if (chrome.runtime.lastError) {
        console.log("Error requesting selection:", chrome.runtime.lastError.message);
        selectionContainer.textContent = "Could not connect to page. Make sure you're viewing a PDF.";
        return;
      }
      
      if (response && response.text) {
        console.log("Received fresh selection from content script");
        displaySelection(response.text);
      } else {
        console.log("No selection received from content script");
        // Keep previous selection if we have it, otherwise show no selection
        chrome.storage.local.get('selectedText', function(data) {
          if (!data.selectedText) {
            selectionContainer.textContent = "No text selected. Please select text in your PDF.";
          }
        });
      }
    });
  });
}

// Display selection in the UI
function displaySelection(text) {
  if (!text) {
    selectionContainer.textContent = "No text selected. Please select text in your PDF.";
    return;
  }
  
  // Display the selection
  selectionContainer.textContent = text;
}

// Process dropdown selection
dropdown.addEventListener('change', function() {
  const selectedOption = dropdown.value;
  if (!selectedOption) {
    output.textContent = "Please select an option.";
    return;
  }
  
  chrome.storage.local.get('selectedText', function(data) {
    const selectedText = data.selectedText;
    
    if (!selectedText) {
      output.textContent = "No text selected. Please select text in your document first.";
      return;
    }
    
    // Process based on selected option
    if (selectedOption === 'summaryOption') {
      sendTextToFlask(selectedText);
    } else if (selectedOption === 'synopsisOption') {
      output.textContent = "Synopsis generation coming soon...";
    } else if (selectedOption === 'linkOption') {
      output.textContent = "Link finding coming soon...";
    }
  });
});

// Refresh button handler
refreshButton.addEventListener('click', function() {
  requestFreshSelection();
});

// Send text to Flask backend
function sendTextToFlask(text) {
  output.textContent = "Processing...";
  
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (!tabs || !tabs.length) {
      output.textContent = "No active tab found.";
      return;
    }
    
    const pdfUrl = tabs[0].url;
    const backendUrl = 'http://127.0.0.1:5000/receive-text';
    
    console.log("Sending to Flask:", text.substring(0, 50) + "...");
    
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
