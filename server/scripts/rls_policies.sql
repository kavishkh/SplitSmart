-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
-- Users can view their own record
CREATE POLICY "Users can view their own record" ON public.users
FOR SELECT USING (id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can insert their own record (for signup)
CREATE POLICY "Users can insert their own record" ON public.users
FOR INSERT WITH CHECK (id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can update their own record
CREATE POLICY "Users can update their own record" ON public.users
FOR UPDATE USING (id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Create policies for groups table
-- Users can view groups they are a member of or created
CREATE POLICY "Users can view their groups" ON public.groups
FOR SELECT USING (
  created_by = current_setting('request.jwt.claims', true)::json->>'sub' 
  OR EXISTS (
    SELECT 1 FROM jsonb_array_elements(members) AS member 
    WHERE member->>'id' = current_setting('request.jwt.claims', true)::json->>'sub'
  )
);

-- Users can create groups
CREATE POLICY "Users can create groups" ON public.groups
FOR INSERT WITH CHECK (
  created_by = current_setting('request.jwt.claims', true)::json->>'sub'
);

-- Users can update groups they created
CREATE POLICY "Users can update their own groups" ON public.groups
FOR UPDATE USING (
  created_by = current_setting('request.jwt.claims', true)::json->>'sub'
);

-- Users can delete groups they created
CREATE POLICY "Users can delete their own groups" ON public.groups
FOR DELETE USING (
  created_by = current_setting('request.jwt.claims', true)::json->>'sub'
);

-- Create policies for expenses table
-- Users can view expenses from groups they belong to
CREATE POLICY "Users can view group expenses" ON public.expenses
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.groups 
    WHERE groups.id = expenses.group_id 
    AND (
      groups.created_by = current_setting('request.jwt.claims', true)::json->>'sub'
      OR EXISTS (
        SELECT 1 FROM jsonb_array_elements(groups.members) AS member 
        WHERE member->>'id' = current_setting('request.jwt.claims', true)::json->>'sub'
      )
    )
  )
);

-- Users can create expenses in groups they belong to
CREATE POLICY "Users can create group expenses" ON public.expenses
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.groups 
    WHERE groups.id = expenses.group_id 
    AND (
      groups.created_by = current_setting('request.jwt.claims', true)::json->>'sub'
      OR EXISTS (
        SELECT 1 FROM jsonb_array_elements(groups.members) AS member 
        WHERE member->>'id' = current_setting('request.jwt.claims', true)::json->>'sub'
      )
    )
  )
);

-- Users can update expenses they created
CREATE POLICY "Users can update their own expenses" ON public.expenses
FOR UPDATE USING (
  created_by = current_setting('request.jwt.claims', true)::json->>'sub'
);

-- Users can delete expenses they created
CREATE POLICY "Users can delete their own expenses" ON public.expenses
FOR DELETE USING (
  created_by = current_setting('request.jwt.claims', true)::json->>'sub'
);

-- Create policies for settlements table
-- Users can view settlements from groups they belong to
CREATE POLICY "Users can view group settlements" ON public.settlements
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.groups 
    WHERE groups.id = settlements.group_id 
    AND (
      groups.created_by = current_setting('request.jwt.claims', true)::json->>'sub'
      OR EXISTS (
        SELECT 1 FROM jsonb_array_elements(groups.members) AS member 
        WHERE member->>'id' = current_setting('request.jwt.claims', true)::json->>'sub'
      )
    )
  )
);

-- Users can create settlements in groups they belong to
CREATE POLICY "Users can create group settlements" ON public.settlements
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.groups 
    WHERE groups.id = settlements.group_id 
    AND (
      groups.created_by = current_setting('request.jwt.claims', true)::json->>'sub'
      OR EXISTS (
        SELECT 1 FROM jsonb_array_elements(groups.members) AS member 
        WHERE member->>'id' = current_setting('request.jwt.claims', true)::json->>'sub'
      )
    )
  )
);

-- Users can update settlements they are involved in
CREATE POLICY "Users can update their settlements" ON public.settlements
FOR UPDATE USING (
  from_user = current_setting('request.jwt.claims', true)::json->>'sub'
  OR to_user = current_setting('request.jwt.claims', true)::json->>'sub'
);

-- Users can delete settlements they are involved in
CREATE POLICY "Users can delete their settlements" ON public.settlements
FOR DELETE USING (
  from_user = current_setting('request.jwt.claims', true)::json->>'sub'
  OR to_user = current_setting('request.jwt.claims', true)::json->>'sub'
);

-- Grant necessary permissions to authenticated users
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.groups TO authenticated;
GRANT ALL ON public.expenses TO authenticated;
GRANT ALL ON public.settlements TO authenticated;