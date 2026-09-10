-- Allow same employee NIK across different companies.
-- Also add AMG (Aditya Mandiri Garmindo) used by HR employee lookup.

INSERT INTO public.companies (code, name, short_name)
SELECT 'amg', 'PT. Aditya Mandiri Garmindo', 'AMG'
WHERE NOT EXISTS (
  SELECT 1 FROM public.companies WHERE lower(code) = 'amg'
);

ALTER TABLE public.registration_otps
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

ALTER TABLE public.registration_otps
  ADD COLUMN IF NOT EXISTS pt_name text;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_employee_nik_key;

DROP INDEX IF EXISTS profiles_employee_nik_key;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_company_employee_nik_key
  ON public.profiles (company_id, employee_nik)
  WHERE employee_nik IS NOT NULL;

ALTER TABLE public.bidder_profiles
  DROP CONSTRAINT IF EXISTS bidder_profiles_employee_nik_key;

DROP INDEX IF EXISTS bidder_profiles_employee_nik_key;

CREATE UNIQUE INDEX IF NOT EXISTS bidder_profiles_company_employee_nik_key
  ON public.bidder_profiles (company_id, employee_nik);
