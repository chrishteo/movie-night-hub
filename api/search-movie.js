const GENRES = ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Romance', 'Thriller', 'Animation', 'Documentary', 'Fantasy', 'Adventure', 'Crime', 'Mystery'];
const MOODS = ['Feel-good', 'Intense', 'Thought-provoking', 'Scary', 'Romantic', 'Fun', 'Emotional', 'Adventurous'];
const STREAMING = ['Netflix', 'Amazon Prime', 'Disney+', 'HBO Max', 'Hulu', 'Apple TV+', 'Paramount+', 'Peacock', 'Other'];

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { title } = req.body;

  if (!title || typeof title !== 'string') {
    return res.status(400).json({ error: 'Movie title is required' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Anthropic API key not configured' });
  }

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
        max_tokens: 1024,
        tools: [
          {
            type: 'web_search_20250305',
            name: 'web_search'
          }
        ],
        messages: [
          {
            role: 'user',
            content: `Search for information about the movie "${title}". Find the TMDB (The Movie Database) page for this movie to get accurate details.

Return ONLY a valid JSON object with these exact fields:
{
  "title": "Official movie title",
  "director": "Director's full name",
  "year": 2020,
  "genre": "One genre from: ${GENRES.join(', ')}",
  "mood": "One mood from: ${MOODS.join(', ')}",
  "poster": "TMDB poster URL in format https://image.tmdb.org/t/p/w500/POSTER_PATH.jpg",
  "streaming": ["Array of streaming services where currently available from: ${STREAMING.join(', ')}"]
}

For the poster, look for the TMDB poster_path and construct the full URL like: https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg

Important: Return ONLY the JSON object, no other text or explanation.`
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Anthropic API error:', errorData);
      return res.status(500).json({ error: 'Failed to search for movie' });
    }

    const data = await response.json();

    // Extract text from response content
    const textContent = data.content
      ?.filter(item => item.type === 'text')
      .map(item => item.text)
      .join('') || '';

    // Try to extract JSON from response
    const jsonMatch = textContent
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      console.error('Could not find JSON in response:', textContent);
      return res.status(500).json({ error: 'Could not parse movie information' });
    }

    try {
      const movieInfo = JSON.parse(jsonMatch[0]);

      // Validate and sanitize the response
      const result = {
        title: movieInfo.title || title,
        director: movieInfo.director || '',
        year: typeof movieInfo.year === 'number' ? movieInfo.year : parseInt(movieInfo.year) || null,
        genre: GENRES.includes(movieInfo.genre) ? movieInfo.genre : '',
        mood: MOODS.includes(movieInfo.mood) ? movieInfo.mood : '',
        poster: typeof movieInfo.poster === 'string' ? movieInfo.poster : '',
        streaming: Array.isArray(movieInfo.streaming)
          ? movieInfo.streaming.filter(s => STREAMING.includes(s))
          : []
      };

      return res.status(200).json(result);
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Content:', jsonMatch[0]);
      return res.status(500).json({ error: 'Failed to parse movie information' });
    }
  } catch (error) {
    console.error('Search movie error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
