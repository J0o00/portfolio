-- Migration: Enterprise Resume Intelligence Schema Extensions
-- Date: 2026-06-26

-- Add enterprise audit and diagnostic tracking columns to resume_uploads table
ALTER TABLE public.resume_uploads
  ADD COLUMN IF NOT EXISTS raw_text text,
  ADD COLUMN IF NOT EXISTS llm_response text,
  ADD COLUMN IF NOT EXISTS prompt_version text DEFAULT 'resume-v3',
  ADD COLUMN IF NOT EXISTS parser_version text DEFAULT '1.0',
  ADD COLUMN IF NOT EXISTS schema_version text DEFAULT '2026.06',
  ADD COLUMN IF NOT EXISTS model_used text DEFAULT 'gemini-2.5-flash',
  ADD COLUMN IF NOT EXISTS confidence_summary jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS parse_error text,
  ADD COLUMN IF NOT EXISTS parse_attempts integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS processing_time_ms bigint,
  ADD COLUMN IF NOT EXISTS processing_stage text DEFAULT 'UPLOADED';

-- Create Index on processing_stage and schema_version for faster dashboard querying
CREATE INDEX IF NOT EXISTS idx_resume_uploads_stage ON public.resume_uploads(processing_stage);
CREATE INDEX IF NOT EXISTS idx_resume_uploads_schema ON public.resume_uploads(schema_version);
