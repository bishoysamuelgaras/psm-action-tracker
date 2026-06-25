-- IMPORTANT:
-- 1) Create your first user first from Authentication > Users
-- 2) Replace the email below with your real email
-- 3) Run this query once

update public.profiles
set
  role_code = 'admin',
  updated_at = timezone('utc', now())
where lower(email) = lower('your.name@anrpc.com');

select id, full_name, email, role_code
from public.profiles
where lower(email) = lower('your.name@anrpc.com');
