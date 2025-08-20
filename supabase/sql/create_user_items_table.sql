-- Create the user_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_items (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  tmdb_id text NOT NULL,
  item_type text NOT NULL,
  list text NOT NULL CHECK (list IN ('seen', 'pinned')),
  payload jsonb,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (user_id, tmdb_id, list)
);

-- Enable Row Level Security
ALTER TABLE public.user_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own items" ON public.user_items
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own items" ON public.user_items
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own items" ON public.user_items
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own items" ON public.user_items
  FOR DELETE
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_items TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.user_items_id_seq TO authenticated;
