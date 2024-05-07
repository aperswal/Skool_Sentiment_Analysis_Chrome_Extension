document.getElementById('analyzeButton').addEventListener('click', () => {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (!tabs.length) {
            console.error("No active tab found.");
            return;
        }
        const tabId = tabs[0].id;

        // First, attempt to send a simple test message to check if the content script is active
        chrome.tabs.sendMessage(tabId, { action: "test" }, response => {
            if (chrome.runtime.lastError) {
                // Content script not found or not loaded, try injecting the script
                chrome.scripting.executeScript({
                    target: {tabId: tabId},
                    files: ["content.js"]
                }, () => {
                    // After successful injection, send the actual message
                    if (chrome.runtime.lastError) {
                        console.error("Script injection failed:", chrome.runtime.lastError.message);
                        return;
                    }
                    sendMessage(tabId);
                });
            } else {
                // If no error, it means the content script is already active and listening
                sendMessage(tabId);
            }
        });
    });
});

function sendMessage(tabId) {
    chrome.tabs.sendMessage(tabId, { action: "generateLeaderboard" }, (response) => {
        if (chrome.runtime.lastError) {
            console.error("Error sending message to content script:", chrome.runtime.lastError.message);
            return;
        }
        if (response && response.data) {
            displayLeaderboard(response.data.phrases, response.data.sentiment);
        }
    });
}

function displayLeaderboard(phrases, sentiment) {
    const output = document.getElementById('output');
    output.innerHTML = `<h2>Sentiment: ${sentiment}</h2>`; // Display sentiment description

    const list = document.createElement('ul');
    phrases.forEach(item => {
        const li = document.createElement('li');
        li.textContent = `${item.phrase}: ${item.count}`;
        list.appendChild(li);
    });
    output.appendChild(list);
}
