-- Apply once through a Supabase migration, atomically. No credentials or account IDs.
-- Existing unknown owners remain NULL. No todo or auth user is deleted.
lock table auth.users in share row exclusive mode;
lock table public.todos in access exclusive mode;

create table public.app_users (
  user_id integer generated always as identity
    (start with 1000001 minvalue 1000001 maxvalue 9999999 no cycle) primary key,
  auth_user_id uuid not null unique references auth.users(id),
  constraint app_users_user_id_range check (user_id between 1000001 and 9999999)
);
comment on table public.app_users is 'Stable numeric user IDs for application tables; UUID is used only for the Auth connection.';
alter table public.app_users enable row level security;
revoke all privileges on table public.app_users from public, anon, authenticated;
revoke all privileges on sequence public.app_users_user_id_seq from public, anon, authenticated;
grant select on table public.app_users to authenticated, service_role;
create policy app_users_owner_select on public.app_users
  for select to authenticated using (auth_user_id = (select auth.uid()));

-- Assign existing accounts deterministically, without reading passwords or tokens.
insert into public.app_users(auth_user_id)
select id from auth.users order by created_at, id;

-- Snapshot for an in-transaction assertion that content and ownership are preserved.
create temporary table todos_numeric_snapshot on commit drop as
select t.id, t.title, t.is_done, t.created_at, u.user_id as expected_user_id
from public.todos t left join public.app_users u on u.auth_user_id = t.user_id;
do $$
begin
  if exists (
    select 1 from public.todos t
    left join public.app_users u on u.auth_user_id = t.user_id
    where t.user_id is not null and u.user_id is null
  ) then raise exception 'Unmapped owner: migration aborted'; end if;
end $$;

drop policy todos_owner_select on public.todos;
drop policy todos_owner_insert on public.todos;
drop policy todos_owner_update on public.todos;
drop policy todos_owner_delete on public.todos;
alter table public.todos drop constraint todos_user_id_fkey;

-- Temporary conversion helper; never exposed as a persistent API function.
create function pg_temp.todo_numeric_owner(owner_uuid uuid)
returns integer language sql stable strict
set search_path = ''
as $$ select user_id from public.app_users where auth_user_id = owner_uuid $$;
alter table public.todos alter column user_id type integer
  using pg_temp.todo_numeric_owner(user_id);
drop function pg_temp.todo_numeric_owner(uuid);
alter table public.todos add constraint todos_user_id_fkey
  foreign key (user_id) references public.app_users(user_id);
comment on column public.todos.user_id is 'Numeric owner ID referencing app_users.user_id. NULL preserves legacy rows of unknown ownership.';

-- The subquery is scoped by both auth.uid() and app_users RLS.
create policy todos_owner_select on public.todos for select to authenticated
  using (user_id = (select user_id from public.app_users where auth_user_id = (select auth.uid())));
create policy todos_owner_insert on public.todos for insert to authenticated
  with check (user_id = (select user_id from public.app_users where auth_user_id = (select auth.uid())));
create policy todos_owner_update on public.todos for update to authenticated
  using (user_id = (select user_id from public.app_users where auth_user_id = (select auth.uid())))
  with check (user_id = (select user_id from public.app_users where auth_user_id = (select auth.uid())));
create policy todos_owner_delete on public.todos for delete to authenticated
  using (user_id = (select user_id from public.app_users where auth_user_id = (select auth.uid())));
alter table public.todos enable row level security;
revoke all privileges on table public.todos from public, anon;
grant select, insert, update, delete on table public.todos to authenticated;
revoke all privileges on sequence public.todos_id_seq from public, anon;
grant usage on sequence public.todos_id_seq to authenticated;

-- Trigger-only privileged function in a non-exposed schema. Clients cannot call it
-- or write mappings themselves. NEW.id comes from Auth, never user metadata.
create schema if not exists private;
create function private.assign_app_user_id()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.app_users(auth_user_id) values (new.id);
  return new;
end;
$$;
revoke all privileges on function private.assign_app_user_id() from public, anon, authenticated;
create trigger assign_app_user_id_after_signup
after insert on auth.users for each row execute function private.assign_app_user_id();

do $$
begin
  if exists (
    (select id, title, is_done, created_at, expected_user_id from todos_numeric_snapshot
     except select id, title, is_done, created_at, user_id from public.todos)
    union all
    (select id, title, is_done, created_at, user_id from public.todos
     except select id, title, is_done, created_at, expected_user_id from todos_numeric_snapshot)
  ) then raise exception 'Data preservation assertion failed'; end if;
end $$;
notify pgrst, 'reload schema';
