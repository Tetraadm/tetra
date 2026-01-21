-- 10_gdpr_cron.sql

-- Enable pg_cron extension (requires supported plan)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Schedule monthly cleanup (1st of each month at 02:00 UTC)
-- Retains logs for 90 days.
SELECT cron.schedule(
  'gdpr-retention-cleanup',
  '0 2 1 * *',
  $$SELECT * FROM public.cleanup_all_old_logs(90)$$
);
