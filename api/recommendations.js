import { GENRES, MOODS, STREAMING } from '../shared/constants.js'
import { verifyAuth } from './auth-verify.js'

const TMDB_API_KEY = process.env.TMDB_API_KEY
const isDev = process.env.NODE_ENV !== 'production'

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
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Verify authentication (optional but logged)
  const user = await verifyAuth(req)
  if (isDev && user) {
    console.log('Recommendations request from:', user.email)
  }

  const { movies, seedMovie } = req.body

  if (!movies || !Array.isArray(movies)) {
    return res.status(400).json({ error: 'Movies array is required' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    return res.status(500).json({ error: 'Anthropic API key not configured' })
  }

  // Sort movies by preference: favorites first, then by rating, then unwatched
  const sortedMovies = [...movies].sort((a, b) => {
    // Favorites first
    if (a.favorite && !b.favorite) return -1;
    if (!a.favorite && b.favorite) return 1;
    // Then by rating (higher first)
    const ratingA = a.rating || 0;
    const ratingB = b.rating || 0;
    if (ratingA !== ratingB) return ratingB - ratingA;
    // Then unwatched (to understand what they want to see)
    if (!a.watched && b.watched) return -1;
    if (a.watched && !b.watched) return 1;
    return 0;
  });

  // Limit to 15 movies with better context
  const limitedMovies = sortedMovies.slice(0, 15);
  const movieList = limitedMovies.map(m => {
    let info = m.title;
    if (m.genre) info += ` (${m.genre})`;
    if (m.favorite) info += ' [favorite]';
    if (m.rating >= 4) info += ` [rated ${m.rating}/5]`;
    if (m.watched) info += ' [watched]';
    return info;
  }).join(', ');

  // Build prompt based on whether we have a seed movie or not
  let prompt;
  if (seedMovie) {
    // "More like this" mode - focus on the specific movie
    prompt = `I really liked the movie "${seedMovie.title}"${seedMovie.year ? ` (${seedMovie.year})` : ''}${seedMovie.genre ? `, genre: ${seedMovie.genre}` : ''}${seedMovie.mood ? `, mood: ${seedMovie.mood}` : ''}.

Recommend 5 similar movies that share its style, themes, or vibe. Return ONLY JSON array:
[{"title":"Movie","director":"Name","year":2020,"genre":"${GENRES[0]}","mood":"${MOODS[0]}","reason":"Brief reason why it's similar"}]

Use genres: ${GENRES.join('/')}
Use moods: ${MOODS.join('/')}`;
  } else {
    // General recommendations based on collection
    prompt = `My movie collection (favorites and highly-rated first): ${movieList}

Recommend 5 movies I'd enjoy based on my taste. Return ONLY JSON array:
[{"title":"Movie","director":"Name","year":2020,"genre":"${GENRES[0]}","mood":"${MOODS[0]}","reason":"Brief reason based on my preferences"}]

Use genres: ${GENRES.join('/')}
Use moods: ${MOODS.join('/')}`;
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
        messages: [
          {
            role: 'user',
            content: prompt
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
