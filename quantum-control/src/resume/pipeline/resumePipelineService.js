/**
 * resume/pipeline/resumePipelineService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Enterprise Resume Ingestion Pipeline Orchestrator
 *
 * Single point of entry for React UI components. Orchestrates:
 *  UPLOADED -> TEXT_EXTRACTED -> TEXT_CONFIRMED -> AI_PARSED -> NORMALIZED -> MATCHED -> REVIEWED -> SYNCED
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { extractTextFromFile } from '../extractor/resumeExtractorService';
import { createAIProvider } from '../providers/aiProviders';
import { technicalNormalize } from '../normalizer/technicalNormalizer';
import { businessNormalize } from '../normalizer/businessNormalizer';
import { buildEntityDiffs } from '../matching/resumeDiffBuilder';
import { supabase } from '../../../../src/lib/supabase';

export const PIPELINE_STAGES = [
  'UPLOADED',
  'TEXT_EXTRACTED',
  'TEXT_CONFIRMED',
  'AI_PARSED',
  'NORMALIZED',
  'MATCHED',
  'REVIEWED',
  'SYNCED'
];

/**
 * Step 1: Upload & Extract Raw Text
 */
export async function runExtractionStage(file, uploadId) {
  const extResult = await extractTextFromFile(file);
  
  if (uploadId) {
    await supabase.from('resume_uploads').update({
      raw_text: extResult.rawText,
      processing_stage: 'TEXT_EXTRACTED'
    }).eq('id', uploadId);
  }

  return { ...extResult, stage: 'TEXT_EXTRACTED' };
}

/**
 * Step 2: Confirm Text & Run AI Parse + Normalize + Match
 */
export async function runAIParseAndMatchStage(rawText, apiKey, activeDbRecords, uploadId) {
  // 1. Confirm text stage
  if (uploadId) {
    await supabase.from('resume_uploads').update({ processing_stage: 'TEXT_CONFIRMED' }).eq('id', uploadId);
  }

  // 2. AI Parse
  const provider = createAIProvider('gemini', apiKey);
  const aiResult = await provider.parseResume(rawText);

  if (uploadId) {
    await supabase.from('resume_uploads').update({
      llm_response: aiResult.rawJson,
      prompt_version: aiResult.promptVersion,
      model_used: aiResult.modelUsed,
      processing_time_ms: aiResult.processingTimeMs,
      processing_stage: 'AI_PARSED'
    }).eq('id', uploadId);
  }

  // 3. Technical + Business Normalization
  const techNorm = technicalNormalize(aiResult.parsedData);
  const normalizedData = businessNormalize(techNorm);

  if (uploadId) {
    await supabase.from('resume_uploads').update({
      parsed_json: normalizedData,
      confidence_summary: normalizedData.confidence_summary || {},
      processing_stage: 'NORMALIZED'
    }).eq('id', uploadId);
  }

  // 4. Build Diff Match
  const diffModel = buildEntityDiffs(normalizedData, activeDbRecords);

  if (uploadId) {
    await supabase.from('resume_uploads').update({
      processing_stage: 'MATCHED'
    }).eq('id', uploadId);
  }

  return {
    normalizedData,
    diffModel,
    confidenceSummary: normalizedData.confidence_summary || {},
    stage: 'MATCHED'
  };
}
