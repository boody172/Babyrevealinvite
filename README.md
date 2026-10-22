# Baby Reveal Invite

Animated "Boy or Girl?" gender-reveal invitation with RSVP + guessing, and an admin dashboard.

- **Stack:** Next.js (App Router) · Framer Motion (`motion`) · Tailwind CSS · Supabase (Postgres)
- **Many invitations, one site:** each invitation has its own link (`/<slug>`), content, design, guests and secret.
  `/` shows the invitation marked as home.
- **Guest site:** gift-box intro, invitation card, countdown, details, Google map, live vote meter, RSVP & guess form, wishes wall, reveal mode.
- **Admin:** `/admin` — invitations manager (create blank or duplicate, rename, change link, set home, archive),
  per-invitation stats, guests (add / edit / soft-delete / restore / CSV export), every text, design (themes, colors,
  fonts, section order, backgrounds from a shared media library, card text position), live preview before saving,
  secret gender + reveal, password change.

## Security model
All tables have RLS enabled with no policies, so the public key cannot read or write them directly.
Guests can only call `invite_get` (never returns the secret gender until revealed), `invite_rsvp` (one RSVP per device
per invitation) and `get_media`. Schema lives in `supabase/migrations`.
Admin functions (`admin_*`) require a session token from `admin_login` (bcrypt password, 7-day sessions).

## Env
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publishable key; defaults are baked into `lib/api.ts`).
