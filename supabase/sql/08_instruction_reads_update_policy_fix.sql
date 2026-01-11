-- Fix UPDATE policy for instruction_reads table
-- Ensures users can only update their own reads within their organization

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can update their instruction reads" ON public.instruction_reads;

-- Recreate policy with proper USING and WITH CHECK clauses
CREATE POLICY "Users can update their instruction reads"
ON public.instruction_reads
FOR UPDATE
USING (
  user_id = auth.uid()
  AND org_id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.instructions i
    WHERE i.id = instruction_reads.instruction_id
      AND i.org_id = instruction_reads.org_id
  )
)
WITH CHECK (
  user_id = auth.uid()
  AND org_id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.instructions i
    WHERE i.id = instruction_reads.instruction_id
      AND i.org_id = instruction_reads.org_id
  )
);
