const GENRES = ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Romance', 'Thriller', 'Animation', 'Documentary', 'Fantasy', 'Adventure', 'Crime', 'Mystery'];
const MOODS = ['Feel-good', 'Intense', 'Thought-provoking', 'Scary', 'Romantic', 'Fun', 'Emotional', 'Adventurous'];
const STREAMING = ['Netflix', 'Amazon Prime', 'Disney+', 'HBO Max', 'Hulu', 'Apple TV+', 'Paramount+', 'Peacock', 'Other'];

const TMDB_API_KEY = process.env.TMDB_API_KEY;

// Fetch poster from TMDB
async function getTMDBPoster(title, year) {
  if (!TMDB_API_KEY) return '';
  try {
    const query = encodeURIComponent(title);
    const yearParam = year ? `&year=${year}` : '';
    const response = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${query}${yearParam}`
    );
    if (!response.ok) return '';
    const data = await response.json();
    if (data.results && data.results.length > 0 && data.results[0].poster_path) {
      return `https://image.tmdb.org/t/p/w500${data.results[0].poster_path}`;
    }
  } catch (err) {
    console.error('TMDB error:', err);
  }
  return '';
}

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

  // Limit to 15 movies and use concise format to reduce tokens
  const limitedMovies = movies.slice(0, 15);
  const movieList = limitedMovies.map(m =>
    `${m.title}${m.genre ? ` (${m.genre})` : ''}${m.favorite ? ' ★' : ''}`
  ).join(', ');

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
        messages: [
          {
            role: 'user',
            content: `Movies I like: ${movieList}

Recommend 5 similar movies. Return ONLY JSON array:
[{"title":"Movie","director":"Name","year":2020,"genre":"${GENRES[0]}","mood":"${MOODS[0]}","reason":"Why"}]

Use genres: ${GENRES.join('/')}
Use moods: ${MOODS.join('/')}`
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

      // Validate, sanitize, and fetch posters from TMDB
      const result = await Promise.all(recommendations.slice(0, 5).map(async (rec) => {
        const title = rec.title || 'Unknown';
        const year = typeof rec.year === 'number' ? rec.year : parseInt(rec.year) || null;
        const poster = await getTMDBPoster(title, year);

        return {
          title,
          director: rec.director || '',
          year,
          genre: GENRES.includes(rec.genre) ? rec.genre : '',
          mood: MOODS.includes(rec.mood) ? rec.mood : '',
          reason: rec.reason || '',
          poster,
          streaming: []
        };
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
