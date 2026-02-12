// Purple Vision Bridge - Content Script
console.log('[Purple Vision Bridge] Content script loaded');

function scrapeCoupangData() {
    const data = {
        clicks: 0,
        orders: 0,
        revenue: 0,
        commission: 0,
        timestamp: new Date().toISOString()
    };

    // Helper to find numbers in elements after a specific label
    const findNumberByLabel = (label) => {
        const elements = Array.from(document.querySelectorAll('div, span, p, h1, h2, h3, h4, td, li'));
        const target = elements.find(el => el.innerText.trim() === label);
        if (target) {
            // Look for the next sibling or parent's next sibling that contains a number
            let parent = target;
            for (let i = 0; i < 3; i++) { // Search up to 3 levels up
                const text = parent.innerText;
                const numbers = text.match(/[\d,]+/g);
                if (numbers && numbers.length > (label === text.trim() ? 0 : 0)) {
                    // If the label is part of the text, we might need to filter it out
                    const filtered = numbers.filter(n => n.length > 0);
                    if (filtered.length > 0) {
                        // Return the last number found in the context (usually the value)
                        return parseInt(filtered[filtered.length - 1].replace(/,/g, ''));
                    }
                }
                parent = parent.parentElement;
                if (!parent) break;
            }
        }
        return null;
    };

    // Try common selectors/labels in Coupang Partners Dashboard
    // These are typical labels in the Korean UI
    data.clicks = findNumberByLabel('클릭') || findNumberByLabel('클릭수') || 0;
    data.orders = findNumberByLabel('구매건수') || 0;
    data.revenue = findNumberByLabel('구매금액') || findNumberByLabel('구매액') || 0;
    data.commission = findNumberByLabel('수익') || findNumberByLabel('예상수익') || 0;

    if (data.clicks > 0 || data.orders > 0 || data.commission > 0) {
        console.log('[Purple Vision Bridge] Scraped data:', data);
        chrome.runtime.sendMessage({ type: 'COUPANG_DATA_SCRAPED', data });
    }
}

// Scrape periodically
setInterval(scrapeCoupangData, 5000);
scrapeCoupangData();
