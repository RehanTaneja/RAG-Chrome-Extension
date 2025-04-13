// DOM elements
const dropdown = document.getElementById('dropdown');
const output = document.getElementById('highlightedText');

// Listen for dropdown selection change
dropdown.addEventListener("change", function () {
    const selectedOption = dropdown.value;

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (!tabs[0]) {
            output.textContent = "No active tab found.";
            return;
        }

        // Send message to content script to get highlighted text
        chrome.tabs.sendMessage(tabs[0].id, { action: "getSelectedText" }, function (response) {
            const highlightedText = response.text;

            if (!highlightedText) {
                output.textContent = "No text selected on the page.";
                return;
            }

            // Perform actions based on dropdown selection
            switch (selectedOption) {
                case 'summaryOption':
                    sendTextToFlask(highlightedText); // Send text to Flask backend
                    break;
                case 'synopsisOption':
                    output.textContent = "Synopsis generation coming soon...";
                    break;
                case 'linkOption':
                    output.textContent = "Linking option coming soon...";
                    break;
                default:
                    output.textContent = "Please select an option.";
            }
        });
    });
});

// Send highlighted text to Flask backend
function sendTextToFlask(highlightedTextContent) {
    fetch('http://127.0.0.1:5000/receive-text', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            highlightedTextContent: highlightedTextContent
        }),
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                displayText.textContent = `Error: ${data.error}`;
                return;
            }

            const sections = data.sections;
            let formatted = '';
            for (let section in sections) {
                formatted += `<h4>${section}</h4><p>${sections[section]}</p>`;
            }
            output.innerHTML = formatted; // Display backend response
        })
        .catch(error => {
            console.error("Error:", error);
            displayText.textContent = "Error sending text to backend.";
        });
}