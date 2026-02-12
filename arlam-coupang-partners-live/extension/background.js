// Purple Vision Bridge - Background Script
console.log('[Purple Vision Bridge] Background script active');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'COUPANG_DATA_SCRAPED') {
        const scrapedData = message.data;

        // Find Purple Vision tabs and send data
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                // Check if tab title or URL matches Purple Vision
                if (tab.title && tab.title.includes('PURPLE VISION')) {
                    console.log(`[Purple Vision Bridge] Relaying data to tab: ${tab.id}`);
                    chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        func: (data) => {
                            window.postMessage({ type: 'PURPLE_VISION_SYNC', data }, '*');
                        },
                        args: [scrapedData]
                    });
                }
            });
        });
    }
});
