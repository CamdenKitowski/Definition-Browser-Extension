console.log('starting up popup.js');

function uploadtoDatabase(word, definition, pronunciation, pos) {
    console.log('Button was clicked');
    fetch('http://127.0.0.1:5000/add_definition', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            word: word,
            definition: definition,
            pronunciation: pronunciation,
            pos: pos
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        console.log(response, ' the response');
        return response.json();
    })
    .then(data => {
        console.log('success', data);
    })
    .catch(error => {
        console.error('Error uploading to Flask API:', error);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    initializeScrapeButton();
});

function initializeScrapeButton() {
    const scrapeButton = document.getElementById('addDefinitionButton');
    scrapeButton.addEventListener('click', handleScrapeButtonClick);
}

function handleScrapeButtonClick() {
    chrome.tabs.query({active: true, currentWindow:true}, tabs => {
        sendMessageToTab(tabs[0].id);
    });
}

function sendMessageToTab(tabId) {
    chrome.tabs.sendMessage(tabId, {data: "Trigger Listener" }, handleMessageResponse)
}

async function checkDup(word) {
    try {
        const response = await fetch(`http://127.0.0.1:5000/check_duplicate?word=${encodeURIComponent(word)}`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        console.log(data, ' this is hte data');
        console.log(data.exists, ' return statement')
        return data.exists;
    } catch (error) {
        console.error('Error checking for duplicate:', error);
        return false;
    }
}

async function handleMessageResponse(response) {
    

    console.log('Scraped data:', response);
    const word = response.word;
    const definition = response.definition;
    const pronunciation = response.pronunciation;
    const pos = response.pos;

    const isDup = await checkDup(word);

    // Check if the word already exists in the database
    if (isDup) {
        console.log('ERROR: Duplicate word detected');
        errorMsg = document.createElement('h4');
        // errorMsg.id = 'error-message';
        errorMsg.style.color = "red";
        errorMsg.innerHTML = `Error: '${word}' already exists in the database.`;
        document.getElementById("main").appendChild(errorMsg);
        return; // Exit the function
    }

    uploadtoDatabase(word, definition, pronunciation, pos);
    console.log('finished uploading');

    const msg = document.createElement("h4");
    msg.innerHTML = 'Added: ' + response.word;
    document.getElementById("main").appendChild(msg);
}
