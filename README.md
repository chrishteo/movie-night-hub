# Movie Night Hub

A collaborative movie watchlist app for groups of friends to manage movies and decide what to watch on movie nights.

## Features

- **Movie Management**: Add, edit, and delete movies with full details (title, director, year, genre, mood, rating, poster, streaming services)
- **Multi-User Support**: Simple user system to track who added each movie
- **Decision Tools**:
  - Spin the Wheel: Random movie picker with animation
  - Voting System: Users vote yes/no on movies
  - Movie of the Week: Schedule picks with history
- **AI-Powered** (via Anthropic Claude):
  - Auto-fill movie details by searching
  - Smart recommendations based on your collection
- **Filtering & Sorting**: By genre, mood, streaming service, watched status, and more
- **Dark/Light Mode**: Toggle between themes
- **Real-time Updates**: See changes from other users instantly
- **Share List**: Generate a shareable link to your collection

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel
- **AI**: Anthropic Claude API with web search

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (free tier works)
- Anthropic API key
- Vercel account (for deployment)

## Local Development Setup

### 1. Clone and Install

```bash
cd movie-night-hub
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be ready
3. Go to the SQL Editor in your Supabase dashboard
4. Copy the contents of `supabase/schema.sql` and run it
5. Go to Settings > API to find your project URL and anon key

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
ANTHROPIC_API_KEY=your-anthropic-api-key
```

### 4. Run the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

**Note**: The AI features (movie search and recommendations) won't work locally since they require the Vercel serverless functions. You can still use all other features.

## Deployment to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/movie-night-hub.git
git push -u origin main
```

### 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New" > "Project"
3. Import your GitHub repository
4. Configure environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `ANTHROPIC_API_KEY`
5. Click "Deploy"

### 3. Enable Real-time (Optional)

For real-time updates to work across users:

1. Go to your Supabase project
2. Go to Database > Replication
3. Enable replication for the `movies`, `votes`, and `users` tables

## Project Structure

```
movie-night-hub/
├── api/                        # Vercel serverless functions
│   ├── search-movie.js         # AI movie search endpoint
│   └── recommendations.js      # AI recommendations endpoint
├── supabase/
│   └── schema.sql              # Database schema
├── src/
│   ├── components/             # React components
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Supabase client & API
│   ├── utils/                  # Constants & helpers
│   ├── App.jsx                 # Main app component
│   ├── main.jsx                # Entry point
│   └── index.css               # Global styles
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── vercel.json
```

## Usage Guide

### Adding Movies

1. Click the "+ Add" button
2. Enter a movie title
3. Click the 🔍 button to auto-fill details using AI
4. Adjust any fields as needed
5. Click "Add"

### Decision Tools

- **🎡 Spin**: Randomly pick from unwatched movies
- **🗳️ Vote**: Each user votes thumbs up/down, declare a winner
- **📅 Movie of the Week**: Pick and track weekly selections

### AI Recommendations

Click the 💡 button to get personalized recommendations based on your collection. You can add any recommendation directly to your list.

### Filtering

Use the dropdowns to filter by:
- Genre
- Mood
- Streaming service
- Watched/Unwatched status
- Favorites only

## Customization

### Adding Genres/Moods/Streaming Services

Edit `src/utils/constants.js` to add or modify options:

```javascript
export const GENRES = ['Action', 'Comedy', ...];
export const MOODS = ['Feel-good', 'Intense', ...];
export const STREAMING = ['Netflix', 'Disney+', ...];
```

Don't forget to also update the arrays in `api/search-movie.js` and `api/recommendations.js`.

### Theming

The app uses Tailwind CSS. Modify colors in `tailwind.config.js` or update the class names in components.

## Troubleshooting

### AI Features Not Working

- Verify your `ANTHROPIC_API_KEY` is set correctly in Vercel
- Check the Vercel function logs for errors
- Ensure you have credits/quota on your Anthropic account

### Database Connection Issues

- Verify your Supabase URL and anon key are correct
- Check that the RLS policies were created (the schema includes permissive policies)
- Ensure the tables exist by checking the Supabase Table Editor

### Real-time Not Updating

- Make sure replication is enabled for the tables in Supabase
- Check browser console for WebSocket connection errors

## License

MIT
