const axios = require('axios');

/**
 * Perform a web search using Google Custom Search API.
 * Returns top results with title, snippet, and URL.
 */
async function webSearch(query) {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_CX_ID;
  if (!apiKey || !cx) {
    throw new Error('Google Search API key or CX ID not configured');
  }
  const url = 'https://www.googleapis.com/customsearch/v1';

  const response = await axios.get(url, {
    params: { key: apiKey, cx: cx, q: query, num: 3 }
  });

  const items = response.data.items || [];
  return items.map(item => ({
    title: item.title,
    snippet: item.snippet || item.htmlSnippet,
    url: item.link
  }));
}

module.exports = { webSearch };
