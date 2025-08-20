-- Profiles table stores user information.
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable Row Level Security and policies for profiles
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone" on profiles
  for select
  using (true);

create policy "Users can insert their own profile" on profiles
  for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile" on profiles
  for update
  using (auth.uid() = id);

-- Table for items saved by users
create table if not exists user_items (
  id bigserial primary key,
  user_id uuid references auth.users on delete cascade,
  tmdb_id text not null,
  item_type text not null,
  list text not null check (list in ('seen', 'pinned')),
  payload jsonb,
  created_at timestamp with time zone default now(),
  unique (user_id, tmdb_id, list)
);

-- Enable Row Level Security and policies for user_items
alter table user_items enable row level security;

create policy "Users can view their own items" on user_items
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own items" on user_items
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own items" on user_items
  for update
  using (auth.uid() = user_id);

create policy "Users can delete their own items" on user_items
  for delete
  using (auth.uid() = user_id);

-- Privileges for API roles (no superuser grants)
-- Allow API roles to use the public schema
grant usage on schema public to anon, authenticated;

-- Existing tables: explicit privileges
grant select on table profiles to anon; -- public profiles read access per policy
grant select, insert, update, delete on table profiles to authenticated;
grant select, insert, update, delete on table user_items to authenticated;

-- Sequences (for bigserial IDs)
grant usage, select on all sequences in schema public to authenticated;

-- Default privileges for future tables/sequences created in public
alter default privileges in schema public
  grant select on tables to anon;
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant usage, select on sequences to authenticated;
