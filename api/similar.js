const TMDB_API_KEY = process.env.TMDB_API_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { title, year } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Movie title is required' });
  }

  if (!TMDB_API_KEY) {
    return res.status(500).json({ error: 'TMDB API key not configured' });
  }

  try {
    // First, search for the movie to get its TMDB ID
    const query = encodeURIComponent(title);
    const yearParam = year ? `&year=${year}` : '';
    const searchResponse = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${query}${yearParam}`
    );

    if (!searchResponse.ok) {
      return res.status(500).json({ error: 'Failed to search for movie' });
    }

    const searchData = await searchResponse.json();
    if (!searchData.results || searchData.results.length === 0) {
      return res.status(404).json({ error: 'Movie not found', similar: [] });
    }

    const movieId = searchData.results[0].id;

    // Fetch similar movies
    const similarResponse = await fetch(
      `https://api.themoviedb.org/3/movie/${movieId}/similar?api_key=${TMDB_API_KEY}`
    );

    if (!similarResponse.ok) {
      return res.status(500).json({ error: 'Failed to fetch similar movies' });
    }

    const similarData = await similarResponse.json();

    // Map to simplified format
    const similar = (similarData.results || []).slice(0, 10).map(movie => ({
      tmdb_id: movie.id,
      title: movie.title,
      year: movie.release_date ? parseInt(movie.release_date.substring(0, 4)) : null,
      poster: movie.poster_path ? `https://image.tmdb.org/t/p/w200${movie.poster_path}` : '',
      rating: movie.vote_average || 0,
      overview: movie.overview ? movie.overview.substring(0, 150) + '...' : ''
    }));

    return res.status(200).json({ similar });
  } catch (error) {
    console.error('Similar movies error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
