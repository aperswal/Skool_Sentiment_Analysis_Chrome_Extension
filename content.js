chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "test") {
        sendResponse({ status: "active" });  // Just acknowledge that the script is loaded
        return true;
    }
    if (request.action === "generateLeaderboard") {
        const textElements = Array.from(document.querySelectorAll('div.styled__Paragraph-sc-y5pp90-3'));
        let allText = textElements.map(el => el.innerText).join(' ');
        let phrases = extractPhrases(allText);
        let sentimentScore = analyzeSentiment(allText);

        let phraseCounts = phrases.reduce((acc, phrase) => {
            acc[phrase] = (acc[phrase] || 0) + 1;
            return acc;
        }, {});

        let sortedPhrases = Object.entries(phraseCounts)
            .map(([phrase, count]) => ({ phrase, count }))
            .sort((a, b) => b.count - a.count);

        sendResponse({data: { phrases: sortedPhrases.slice(0, 10), sentiment: sentimentScore }});
        return true; // Keep the message channel open
    }
});

function extractPhrases(text) {
    text = normalizeText(text);
    const regex = /\b(\w+\s+){1,5}\w+\b/g; // Match phrases of up to six words
    let match;
    let phrases = [];
    while ((match = regex.exec(text))) {
        let phrase = match[0].trim();
        if (!stopWords.includes(phrase.toLowerCase()) && phrase.split(' ').length > 1) {
            phrases.push(phrase);
        }
    }
    return phrases;
}

function analyzeSentiment(text) {
    const positiveWords = [
        'happy', 'good', 'great', 'amazing', 'positive', 'delight', 'excellent', 'fantastic', 'fabulous', 'wonderful', 'perfect', 'loved'
    ];
    const negativeWords = [
        'sad', 'bad', 'terrible', 'awful', 'negative', 'horrible', 'poor', 'worst', 'disgusting', 'dreadful', 'hateful'
    ];
    let score = 0;

    const words = text.split(/\s+/);
    words.forEach(word => {
        if (positiveWords.includes(word)) score++;
        if (negativeWords.includes(word)) score--;
    });

    return categorizeSentiment(score, words.length);
}

function categorizeSentiment(score, totalWords) {
    // Normalize the score by the number of words
    const normalizedScore = score / totalWords;

    if (normalizedScore <= -0.05) return 'Super Negative';
    if (normalizedScore > -0.05 && normalizedScore < 0) return 'Negative';
    if (normalizedScore === 0) return 'Neutral';
    if (normalizedScore > 0 && normalizedScore < 0.05) return 'Positive';
    if (normalizedScore >= 0.05) return 'Super Positive';
}

// Normalize and remove punctuation for better word matching
function normalizeText(text) {
    return text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()\[\]"'|<>?\\0-9]/g, '').replace(/\s{2,}/g, ' ');
}

const stopWords = [
    "i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your", "yours", "yourself", "yourselves", 
    "he", "him", "his", "himself", "she", "her", "hers", "herself", "it", "its", "itself", "they", "them", "their", 
    "theirs", "themselves", "what", "which", "who", "whom", "this", "that", "these", "those", "am", "is", "are", 
    "was", "were", "be", "been", "being", "have", "has", "had", "having", "do", "does", "did", "doing", "a", "an", 
    "the", "and", "but", "if", "or", "because", "as", "until", "while", "of", "at", "by", "for", "with", "about", 
    "against", "between", "into", "through", "during", "before", "after", "above", "below", "to", "from", "up", 
    "down", "in", "out", "on", "off", "over", "under", "again", "further", "then", "once", "here", "there", "when", 
    "where", "why", "how", "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", "no", 
    "nor", "not", "only", "own", "same", "so", "than", "too", "very", "s", "t", "can", "will", "just", "don", 
    "should", "now"
];
