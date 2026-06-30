-- SoruBank cloud sync schema
-- Run this file in Supabase Dashboard > SQL Editor.

create table if not exists public.sorubank_cloud_states (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.sorubank_cloud_states enable row level security;

drop policy if exists "Users can read own SoruBank state" on public.sorubank_cloud_states;
create policy "Users can read own SoruBank state"
  on public.sorubank_cloud_states
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own SoruBank state" on public.sorubank_cloud_states;
create policy "Users can insert own SoruBank state"
  on public.sorubank_cloud_states
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own SoruBank state" on public.sorubank_cloud_states;
create policy "Users can update own SoruBank state"
  on public.sorubank_cloud_states
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('sorubank-files', 'sorubank-files', false)
on conflict (id) do nothing;

drop policy if exists "Users can read own SoruBank files" on storage.objects;
create policy "Users can read own SoruBank files"
  on storage.objects
  for select
  using (
    bucket_id = 'sorubank-files'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can upload own SoruBank files" on storage.objects;
create policy "Users can upload own SoruBank files"
  on storage.objects
  for insert
  with check (
    bucket_id = 'sorubank-files'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can update own SoruBank files" on storage.objects;
create policy "Users can update own SoruBank files"
  on storage.objects
  for update
  using (
    bucket_id = 'sorubank-files'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'sorubank-files'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can delete own SoruBank files" on storage.objects;
create policy "Users can delete own SoruBank files"
  on storage.objects
  for delete
  using (
    bucket_id = 'sorubank-files'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
