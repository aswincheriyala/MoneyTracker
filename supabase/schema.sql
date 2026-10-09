create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.money_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.money_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  note_id uuid not null references public.money_notes(id) on delete cascade,
  title text not null,
  amount_paise bigint not null check (amount_paise > 0),
  description text,
  status text not null default 'PENDING' check (status in ('PENDING', 'PAID', 'CANCELLED')),
  paid_at timestamptz,
  payment_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_money_notes_user_updated on public.money_notes (user_id, updated_at desc);
create index if not exists idx_money_entries_user_note on public.money_entries (user_id, note_id);
create index if not exists idx_money_entries_status on public.money_entries (user_id, status);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_money_notes_updated_at
before update on public.money_notes
for each row
execute function public.set_updated_at();

create trigger set_money_entries_updated_at
before update on public.money_entries
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.money_notes enable row level security;
alter table public.money_entries enable row level security;

create policy "Profiles are private to owner" on public.profiles
for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "Notes are private to owner" on public.money_notes
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Entries are private to owner" on public.money_entries
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
