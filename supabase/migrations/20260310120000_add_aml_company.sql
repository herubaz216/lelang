INSERT INTO public.companies (code, name, short_name)
SELECT 'aml', 'PT. Aditya Mandiri Logistic', 'AML'
WHERE NOT EXISTS (
  SELECT 1 FROM public.companies WHERE lower(code) = 'aml'
);
