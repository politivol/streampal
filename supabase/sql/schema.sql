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
  list text not null,
  payload jsonb,
  created_at timestamp with time zone default now()
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
