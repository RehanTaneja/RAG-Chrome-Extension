// popup.js
console.log("[Popup] Script initialized");

const dropdown = document.getElementById('dropdown');
dropdown.value = "";
const output = document.getElementById('output');
const highlightedText = document.getElementById('highlightedText');

// When popup opens, check for stored selection and request fresh selection
document.addEventListener('DOMContentLoaded', function() {
    output.textContent = "Loading selection...";
    
    // First, check if we have a stored selection
    chrome.storage.local.get('selectedText', (data) => {
        console.log("[Popup] Checking stored selection:", data);
        
        if (data && data.selectedText) {
            displaySelection(data.selectedText);
        } else {
            output.textContent = "No stored selection found. Please select text.";
        }
        
        // Also request the current selection from the content script
        requestFreshSelection();
    });
});

// When dropdown value changes, process the selection
dropdown.addEventListener("change", function() {
    const selectedOption = dropdown.value;
    if (!selectedOption) {
        output.textContent = "Please select an option.";
        return;
    }
    
    chrome.storage.local.get('selectedText', (data) => {
        const selectedText = data.selectedText;
        
        if (!selectedText) {
            output.textContent = "No text selected. Please select text first.";
            return;
        }
        
        processSelection(selectedText, selectedOption);
    });
});

// Function to request fresh selection from content script
function requestFreshSelection() {
    console.log("[Popup] Requesting fresh selection from content script");
    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || !tabs.length) return;
        
        try {
            chrome.tabs.sendMessage(tabs[0].id, { action: "getSelection" }, (response) => {
                if (chrome.runtime.lastError) {
                    console.log("[Popup] Error getting selection:", chrome.runtime.lastError.message);
                    return;
                }
                
                if (response && response.text) {
                    console.log("[Popup] Fresh selection received");
                    displaySelection(response.text);
                    chrome.storage.local.set({ selectedText: response.text });
                }
            });
        } catch (error) {
            console.error("[Popup] Error sending message:", error);
        }
    });
}

// Display the selection in the UI
function displaySelection(text) {
    if (!text) return;
    
    const preview = text.length > 50 ? text.substring(0, 50) + "..." : text;
    highlightedText.textContent = `Selected text: ${preview}`;
    output.textContent = "Selection loaded. Choose an option from the dropdown.";
}

// Process the selection based on the dropdown option
function processSelection(text, option) {
    if (option === 'summaryOption') {
        sendTextToFlask(text);
    } else if (option === 'synopsisOption') {
        output.textContent = "Synopsis generation coming soon...";
    } else if (option === 'linkOption') {
        output.textContent = "Linking option coming soon...";
    }
}

// Send text to Flask backend
function sendTextToFlask(highlightedTextContent) {
    output.textContent = "Processing...";
    
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (!tabs || !tabs.length) {
            output.textContent = "No active tab found.";
            return;
        }
        
        const pdfUrl = tabs[0].url;
        const backendUrl = localStorage.getItem('backendUrl') || 'http://127.0.0.1:5000/receive-text';
        
        console.log("[Popup] Sending data to backend:", highlightedTextContent.substring(0, 30) + "...");
        
        fetch(backendUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            mode: 'cors',
            body: JSON.stringify({
                highlightedTextContent: highlightedTextContent,
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
            console.error("[Popup] Fetch error:", error.message);
            output.textContent = "Error: " + error.message;
        });
    });
}

// Add "Refresh Selection" button functionality
document.getElementById('refreshButton')?.addEventListener('click', function() {
    requestFreshSelection();
});
