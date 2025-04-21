const dropdown = document.getElementById('dropdown');
dropdown.value = ""
const output = document.getElementById('output');
const highlightedText = document.getElementById('highlightedText');

// When the dropdown value changes, retrieve the last stored selected text.
dropdown.addEventListener("change", function () {
    const selectedOption = dropdown.value;
    if (!selectedOption) {
    output.textContent = "Please select an option.";
    return;
    }
    getSelectedText((selectedText) => {
    // if (!selectedText) {
    //     output.textContent = "No text is selected on the page.";
    //     return;
    // }

        // For this example, act on the "summaryOption" directly.
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
 * Retrieves the last selected text from chrome.storage.
 */
function getSelectedText(callback) {
    console.log("Attempting to retrieve selected text...");
    
    chrome.storage.local.get('selectedText', (data) => {
      console.log("Retrieved data object:", data);
      console.log("Retrieved selected text:", data.selectedText);
      
      if (data && data.selectedText) {
        callback(data.selectedText);
      } else {
        callback(null);
      }
    });
  }

/**
 * Sends the highlighted text along with the active tab's URL (as pdfUrl)
 * to the Flask backend.
 */
function sendTextToFlask(highlightedTextContent) {
    const output = document.getElementById("output");

    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (!tabs || !tabs.length) {
        output.textContent = "No active tab found.";
        return;
        }
        const pdfUrl = tabs[0].url;  // Use the active tab's URL.
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

function captureSelectedText() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: () => {
                const selection = window.getSelection().toString().trim();
                if (selection) {
                    chrome.storage.local.set({ selectedText: selection });
                    console.log("Injected script stored selection:", selection);
                } else {
                    console.log("No text selected.");
                }
            }
        });
    });
}


