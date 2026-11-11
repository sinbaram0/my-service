-- Run as the migration administrator. Every test row is rolled back.
begin;
do $$
declare
  a record;
  b record;
  row_a bigint;
  row_b bigint;
  n integer;
  signup_id uuid := gen_random_uuid();
begin
  select * into strict a from public.app_users order by user_id limit 1;
  select * into strict b from public.app_users where user_id <> a.user_id order by user_id limit 1;

  -- Exercise the real signup trigger without passwords, tokens, or a lasting account.
  insert into auth.users(id) values (signup_id);
  if not exists (select 1 from public.app_users where auth_user_id=signup_id
    and user_id between 1000001 and 9999999) then
    raise exception 'New account did not receive a numeric ID';
  end if;

  perform set_config('request.jwt.claim.sub',a.auth_user_id::text,true);
  set local role authenticated;
  select count(*) into n from public.app_users;
  if n<>1 then raise exception 'Mapping privacy failed for A'; end if;
  if exists(select 1 from public.todos where user_id is null) then raise exception 'Legacy rows visible'; end if;
  insert into public.todos(title,user_id) values ('RLS numeric A',a.user_id) returning id into row_a;
  if not exists(select 1 from public.todos where id=row_a) then raise exception 'Own select failed'; end if;
  update public.todos set is_done=true where id=row_a;
  get diagnostics n=row_count;
  if n<>1 then raise exception 'Own update failed'; end if;

  begin
    insert into public.todos(title,user_id) values ('Must reject',b.user_id);
    raise exception 'Foreign insert accepted';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.todos(title,user_id) values ('Must reject',null);
    raise exception 'Unowned insert accepted';
  exception when insufficient_privilege then null; end;
  begin
    update public.todos set user_id=b.user_id where id=row_a;
    raise exception 'Ownership transfer accepted';
  exception when insufficient_privilege then null; end;
  begin
    update public.app_users set auth_user_id=b.auth_user_id where user_id=a.user_id;
    raise exception 'Mapping rewrite accepted';
  exception when insufficient_privilege then null; end;

  perform set_config('request.jwt.claim.sub',b.auth_user_id::text,true);
  if exists(select 1 from public.app_users where user_id=a.user_id) then raise exception 'Other mapping visible'; end if;
  if exists(select 1 from public.todos where id=row_a) then raise exception 'B sees A'; end if;
  update public.todos set is_done=false where id=row_a;
  get diagnostics n=row_count;
  if n<>0 then raise exception 'B changed A'; end if;
  delete from public.todos where id=row_a;
  get diagnostics n=row_count;
  if n<>0 then raise exception 'B deleted A'; end if;
  insert into public.todos(title,user_id) values ('RLS numeric B',b.user_id) returning id into row_b;
  if not exists(select 1 from public.todos where id=row_b) then raise exception 'B own select failed'; end if;

  perform set_config('request.jwt.claim.sub',a.auth_user_id::text,true);
  if exists(select 1 from public.todos where id=row_b) then raise exception 'A sees B'; end if;
  delete from public.todos where id=row_a;
  get diagnostics n=row_count;
  if n<>1 then raise exception 'Own delete failed'; end if;
  reset role;

  set local role anon;
  begin
    perform 1 from public.todos;
    raise exception 'Anonymous read accepted';
  exception when insufficient_privilege then null; end;
  begin
    perform 1 from public.app_users;
    raise exception 'Anonymous mapping read accepted';
  exception when insufficient_privilege then null; end;
  reset role;
  if has_table_privilege('anon','public.todos','INSERT')
    or has_table_privilege('anon','public.todos','UPDATE')
    or has_table_privilege('anon','public.todos','DELETE') then
    raise exception 'Anonymous write privileges remain';
  end if;
end $$;
rollback;
select 'Numeric ownership, two-account RLS, anonymous blocking, mapping protection, and signup trigger passed; test rows rolled back.' as result;
