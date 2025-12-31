const GENRES = ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Romance', 'Thriller', 'Animation', 'Documentary', 'Fantasy', 'Adventure', 'Crime', 'Mystery'];
const MOODS = ['Feel-good', 'Intense', 'Thought-provoking', 'Scary', 'Romantic', 'Fun', 'Emotional', 'Adventurous'];
const STREAMING = ['Netflix', 'Amazon Prime', 'Disney+', 'HBO Max', 'Hulu', 'Apple TV+', 'Paramount+', 'Peacock', 'Other'];

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { movies } = req.body;

  if (!movies || !Array.isArray(movies)) {
    return res.status(400).json({ error: 'Movies array is required' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Anthropic API key not configured' });
  }

  // Format the movie collection for the prompt
  const movieList = movies.map(m => {
    const parts = [m.title];
    if (m.genre) parts.push(`Genre: ${m.genre}`);
    if (m.mood) parts.push(`Mood: ${m.mood}`);
    if (m.rating) parts.push(`Rating: ${m.rating}/5`);
    if (m.favorite) parts.push('(Favorite)');
    return parts.join(' - ');
  }).join('\n');

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        tools: [
          {
            type: 'web_search_20250305',
            name: 'web_search'
          }
        ],
        messages: [
          {
            role: 'user',
            content: `Based on this movie collection:

${movieList}

Recommend 5 movies they would love. For each recommendation, search for current streaming availability.

Return ONLY a valid JSON array with exactly 5 objects:
[
  {
    "title": "Movie title",
    "director": "Director name",
    "year": 2020,
    "genre": "One from: ${GENRES.join(', ')}",
    "mood": "One from: ${MOODS.join(', ')}",
    "reason": "Brief explanation why they'd enjoy this movie (1-2 sentences)",
    "poster": "URL to movie poster",
    "streaming": ["Available streaming services from: ${STREAMING.join(', ')}"]
  }
]

Important: Return ONLY the JSON array, no other text or explanation. Do not recommend movies already in their collection.`
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Anthropic API error:', errorData);
      return res.status(500).json({ error: 'Failed to get recommendations' });
    }

    const data = await response.json();

    // Extract text from response content
    const textContent = data.content
      ?.filter(item => item.type === 'text')
      .map(item => item.text)
      .join('') || '';

    // Try to extract JSON array from response
    const jsonMatch = textContent
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      console.error('Could not find JSON array in response:', textContent);
      return res.status(500).json({ error: 'Could not parse recommendations' });
    }

    try {
      const recommendations = JSON.parse(jsonMatch[0]);

      // Validate and sanitize each recommendation
      const result = recommendations.map(rec => ({
        title: rec.title || 'Unknown',
        director: rec.director || '',
        year: typeof rec.year === 'number' ? rec.year : parseInt(rec.year) || null,
        genre: GENRES.includes(rec.genre) ? rec.genre : '',
        mood: MOODS.includes(rec.mood) ? rec.mood : '',
        reason: rec.reason || '',
        poster: typeof rec.poster === 'string' ? rec.poster : '',
        streaming: Array.isArray(rec.streaming)
          ? rec.streaming.filter(s => STREAMING.includes(s))
          : []
      }));

      return res.status(200).json(result);
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Content:', jsonMatch[0]);
      return res.status(500).json({ error: 'Failed to parse recommendations' });
    }
  } catch (error) {
    console.error('Recommendations error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
