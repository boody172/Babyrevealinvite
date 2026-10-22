-- Baby reveal invitation: full schema. Idempotent, safe to re-run.
-- Security model: every table has RLS on with no policies, so the public key can't touch them.
-- Guests reach data only through get_site / submit_rsvp / get_asset; admin_* need a session token.

create extension if not exists pgcrypto with schema extensions;

-- ---------- tables ----------
create table if not exists public.site_settings (
  id int primary key default 1 check (id = 1),
  data jsonb not null default '{}'::jsonb,
  secret_gender text check (secret_gender in ('boy','girl')),
  revealed boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.rsvps (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  phone text check (phone is null or char_length(phone) <= 30),
  attending boolean not null default true,
  guests int not null default 1 check (guests between 0 and 20),
  guess text not null check (guess in ('boy','girl')),
  message text check (message is null or char_length(message) <= 500),
  show_message boolean not null default true,
  deleted boolean not null default false,
  device_id text unique,
  created_at timestamptz not null default now()
);
alter table public.rsvps add column if not exists deleted boolean not null default false;

create table if not exists public.admin_account (
  id int primary key default 1 check (id = 1),
  password_hash text not null
);

create table if not exists public.admin_sessions (
  token text primary key,
  expires_at timestamptz not null
);

create table if not exists public.assets (
  key text primary key check (key ~ '^[a-z_]{1,32}$'),
  mime text not null check (mime in ('image/webp','image/jpeg','image/png')),
  data text not null check (char_length(data) <= 2000000),
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;
alter table public.rsvps enable row level security;
alter table public.admin_account enable row level security;
alter table public.admin_sessions enable row level security;
alter table public.assets enable row level security;
revoke all on all tables in schema public from anon, authenticated;

insert into public.site_settings (id) values (1) on conflict (id) do nothing;

-- ---------- helpers ----------
create or replace function public._admin_check(p_token text)
returns void language plpgsql stable security definer set search_path = public as $$
begin
  if p_token is null or not exists (
    select 1 from admin_sessions where token = p_token and expires_at > now()
  ) then
    raise exception 'unauthorized' using errcode = '28000';
  end if;
end $$;
revoke all on function public._admin_check(text) from public, anon, authenticated;

-- ---------- public ----------
create or replace function public.get_site(p_device text default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare s site_settings; boys int; girls int; res jsonb; mine jsonb;
begin
  select * into s from site_settings where id = 1;
  select count(*) filter (where guess = 'boy'), count(*) filter (where guess = 'girl')
    into boys, girls from rsvps where not deleted;
  res := jsonb_build_object('settings', s.data, 'revealed', s.revealed);
  -- the secret gender never leaves the database before the reveal
  if s.revealed then res := res || jsonb_build_object('gender', s.secret_gender); end if;
  if coalesce((s.data->>'show_results')::boolean, true) or s.revealed then
    res := res || jsonb_build_object('votes', jsonb_build_object('boy', boys, 'girl', girls));
  end if;
  if coalesce((s.data->>'show_wishes')::boolean, true) then
    res := res || jsonb_build_object('wishes', coalesce((
      select jsonb_agg(jsonb_build_object('name', w.name, 'message', w.message, 'guess', w.guess) order by w.created_at desc)
      from (select * from rsvps where not deleted and show_message and coalesce(message, '') <> ''
            order by created_at desc limit 60) w
    ), '[]'::jsonb));
  end if;
  if p_device is not null then
    select jsonb_build_object('name', name, 'guess', guess, 'attending', attending) into mine
      from rsvps where device_id = p_device and not deleted;
    res := res || jsonb_build_object('mine', mine);
  end if;
  return res;
end $$;

create or replace function public.submit_rsvp(
  p_name text, p_phone text, p_attending boolean, p_guests int, p_guess text, p_message text, p_device text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s jsonb;
begin
  select data into s from site_settings where id = 1;
  if not coalesce((s->>'rsvp_open')::boolean, true) then raise exception 'rsvp_closed'; end if;
  if p_device is null or char_length(p_device) < 8 then raise exception 'invalid_device'; end if;
  if exists (select 1 from rsvps where device_id = p_device and not deleted) then
    raise exception 'already_submitted';
  end if;
  update rsvps set device_id = null where device_id = p_device and deleted;
  insert into rsvps (name, phone, attending, guests, guess, message, device_id)
  values (trim(p_name), nullif(trim(p_phone), ''), p_attending,
          case when p_attending then greatest(1, least(coalesce(p_guests, 1), 20)) else 0 end,
          p_guess, nullif(trim(p_message), ''), p_device);
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.get_asset(p_key text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('mime', mime, 'data', data) from assets where key = p_key;
$$;

-- ---------- admin ----------
create or replace function public.admin_login(p_password text)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare h text; t text;
begin
  select password_hash into h from admin_account where id = 1;
  if h is null or extensions.crypt(p_password, h) <> h then raise exception 'invalid_password'; end if;
  t := encode(extensions.gen_random_bytes(32), 'hex');
  insert into admin_sessions (token, expires_at) values (t, now() + interval '7 days');
  return t;
end $$;

create or replace function public.admin_logout(p_token text)
returns void language sql security definer set search_path = public as $$
  update admin_sessions set expires_at = now() where token = p_token;
$$;

create or replace function public.admin_get_all(p_token text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s site_settings;
begin
  perform _admin_check(p_token);
  select * into s from site_settings where id = 1;
  return jsonb_build_object(
    'settings', s.data, 'secret_gender', s.secret_gender, 'revealed', s.revealed,
    'rsvps', coalesce((select jsonb_agg(to_jsonb(r) - 'device_id' order by r.created_at desc) from rsvps r), '[]'::jsonb));
end $$;

create or replace function public.admin_update_settings(p_token text, p_data jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform _admin_check(p_token);
  update site_settings set data = p_data, updated_at = now() where id = 1;
end $$;

create or replace function public.admin_set_reveal(p_token text, p_gender text, p_revealed boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform _admin_check(p_token);
  if p_revealed and p_gender is null then raise exception 'gender_required'; end if;
  update site_settings set secret_gender = p_gender, revealed = p_revealed, updated_at = now() where id = 1;
end $$;

create or replace function public.admin_save_rsvp(p_token text, p_rsvp jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform _admin_check(p_token);
  if (p_rsvp->>'id') is not null then
    update rsvps set
      name = p_rsvp->>'name', phone = nullif(p_rsvp->>'phone', ''),
      attending = (p_rsvp->>'attending')::boolean, guests = (p_rsvp->>'guests')::int,
      guess = p_rsvp->>'guess', message = nullif(p_rsvp->>'message', ''),
      show_message = coalesce((p_rsvp->>'show_message')::boolean, true)
    where id = (p_rsvp->>'id')::uuid;
  else
    insert into rsvps (name, phone, attending, guests, guess, message, show_message)
    values (p_rsvp->>'name', nullif(p_rsvp->>'phone', ''), (p_rsvp->>'attending')::boolean,
            (p_rsvp->>'guests')::int, p_rsvp->>'guess', nullif(p_rsvp->>'message', ''),
            coalesce((p_rsvp->>'show_message')::boolean, true));
  end if;
end $$;

-- soft delete: p_deleted=false restores
create or replace function public.admin_remove_rsvp(p_token text, p_id uuid, p_deleted boolean default true)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform _admin_check(p_token);
  update rsvps set deleted = p_deleted where id = p_id;
end $$;

create or replace function public.admin_set_asset(p_token text, p_key text, p_mime text, p_data text)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform _admin_check(p_token);
  insert into assets (key, mime, data, updated_at) values (p_key, p_mime, p_data, now())
  on conflict (key) do update set mime = excluded.mime, data = excluded.data, updated_at = now();
end $$;

create or replace function public.admin_change_password(p_token text, p_old text, p_new text)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare h text;
begin
  perform _admin_check(p_token);
  select password_hash into h from admin_account where id = 1;
  if extensions.crypt(p_old, h) <> h then raise exception 'invalid_password'; end if;
  if char_length(p_new) < 8 then raise exception 'password_too_short'; end if;
  update admin_account set password_hash = extensions.crypt(p_new, extensions.gen_salt('bf')) where id = 1;
  update admin_sessions set expires_at = now() where token <> p_token;
end $$;
