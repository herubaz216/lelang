-- ga_accounting staff (AMV) were blocked from uploading to auction-photos bucket.
DROP POLICY IF EXISTS "staff auction photo storage insert" ON storage.objects;

CREATE POLICY "staff auction photo storage insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'auction-photos'
  AND current_user_role() = ANY (ARRAY['ga', 'accounting', 'ga_accounting'])
);
