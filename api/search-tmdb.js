const TMDB_API_KEY = process.env.TMDB_API_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query } = req.body;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Search query is required' });
  }

  if (!TMDB_API_KEY) {
    return res.status(500).json({ error: 'TMDB API key not configured' });
  }

  try {
    const searchQuery = encodeURIComponent(query);
    const response = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${searchQuery}&page=1`
    );

    if (!response.ok) {
      return res.status(500).json({ error: 'Failed to search TMDB' });
    }

    const data = await response.json();

    // Return top 5 results with basic info (TMDB sorts by popularity)
    const results = (data.results || []).slice(0, 5).map(movie => ({
      tmdb_id: movie.id,
      title: movie.title,
      year: movie.release_date ? parseInt(movie.release_date.substring(0, 4)) : null,
      poster: movie.poster_path ? `https://image.tmdb.org/t/p/w200${movie.poster_path}` : '',
      overview: movie.overview ? movie.overview.substring(0, 100) + '...' : ''
    }));

    return res.status(200).json(results);
  } catch (error) {
    console.error('TMDB search error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
