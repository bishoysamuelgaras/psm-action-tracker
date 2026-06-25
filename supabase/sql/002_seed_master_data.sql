begin;

insert into public.app_roles (code, name, description)
values
  ('admin', 'Admin', 'Full access to setup, master data, tracking, and reporting.'),
  ('psm_manager', 'PSM Manager', 'Manages sources, recommendations, actions, verification, and reports.'),
  ('action_owner', 'Action Owner', 'Responsible for following up and updating assigned actions.'),
  ('viewer', 'Viewer', 'Read-only access to the internal tracker.')
on conflict (code) do update
set
  name = excluded.name,
  description = excluded.description,
  updated_at = timezone('utc', now());

insert into public.priority_levels (code, name, sort_order, tone, sla_days)
values
  ('low', 'Low', 10, 'slate', 90),
  ('medium', 'Medium', 20, 'blue', 60),
  ('high', 'High', 30, 'amber', 30),
  ('critical', 'Critical', 40, 'red', 7)
on conflict (code) do update
set
  name = excluded.name,
  sort_order = excluded.sort_order,
  tone = excluded.tone,
  sla_days = excluded.sla_days,
  updated_at = timezone('utc', now());

insert into public.action_statuses (
  code,
  name,
  sort_order,
  tone,
  is_terminal,
  requires_completion_date,
  requires_verification_date
)
values
  ('draft', 'Draft', 10, 'slate', false, false, false),
  ('open', 'Open', 20, 'blue', false, false, false),
  ('in_progress', 'In Progress', 30, 'amber', false, false, false),
  ('pending_verification', 'Pending Verification', 40, 'purple', false, true, false),
  ('closed', 'Closed', 50, 'green', true, true, false),
  ('verified', 'Verified', 60, 'emerald', true, true, true),
  ('on_hold', 'On Hold', 70, 'orange', false, false, false),
  ('cancelled', 'Cancelled', 80, 'zinc', true, false, false)
on conflict (code) do update
set
  name = excluded.name,
  sort_order = excluded.sort_order,
  tone = excluded.tone,
  is_terminal = excluded.is_terminal,
  requires_completion_date = excluded.requires_completion_date,
  requires_verification_date = excluded.requires_verification_date,
  updated_at = timezone('utc', now());

insert into public.source_types (code, name, sort_order)
values
  ('incident_investigation', 'Incident Investigation', 10),
  ('audit', 'Audit', 20),
  ('committee', 'Committee', 30),
  ('inspection', 'Inspection', 40),
  ('management_review', 'Management Review', 50),
  ('psm_review', 'PSM Review', 60)
on conflict (code) do update
set
  name = excluded.name,
  sort_order = excluded.sort_order,
  updated_at = timezone('utc', now());

insert into public.recommendation_categories (code, name, sort_order)
values
  ('process', 'Process', 10),
  ('mechanical', 'Mechanical', 20),
  ('instrument', 'Instrument', 30),
  ('electrical', 'Electrical', 40),
  ('operation', 'Operation', 50),
  ('maintenance', 'Maintenance', 60),
  ('procedure', 'Procedure', 70),
  ('training', 'Training', 80),
  ('safety', 'Safety', 90),
  ('management_system', 'Management System', 100)
on conflict (code) do update
set
  name = excluded.name,
  sort_order = excluded.sort_order,
  updated_at = timezone('utc', now());

insert into public.departments (code, name)
values
  ('PSM', 'Process Safety Management'),
  ('OPS', 'Operations'),
  ('PROC', 'Process Engineering'),
  ('MECH', 'Mechanical Maintenance'),
  ('INST', 'Instrumentation & Control'),
  ('ELEC', 'Electrical Maintenance'),
  ('HSE', 'HSE'),
  ('INSP', 'Inspection'),
  ('PROJ', 'Projects'),
  ('UTIL', 'Utilities')
on conflict (code) do update
set
  name = excluded.name,
  updated_at = timezone('utc', now());

commit;
