-- New tables in public should not be world-readable by default.
-- Existing grants and RLS policies on profiles and user_items are unchanged.
alter default privileges in schema public
  revoke select on tables from anon;
