-- Each invitation can have its own Vercel link (e.g. faisal-khadija-invitation.vercel.app).
-- Requests on that host are rewritten to the invitation; the lookup happens in the same
-- database call that loads the page, so a dedicated link costs nothing extra.

alter table public.invitations add column if not exists domain text unique
  check (domain is null or domain ~ '^[a-z0-9.-]{4,253}$');

create or replace function public.invite_get_by_domain(p_domain text, p_device text default null)
returns jsonb language sql stable security definer set search_path = public as $$
  select public.invite_get(i.slug, p_device)
  from invitations i where i.domain = lower(p_domain) and not i.archived;
$$;

create or replace function public.admin_invitation_set_domain(p_token text, p_id uuid, p_domain text)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform _admin_check(p_token);
  update invitations set domain = nullif(lower(trim(p_domain)), ''), updated_at = now() where id = p_id;
end $$;

-- admin list now includes the dedicated link
create or replace function public.admin_invitations(p_token text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  perform _admin_check(p_token);
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', i.id, 'slug', i.slug, 'name', i.name, 'archived', i.archived, 'domain', i.domain,
      'is_home', i.id = (select home_invitation from app_config where id = 1),
      'created_at', i.created_at,
      'language', i.data->>'language', 'baby_name', i.data->>'baby_name', 'event_date', i.data->>'event_date',
      'frame', i.data->'images'->>'frame', 'theme', i.data->'theme',
      'responses', (select count(*) from rsvps r where r.invitation_id = i.id and not r.deleted),
      'attending', (select coalesce(sum(r.guests), 0) from rsvps r where r.invitation_id = i.id and not r.deleted and r.attending)
    ) order by i.archived, i.created_at)
    from invitations i
  ), '[]'::jsonb);
end $$;

-- the admin token check for server routes (domain creation, video upload) without loading data
create or replace function public.admin_whoami(p_token text)
returns boolean language plpgsql stable security definer set search_path = public as $$
begin
  perform _admin_check(p_token);
  return true;
end $$;
