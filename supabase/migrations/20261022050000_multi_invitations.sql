-- Multiple invitations on one site: each has its own link (slug), content, design, secret and RSVPs.
-- Idempotent. No destructive statements: the old single-invite functions become wrappers
-- around the "home" invitation, so older deployments keep working.

-- ---------- tables ----------
create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    check (slug ~ '^[a-z0-9][a-z0-9-]{1,39}$' and slug not in ('admin', 'api', 'img', 'og', 'icon')),
  name text not null check (char_length(name) between 1 and 80),
  data jsonb not null default '{}'::jsonb,
  secret_gender text check (secret_gender in ('boy','girl')),
  revealed boolean not null default false,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_config (
  id int primary key default 1 check (id = 1),
  home_invitation uuid references public.invitations(id)
);

-- shared image library (backgrounds, bears, ...) usable by any invitation
create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  label text not null default '',
  mime text not null check (mime in ('image/webp','image/jpeg','image/png')),
  data text not null check (char_length(data) <= 2000000),
  created_at timestamptz not null default now()
);

alter table public.rsvps add column if not exists invitation_id uuid references public.invitations(id);
alter table public.rsvps add column if not exists device text;
create unique index if not exists rsvps_invitation_device_key on public.rsvps (invitation_id, device);
create index if not exists rsvps_invitation_idx on public.rsvps (invitation_id, created_at desc);

alter table public.invitations enable row level security;
alter table public.app_config enable row level security;
alter table public.media enable row level security;
revoke all on all tables in schema public from anon, authenticated;

-- ---------- move the existing single invitation in ----------
insert into public.invitations (slug, name, data, secret_gender, revealed)
select 'hofuf', 'دعوة الهفوف', s.data, s.secret_gender, s.revealed
from public.site_settings s
where s.id = 1 and not exists (select 1 from public.invitations);

insert into public.app_config (id, home_invitation)
select 1, id from public.invitations order by created_at limit 1
on conflict (id) do nothing;

update public.rsvps set invitation_id = (select home_invitation from public.app_config where id = 1)
where invitation_id is null;
update public.rsvps set device = device_id where device is null and device_id is not null;

-- ---------- helpers ----------
create or replace function public._invitation(p_slug text)
returns public.invitations language sql stable security definer set search_path = public as $$
  select i.* from invitations i
  where not i.archived
    and (case when coalesce(p_slug, '') = '' then i.id = (select home_invitation from app_config where id = 1)
              else i.slug = lower(p_slug) end)
  limit 1;
$$;
revoke all on function public._invitation(text) from public, anon, authenticated;

