# Baby Reveal Invite

Animated "Boy or Girl?" gender-reveal invitation with RSVP + guessing, and an admin dashboard.

- **Stack:** Next.js (App Router) · Framer Motion (`motion`) · Tailwind CSS · Supabase (Postgres)
- **Guest site:** `/` — gift-box intro, invitation card, countdown, details, live vote meter, RSVP & guess form, wishes wall, reveal mode.
- **Admin:** `/admin` — password login, stats, guests (add / edit / soft-delete / restore / CSV export), all invitation content, section toggles, secret gender + reveal switch, password change.

## Security model
All tables have RLS enabled with no policies, so the public key cannot read or write them directly.
Guests can only call `get_site` (never returns the secret gender until revealed) and `submit_rsvp` (one RSVP per device).
Admin functions (`admin_*`) require a session token from `admin_login` (bcrypt password, 7-day sessions).

## Env
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publishable key; defaults are baked into `lib/api.ts`).
