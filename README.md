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
- **Watch Invites**: Log movie nights and send invites to participants
  - Each user confirms what they watched independently
  - Accept with optional rating or decline
  - Auto-popup on login for pending invites
- **Per-User Tracking**: Individual watched status and ratings per user
  - "Watched by me" / "Not watched by me" filters
  - Average ratings with individual user breakdowns
- **AI-Powered** (via Anthropic Claude):
  - Auto-fill movie details by searching
  - Smart recommendations based on your collection
- **Filtering & Sorting**: By genre, mood, streaming service, watched status, favorites, and who added
- **Collections**: Organize movies into custom collections
  - Create collections with custom emoji and color
  - View mode with nice movie cards (poster, rating, genre, watched status)
  - Edit mode with search to quickly add/remove movies
  - Granular sharing: share with specific users, set view-only or edit permissions
- **Dark/Light Mode**: Toggle between themes
- **Real-time Updates**: See changes from other users instantly
- **Share List**: Generate a shareable link to your collection
- **PWA Support**: Install as app, works offline

### Admin Features
- **Admin Panel**: Separate admin account with full control
  - **Users Tab**: View all users, toggle admin status, delete users
  - **Movies Tab**: Search and delete any movie
  - **Announcements Tab**: Create/edit/delete announcements with types (info, warning, update, maintenance)
  - **Changelog Tab**: Manage What's New entries (features, fixes, improvements)
  - **Bug Reports Tab**: View and manage user-submitted bug reports with status tracking
- **Announcement Banner**: Dismissible banners at top of app (per-session)
- **Bug Reporting**: Users can submit bugs and view their own reports
- **What's New**: Changelog system that auto-shows on login when there are new updates
  - Auto-creates changelog entry when bugs are marked as resolved

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
- **Deployment**: Vercel (with Analytics)
- **AI**: Anthropic Claude API with web search
- **Email**: Resend (via Supabase Edge Functions)

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
│   ├── recommendations.js      # AI recommendations endpoint
│   └── similar.js              # Similar movies endpoint
├── supabase/
│   ├── schema.sql              # Database schema
│   ├── supabase-admin-migration.sql  # Admin features
│   ├── supabase-changelog-migration.sql  # Changelog feature
│   ├── functions/              # Edge functions
│   └── migrations/             # Feature migrations
│       ├── collection_sharing.sql
│       ├── collection_sharing_fix.sql
│       ├── user_movie_status.sql   # Per-user watched/ratings
│       └── watch_invites.sql       # Watch invite system
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
- Watched status (see below)
- Favorites only
- Added by (filter by who added the movie)

#### Watched Filter Options

| Filter | What it shows |
|--------|---------------|
| **All** | All movies, regardless of watched status |
| **Watched (global)** | Movies that **anyone** has watched |
| **Unwatched (global)** | Movies that **nobody** has watched yet |
| **Watched by me** | Movies **you personally** marked as watched |
| **Not watched by me** | Movies you haven't watched, even if others have |

#### "All" vs "Mine" Tabs

- **All**: Shows all movies in the collection from all users
- **Mine**: Shows only movies **you added** to the collection (not movies you watched)

To see movies you've watched regardless of who added them, use the "Watched by me" filter.

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

In Supabase SQL Editor, run `supabase/supabase-admin-migration.sql` to create:
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

### 4. Run Changelog Migration

In Supabase SQL Editor, run `supabase/supabase-changelog-migration.sql` to create:
- `changelog` table for What's New entries
- RLS policies for changelog access

---

## Collections Setup

To enable collection sharing features, run the migrations in order:

### 1. Run Collection Sharing Migration

In Supabase SQL Editor, run `supabase/migrations/collection_sharing.sql` to create:
- `collection_shares` table
- RLS policies for shared access

### 2. Run Collection Sharing Fix

In Supabase SQL Editor, run `supabase/migrations/collection_sharing_fix.sql` to:
- Fix RLS policy recursion issues
- Add helper function for user lookups

### 3. Link Existing Collections (if needed)

If you have existing collections without owners:
```sql
-- Find your auth ID
SELECT id FROM auth.users WHERE email = 'your@email.com';

-- Update collections
UPDATE collections SET user_id = 'YOUR_AUTH_ID' WHERE user_id IS NULL;
```

---

## Watch Invites & Per-User Tracking Setup

To enable the watch invites and per-user tracking features:

### 1. Run User Movie Status Migration

