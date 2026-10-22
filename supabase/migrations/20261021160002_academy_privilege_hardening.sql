-- Academy Core privilege hardening.
--
-- Supabase project defaults may grant broader Data API privileges than the
-- Academy RLS contract intends. Clear authenticated privileges first, then
-- restore only the operations Academy Core supports. RLS remains authoritative
-- for row-level access.

revoke all
  on table public.academy_courses,
           public.academy_modules,
           public.academy_lessons,
           public.academy_cohorts,
           public.academy_enrollments,
           public.academy_lesson_progress,
           public.academy_evidence,
           public.academy_certificates
  from anon, authenticated;

grant select, insert, update
  on table public.academy_courses,
           public.academy_modules,
           public.academy_lessons,
           public.academy_cohorts,
           public.academy_enrollments,
           public.academy_lesson_progress,
           public.academy_evidence,
           public.academy_certificates
  to authenticated;

grant all
  on table public.academy_courses,
           public.academy_modules,
           public.academy_lessons,
           public.academy_cohorts,
           public.academy_enrollments,
           public.academy_lesson_progress,
           public.academy_evidence,
           public.academy_certificates
  to service_role;

comment on table public.academy_courses is
  'Academy course authority. Data API privileges are explicitly narrowed by 20261021160002; RLS remains the row-level authorization boundary.';
