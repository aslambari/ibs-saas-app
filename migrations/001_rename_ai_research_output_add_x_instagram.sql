-- Rename ai_research_output to ai_research_output_linkedin
-- Add ai_research_output_x and ai_research_output_instagram (same type: TEXT)

ALTER TABLE public.social_media_posts
  RENAME COLUMN ai_research_output TO ai_research_output_linkedin;

ALTER TABLE public.social_media_posts
  ADD COLUMN IF NOT EXISTS ai_research_output_x TEXT;

ALTER TABLE public.social_media_posts
  ADD COLUMN IF NOT EXISTS ai_research_output_instagram TEXT;