In Supabase SQL Editor, run `supabase/migrations/user_movie_status.sql` to create:
- `user_movie_status` table for per-user watched/rating tracking
- RLS policies for user access

### 2. Run Watch Invites Migration

In Supabase SQL Editor, run `supabase/migrations/watch_invites.sql` to create:
- `watch_invites` table for movie night invites
- RLS policies for invite management

### 3. Enable Real-time (Optional)

For real-time invite notifications:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE user_movie_status;
ALTER PUBLICATION supabase_realtime ADD TABLE watch_invites;
```

---

## Voting Sessions Setup

To enable the voting sessions feature (multiple concurrent voting sessions):

### 1. Run Voting Sessions Migration

In Supabase SQL Editor, run `supabase/migrations/voting_sessions.sql` to create:
- `voting_sessions` table for session management
- `voting_session_participants` table for tracking participants
- Adds `session_id` column to existing `votes` table
- RLS policies for session access and management

### 2. How Voting Sessions Work

- **Multiple Sessions**: Different groups can run separate voting sessions simultaneously (e.g., "Chris's house" vs "John's place")
- **Session Creator**: Can invite/remove participants, cancel session, declare winner
- **Participants**: Receive invite notifications, can accept/decline, then vote on movies
- **Votes per Session**: Each session has its own votes, cleared when session ends

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

### Watch Invites & Per-User Tracking
- **Watch Invites**: When you log a movie night, other participants receive an invite to confirm they watched it
- **Per-User Ratings**: Each user can now rate movies independently - see average ratings and who rated what
- **New Filters**: "Watched by me" and "Not watched by me" to track your personal watch history
- **Invite Notifications**: Badge shows pending invites, auto-popup on login if unread
- **How it works**:
  1. Spin the wheel → Pick a movie → Log Movie Night with participants
  2. You get marked as watched immediately
  3. Others receive an invite they can Accept (with rating) or Decline
  4. Everyone's watch status is tracked independently

### Collections Feature
- Create custom collections with emoji and color themes
- Two viewing modes:
  - **View Mode**: Beautiful movie card grid with posters, ratings, genres, and watched status
  - **Edit Mode**: Add/remove movies with search functionality
- Granular sharing system:
  - Share collections with specific users (not everyone)
  - Set permissions per user: "View only" or "Can edit"
  - Collection owners can manage all shares
- Search movies by title, director, genre, or year when adding to collections

### Auth Improvements
- Graceful handling of expired sessions on sign out
- No more errors when session already expired

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

### What's New / Changelog
- Admin can create changelog entries (features, fixes, improvements)
- Auto-creates changelog entry when bugs are marked as resolved
- Auto-popup on login when there are new entries since last visit
- "What's New" button in user profile menu
- Shows latest 20 entries with type badges

### Admin Panel & Bug Reporting
- Full admin dashboard with 5 tabs (Users, Movies, Announcements, Changelog, Bug Reports)
- Users can submit and track their own bug reports
- Announcement system with dismissible banners

### Mobile Improvements
- **Bottom Navigation**: All 12 features accessible via horizontal scroll
  - Add, Select, Hot, Spin, Vote, MOTW, Schedule, History, AI Recs, Collections, Share, Stats
- **Collections**: Mobile-friendly drill-down layout
  - Full-width collection list, tap to view details
  - Back arrow navigation, responsive movie grids
- Modal safe area padding for phones with navigation gestures
- Tutorial tooltip no longer overlaps bottom nav buttons
- Improved touch targets and scrolling

### Guided Tour
- Interactive 7-step tutorial for new users
- Spotlight effect, keyboard navigation
- Tooltip hints on key features

### Email Notifications
- Admin receives emails for new users, profile changes, bug reports
- Powered by Resend + Supabase Edge Functions

### Analytics
- Vercel Analytics integration for visitor tracking
- Privacy-friendly, no cookie consent required

### Bug Fixes
- SpinWheel and VotingModal now fetch all movies independently (not limited by pagination)
- "Mine" tab pagination works correctly with server-side filtering

---

## Future Ideas / Discussion

Ideas to consider for future development:

- **User-fair spin algorithm**: Currently the spin wheel is "movie-fair" (each movie has equal chance). This means users who add more movies have higher odds of their movie being picked. An alternative "user-fair" mode could give each selected participant equal odds, then pick randomly from that user's movies. Example: Alice (10 movies) and Bob (2 movies) would each have 50% chance, rather than Alice having 83%.

---

## License

MIT
