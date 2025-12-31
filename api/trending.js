const TMDB_API_KEY = process.env.TMDB_API_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!TMDB_API_KEY) {
    return res.status(500).json({ error: 'TMDB API key not configured' });
  }

  // Get time window from query params (day or week)
  const timeWindow = req.query.window === 'day' ? 'day' : 'week';

  try {
    // Fetch trending movies from TMDB
    const response = await fetch(
      `https://api.themoviedb.org/3/trending/movie/${timeWindow}?api_key=${TMDB_API_KEY}`
    );

    if (!response.ok) {
      return res.status(500).json({ error: 'Failed to fetch trending movies' });
    }

    const data = await response.json();

    // Map to simplified format with essential info
    const movies = (data.results || []).slice(0, 20).map(movie => ({
      tmdb_id: movie.id,
      title: movie.title,
      year: movie.release_date ? parseInt(movie.release_date.substring(0, 4)) : null,
      poster: movie.poster_path ? `https://image.tmdb.org/t/p/w300${movie.poster_path}` : '',
      backdrop: movie.backdrop_path ? `https://image.tmdb.org/t/p/w780${movie.backdrop_path}` : '',
      overview: movie.overview || '',
      rating: movie.vote_average || 0,
      popularity: movie.popularity || 0
    }));

    return res.status(200).json({ movies, timeWindow });
  } catch (error) {
    console.error('Trending movies error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
