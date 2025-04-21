const dropdown = document.getElementById('dropdown');
dropdown.value = "";
const output = document.getElementById('output');
const highlightedText = document.getElementById('highlightedText');

// When the popup opens, immediately try to retrieve stored selection
document.addEventListener('DOMContentLoaded', function() {
    getSelectedText((selectedText) => {
        if (selectedText) {
            highlightedText.textContent = `Selected text: ${selectedText.substring(0, 50)}${selectedText.length > 50 ? '...' : ''}`;
        } else {
            highlightedText.textContent = "No text selected. Please select text in the document.";
        }
    });
});

// When the dropdown value changes, process the selected text
dropdown.addEventListener("change", function() {
    const selectedOption = dropdown.value;
    if (!selectedOption) {
        output.textContent = "Please select an option.";
        return;
    }

    getSelectedText((selectedText) => {
        if (!selectedText) {
            output.textContent = "No text selected. Please select text in the document.";
            return;
        }
        
        if (selectedOption === 'summaryOption') {
            sendTextToFlask(selectedText);
        } else if (selectedOption === 'synopsisOption') {
            output.textContent = "Synopsis generation coming soon...";
        } else if (selectedOption === 'linkOption') {
            output.textContent = "Linking option coming soon...";
        }
    });
});

/**
 * Retrieves the selected text from chrome.storage.
 */
function getSelectedText(callback) {
    console.log("Retrieving selected text from storage...");
    
    chrome.storage.local.get('selectedText', (data) => {
        console.log("Retrieved data:", data);
        
        if (data && data.selectedText) {
            callback(data.selectedText);
        } else {
            callback(null);
        }
    });
}

/**
 * Sends the highlighted text along with the active tab's URL to the Flask backend.
 */
function sendTextToFlask(highlightedTextContent) {
    const output = document.getElementById("output");
    output.textContent = "Processing...";

    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (!tabs || !tabs.length) {
            output.textContent = "No active tab found.";
            return;
        }
        
        const pdfUrl = tabs[0].url;
        const backendUrl = localStorage.getItem('backendUrl') || 'http://127.0.0.1:5000/receive-text';

        console.log("Sending data to backend:", highlightedTextContent, pdfUrl);

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
            console.log('Response status:', response.status, response.statusText);
            if (!response.ok) {
                throw new Error(`Server error: ${response.status} ${response.statusText}`);
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
            console.error("Fetch error:", error.message);
            output.textContent = "Error sending text to backend: " + error.message;
        });
    });
}