-- ---------- public ----------
create or replace function public.invite_get(p_slug text default null, p_device text default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare i invitations; boys int; girls int; res jsonb; mine jsonb;
begin
  i := _invitation(p_slug);
  if i.id is null then return null; end if;
  select count(*) filter (where guess = 'boy'), count(*) filter (where guess = 'girl')
    into boys, girls from rsvps where invitation_id = i.id and not deleted;
  res := jsonb_build_object('slug', i.slug, 'settings', i.data, 'revealed', i.revealed);
  -- the secret gender never leaves the database before the reveal
  if i.revealed then res := res || jsonb_build_object('gender', i.secret_gender); end if;
  if coalesce((i.data->>'show_results')::boolean, true) or i.revealed then
    res := res || jsonb_build_object('votes', jsonb_build_object('boy', boys, 'girl', girls));
  end if;
  if coalesce((i.data->>'show_wishes')::boolean, true) then
    res := res || jsonb_build_object('wishes', coalesce((
      select jsonb_agg(jsonb_build_object('name', w.name, 'message', w.message, 'guess', w.guess) order by w.created_at desc)
      from (select * from rsvps where invitation_id = i.id and not deleted and show_message and coalesce(message, '') <> ''
            order by created_at desc limit 60) w
    ), '[]'::jsonb));
  end if;
  if p_device is not null then
    select jsonb_build_object('name', name, 'guess', guess, 'attending', attending) into mine
      from rsvps where invitation_id = i.id and device = p_device and not deleted;
    res := res || jsonb_build_object('mine', mine);
  end if;
  return res;
end $$;

create or replace function public.invite_rsvp(
  p_slug text, p_name text, p_phone text, p_attending boolean, p_guests int, p_guess text, p_message text, p_device text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare i invitations;
begin
  i := _invitation(p_slug);
  if i.id is null then raise exception 'not_found'; end if;
  if not coalesce((i.data->>'rsvp_open')::boolean, true) or i.revealed then raise exception 'rsvp_closed'; end if;
  if p_device is null or char_length(p_device) < 8 then raise exception 'invalid_device'; end if;
  if exists (select 1 from rsvps where invitation_id = i.id and device = p_device and not deleted) then
    raise exception 'already_submitted';
  end if;
  update rsvps set device = null where invitation_id = i.id and device = p_device and deleted;
  insert into rsvps (invitation_id, name, phone, attending, guests, guess, message, device)
  values (i.id, trim(p_name), nullif(trim(p_phone), ''), p_attending,
          case when p_attending then greatest(1, least(coalesce(p_guests, 1), 20)) else 0 end,
          p_guess, nullif(trim(p_message), ''), p_device);
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.get_media(p_id uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('mime', mime, 'data', data) from media where id = p_id;
$$;

-- ---------- admin: invitations ----------
create or replace function public.admin_invitations(p_token text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  perform _admin_check(p_token);
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', i.id, 'slug', i.slug, 'name', i.name, 'archived', i.archived,
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

create or replace function public.admin_invitation(p_token text, p_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare i invitations;
begin
  perform _admin_check(p_token);
  select * into i from invitations where id = p_id;
  if i.id is null then raise exception 'not_found'; end if;
  return jsonb_build_object(
    'invitation', jsonb_build_object('id', i.id, 'slug', i.slug, 'name', i.name, 'archived', i.archived,
                                     'is_home', i.id = (select home_invitation from app_config where id = 1)),
    'settings', i.data, 'secret_gender', i.secret_gender, 'revealed', i.revealed,
    'rsvps', coalesce((select jsonb_agg(to_jsonb(r) - 'device_id' - 'device' order by r.created_at desc)
                       from rsvps r where r.invitation_id = i.id), '[]'::jsonb));
end $$;

-- p_copy_from: duplicate another invitation's content and design (never its guests or secret)
create or replace function public.admin_invitation_create(p_token text, p_name text, p_slug text, p_data jsonb, p_copy_from uuid default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare new_id uuid; src jsonb;
begin
  perform _admin_check(p_token);
  if p_copy_from is not null then select data into src from invitations where id = p_copy_from; end if;
  if exists (select 1 from invitations where slug = lower(trim(p_slug))) then raise exception 'slug_taken'; end if;
  insert into invitations (name, slug, data) values (trim(p_name), lower(trim(p_slug)), coalesce(src, p_data, '{}'::jsonb))
  returning id into new_id;
  insert into app_config (id, home_invitation) values (1, new_id) on conflict (id) do nothing;
  return new_id;
end $$;

create or replace function public.admin_invitation_update(p_token text, p_id uuid, p_name text, p_slug text, p_data jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform _admin_check(p_token);
  if exists (select 1 from invitations where slug = lower(trim(p_slug)) and id <> p_id) then raise exception 'slug_taken'; end if;
  update invitations set name = trim(p_name), slug = lower(trim(p_slug)), data = p_data, updated_at = now() where id = p_id;
end $$;

create or replace function public.admin_invitation_archive(p_token text, p_id uuid, p_archived boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform _admin_check(p_token);
  if p_archived and p_id = (select home_invitation from app_config where id = 1) then raise exception 'home_cannot_archive'; end if;
  update invitations set archived = p_archived, updated_at = now() where id = p_id;
end $$;

create or replace function public.admin_set_home(p_token text, p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform _admin_check(p_token);
  update invitations set archived = false where id = p_id;
  insert into app_config (id, home_invitation) values (1, p_id)
  on conflict (id) do update set home_invitation = excluded.home_invitation;
end $$;

create or replace function public.admin_invitation_reveal(p_token text, p_id uuid, p_gender text, p_revealed boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform _admin_check(p_token);
  if p_revealed and p_gender is null then raise exception 'gender_required'; end if;
  update invitations set secret_gender = p_gender, revealed = p_revealed, updated_at = now() where id = p_id;
end $$;

create or replace function public.admin_rsvp_save(p_token text, p_invitation uuid, p_rsvp jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform _admin_check(p_token);
  if (p_rsvp->>'id') is not null then
    update rsvps set
      name = p_rsvp->>'name', phone = nullif(p_rsvp->>'phone', ''),
      attending = (p_rsvp->>'attending')::boolean, guests = (p_rsvp->>'guests')::int,
      guess = p_rsvp->>'guess', message = nullif(p_rsvp->>'message', ''),
      show_message = coalesce((p_rsvp->>'show_message')::boolean, true)
    where id = (p_rsvp->>'id')::uuid and invitation_id = p_invitation;
  else
    insert into rsvps (invitation_id, name, phone, attending, guests, guess, message, show_message)
    values (p_invitation, p_rsvp->>'name', nullif(p_rsvp->>'phone', ''), (p_rsvp->>'attending')::boolean,
            (p_rsvp->>'guests')::int, p_rsvp->>'guess', nullif(p_rsvp->>'message', ''),
            coalesce((p_rsvp->>'show_message')::boolean, true));
  end if;
end $$;

-- ---------- admin: media library ----------
create or replace function public.admin_media_upload(p_token text, p_label text, p_mime text, p_data text)
returns uuid language plpgsql security definer set search_path = public as $$
declare new_id uuid;
begin
  perform _admin_check(p_token);
  insert into media (label, mime, data) values (coalesce(p_label, ''), p_mime, p_data) returning id into new_id;
  return new_id;
end $$;

create or replace function public.admin_media_list(p_token text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  perform _admin_check(p_token);
  return coalesce((select jsonb_agg(jsonb_build_object('id', id, 'label', label, 'size', char_length(data) * 3 / 4, 'created_at', created_at)
                                    order by created_at desc) from media), '[]'::jsonb);
end $$;

-- ---------- old single-invite API, now pointing at the home invitation ----------
create or replace function public.get_site(p_device text default null)
returns jsonb language sql stable security definer set search_path = public as $$
  select public.invite_get(null, p_device);
$$;

create or replace function public.submit_rsvp(
  p_name text, p_phone text, p_attending boolean, p_guests int, p_guess text, p_message text, p_device text)
returns jsonb language sql security definer set search_path = public as $$
  select public.invite_rsvp(null, p_name, p_phone, p_attending, p_guests, p_guess, p_message, p_device);
$$;

create or replace function public.admin_get_all(p_token text)
returns jsonb language sql stable security definer set search_path = public as $$
  select public.admin_invitation(p_token, (select home_invitation from app_config where id = 1)) - 'invitation';
$$;

create or replace function public.admin_update_settings(p_token text, p_data jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform _admin_check(p_token);
  update invitations set data = p_data, updated_at = now() where id = (select home_invitation from app_config where id = 1);
end $$;

create or replace function public.admin_set_reveal(p_token text, p_gender text, p_revealed boolean)
returns void language sql security definer set search_path = public as $$
  select public.admin_invitation_reveal(p_token, (select home_invitation from app_config where id = 1), p_gender, p_revealed);
$$;

create or replace function public.admin_save_rsvp(p_token text, p_rsvp jsonb)
returns void language sql security definer set search_path = public as $$
  select public.admin_rsvp_save(p_token, (select home_invitation from app_config where id = 1), p_rsvp);
$$;
