# Release Checklist

When releasing a new version of Movie Night Hub, update the following items as needed.

---

## Required for Every Release

### 1. Version Number (package.json)
**File:** `package.json`

```json
{
  "version": "X.Y.Z"
}
```

**Versioning:**
- **Major (X):** Breaking changes, major rewrites
- **Minor (Y):** New features (e.g., Friends system)
- **Patch (Z):** Bug fixes, small tweaks

---

### 2. Database Version (app_settings)
**Location:** Supabase `app_settings` table

The app checks this to show the "Update Available" banner.

**Option A: Via Admin Panel**
1. Open Admin Panel
2. Go to Settings tab (or run SQL directly)

**Option B: Via SQL**
```sql
UPDATE app_settings
SET current_version = 'X.Y.Z', updated_at = NOW()
WHERE id = 1;
```

> **Important:** The version in `app_settings` must match `package.json` for the update banner to work correctly.

---

### 3. Changelog Entry
**Location:** Admin Panel > Changelog tab

Add a new entry for users to see in "What's New":

| Field | Description |
|-------|-------------|
| Type | `feature`, `fix`, or `improvement` |
| Title | Short description (e.g., "Friends System") |
| Description | What it does and how to use it |

**Tips:**
- Users see "What's New" automatically on login when there are new entries
- Entries are shown newest-first
- Keep descriptions concise but helpful

---

## Feature-Dependent Updates

### 4. Guidebook (for user-facing features)
**File:** `src/components/GuidebookModal.jsx`

Update when adding:
- New buttons in the header/bottom nav
- New filter options
- New features users should know about

**Sections:**
- `BUTTON_GUIDE` - Action buttons (Add, Spin, Vote, Friends, etc.)
- `FILTER_GUIDE` - Filter/sort options
- `FEATURE_GUIDE` - Feature explanations

**Example:**
```javascript
// BUTTON_GUIDE
{ icon: '👥', name: 'Friends', description: 'Manage your friends list...' }

// FEATURE_GUIDE
{
  name: 'Friends System',
  icon: '👥',
  description: 'Connect with friends to share movies...'
}
```

---

### 5. Guided Tour (for major UI changes)
**File:** `src/components/GuidedTour.jsx`

Update `TOUR_STEPS` if:
- Adding a new prominent button that new users should learn about
- Changing core navigation/UI flow
- Removing a step that no longer exists

**Note:** The tour is for first-time users. Only add steps for core features, not every new button.

---

### 6. README.md (for documentation)
**File:** `README.md`

Update when:
- Adding new features worth documenting
- Changing setup/installation steps
- Adding new migrations
- Changing environment variables

**Sections to check:**
- Features list
- Recent Updates section
- Setup instructions
- Migrations list

---

### 7. Welcome Modal (rarely)
**File:** `src/components/WelcomeModal.jsx`

Only update if:
- Changing the core value proposition
- Adding/removing a "headline" feature shown to new users

---

## Database Migrations

If your release includes database changes:

1. Create migration file: `supabase/migrations/<feature_name>.sql`
2. Test locally or on staging
3. Document in README.md under relevant setup section
4. Include in release notes/changelog

---

## Release Process

```
1. Make code changes
2. Test locally / on staging
3. Update items from this checklist
4. Commit with descriptive message
5. Push to main
6. Vercel auto-deploys
7. Run any database migrations on production Supabase
8. Update app_settings.current_version in Supabase
9. Verify deployment works
```

---

## Quick Reference

| What | Where | When |
|------|-------|------|
| Version | `package.json` | Every release |
| DB Version | `app_settings` table | Every release |
| Changelog | Admin Panel | Every release |
| Guidebook | `GuidebookModal.jsx` | New buttons/features |
| Tour | `GuidedTour.jsx` | Major UI changes |
| README | `README.md` | New features/migrations |
| Welcome | `WelcomeModal.jsx` | Core feature changes |

---

## Files Summary

```
package.json                          # Version number
src/components/GuidebookModal.jsx     # Feature/button documentation
src/components/GuidedTour.jsx         # First-time user tutorial
src/components/WelcomeModal.jsx       # New user welcome screen
README.md                             # Developer documentation
supabase/migrations/*.sql             # Database migrations
```
