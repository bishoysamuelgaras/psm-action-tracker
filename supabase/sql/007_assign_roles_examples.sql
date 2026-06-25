-- Step 3 helper file
-- Use these examples after creating users from Supabase Authentication.
-- Run one query at a time after replacing the sample email values.

-- Example 1: promote a user to PSM Manager
update public.profiles
set role_code = 'psm_manager',
    full_name = 'Replace With Real Name',
    job_title = 'PSM Manager',
    updated_at = now()
where lower(email) = lower('manager@anrpc.com');

-- Example 2: assign a user as Action Owner
update public.profiles
set role_code = 'action_owner',
    full_name = 'Replace With Real Name',
    job_title = 'Action Owner',
    updated_at = now()
where lower(email) = lower('owner@anrpc.com');

-- Example 3: leave a user as viewer but set display fields
update public.profiles
set role_code = 'viewer',
    full_name = 'Replace With Real Name',
    job_title = 'Viewer',
    updated_at = now()
where lower(email) = lower('viewer@anrpc.com');

-- Example 4: deactivate a profile temporarily
update public.profiles
set is_active = false,
    updated_at = now()
where lower(email) = lower('someone@anrpc.com');
