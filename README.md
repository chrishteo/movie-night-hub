# Movie Night Hub

A collaborative movie watchlist app for groups of friends to manage movies and decide what to watch on movie nights.

## Features

### Core Features
- **Movie Management**: Add, edit, and delete movies with full details (title, director, year, genre, mood, rating, poster, streaming services)
- **Multi-User Support**: User profiles with avatars, linked to authentication
- **Decision Tools**:
  - Spin the Wheel: Random movie picker with participant selection
  - Voting System: Users vote yes/no on movies with participant selection
  - Movie of the Week: Schedule picks with history
- **AI-Powered** (via Anthropic Claude):
  - Auto-fill movie details by searching
  - Smart recommendations based on your collection
- **Filtering & Sorting**: By genre, mood, streaming service, watched status, favorites, and who added
- **Dark/Light Mode**: Toggle between themes
- **Real-time Updates**: See changes from other users instantly
- **Share List**: Generate a shareable link to your collection
- **PWA Support**: Install as app, works offline

### Admin Features
- **Admin Panel**: Separate admin account with full control
  - **Users Tab**: View all users, toggle admin status, delete users
  - **Movies Tab**: Search and delete any movie
  - **Announcements Tab**: Create/edit/delete announcements with types (info, warning, update, maintenance)
  - **Bug Reports Tab**: View and manage user-submitted bug reports with status tracking
- **Announcement Banner**: Dismissible banners at top of app (per-session)
- **Bug Reporting**: Users can submit bugs and view their own reports

### Onboarding
- **Guided Tour**: 7-step interactive tutorial for new users
  - Auto-triggers on first visit
  - Spotlight effect highlights UI elements
  - Keyboard navigation (arrows, Enter, Escape)
  - Re-watchable from user menu
- **Tooltip Hints**: `?` icons with explanations on key features

### Email Notifications (Admin)
- **Resend Integration**: Email notifications via Supabase Edge Functions
- **Triggers**:
  - New user signups
  - User profile changes
  - Bug report submissions

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
2. Enter a movie title (include year for better results: "Cold War 2018")
3. Click the 🔍 button to search - shows up to 10 results
4. Select the correct movie from results
5. Details auto-fill (poster, cast, ratings, streaming)
6. Adjust any fields as needed
7. Click "Add"

### Decision Tools

- **🎡 Spin**: Randomly pick from unwatched movies
  - Smooth easing animation (fast start, slow finish)
  - Select which participants' movies to include
  - "Prioritize shared movies" option - picks from movies added by multiple people first
  - Shows who added the winning movie
- **🗳️ Vote**: Each user votes thumbs up/down, declare a winner
  - Toggle votes by clicking again to remove
  - Multiple exit options (Esc key, X button, click outside)
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

## Admin Setup

### 1. Run Admin Migration

In Supabase SQL Editor, run `supabase-admin-migration.sql` to create:
- `is_admin` column on users table
- `announcements` table
- `bug_reports` table
- RLS policies for admin access

### 2. Create Admin Account

1. Sign up in the app with your admin email
2. In Supabase SQL Editor, run:
```sql
UPDATE users SET is_admin = TRUE WHERE name = 'YourAdminName';
```

### 3. Access Admin Panel

Log in as admin → Click "Admin" button in header

---

## Email Notifications Setup

### 1. Create Resend Account

1. Go to [resend.com](https://resend.com) and sign up
2. Create an API key (starts with `re_`)
3. Note: Free tier = 3,000 emails/month

### 2. Add Secrets to Supabase

Go to **Project Settings → Edge Functions → Secrets** and add:
- `RESEND_API_KEY` = your Resend API key
- `ADMIN_EMAIL` = your email (must match Resend account email for test domain)
- `FROM_EMAIL` = `onboarding@resend.dev` (or your verified domain)

### 3. Deploy Edge Function

The edge function is in `supabase/functions/send-notification/index.ts`.

Deploy via Supabase Dashboard:
1. Go to **Edge Functions** → **Create new function**
2. Name: `send-notification`
3. Paste the code from `index.ts`
4. Click **Deploy**

### 4. Run Notification Triggers Migration

In Supabase SQL Editor, run `supabase/migrations/add_notification_triggers.sql`.

**Important**: Replace these placeholders in the SQL:
- `<YOUR_PROJECT_REF>` → your Supabase project ref (e.g., `sixyhmvvljyyxoycnbqi`)
- `<YOUR_ANON_KEY>` → your Supabase anon key

### 5. Test

Submit a bug report in the app - you should receive an email!

---

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

### Email Notifications Not Working

- Check Resend dashboard for error logs
- Verify secrets are set in Supabase Edge Functions
- For test domain (`onboarding@resend.dev`), `ADMIN_EMAIL` must match your Resend account email
- Check Edge Function logs in Supabase for errors

### Tutorial Not Showing

- Clear `movienight-tutorial-completed` from localStorage to re-trigger
- Or click profile dropdown → "View Tutorial"

---

## Recent Updates (Jan 2026)

### Spin Wheel Improvements
- Smooth easing animation (fast start, dramatic slowdown)
- Bigger display window for better visibility
- Shows "Added by" info for winning movie
- New "Prioritize shared movies" option - when enabled, picks from movies that multiple participants added
- Admin user excluded from participant selection

### Voting Enhancements
- Toggle votes by clicking the same button again
- Multiple exit options: Esc key, X button in header, click outside modal
- Visual ring highlight on active votes

### Movie Search Improvements
- Include year in search for better results (e.g., "Cold War 2018")
- Shows 10 results instead of 5
- Year filter passed to TMDB for more accurate matches
- Clicking a search result now fetches exact movie by TMDB ID (fixes wrong movie being loaded)

### Mobile & UI Fixes
- Guided tour now targets correct buttons on mobile (BottomNav)
- Admin panel tabs scroll horizontally instead of squeezing
- Avatar picker grid displays correctly

### Admin Panel & Bug Reporting
- Full admin dashboard with 4 tabs (Users, Movies, Announcements, Bug Reports)
- Users can submit and track their own bug reports
- Announcement system with dismissible banners

### Guided Tour
- Interactive 7-step tutorial for new users
- Spotlight effect, keyboard navigation
- Tooltip hints on key features

### Email Notifications
- Admin receives emails for new users, profile changes, bug reports
- Powered by Resend + Supabase Edge Functions

---

## License

MIT
