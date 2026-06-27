/**
 * resume/providers/aiProviders.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Pluggable AI Provider Abstraction
 *
 * Defines common AIProvider interface and concrete GeminiProvider implementing
 * prompt versioning ("resume-v3") and strict structured JSON generation.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { GoogleGenAI } from '@google/genai';

export const PROMPT_VERSION = 'resume-v3';

/**
 * Base AI Provider Interface
 */
export class AIProvider {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  /**
   * @param {string} rawText 
   * @returns {Promise<{ rawJson: string, parsedData: any, modelUsed: string, processingTimeMs: number }>}
   */
  async parseResume(rawText) {
    throw new Error('parseResume() must be implemented by subclass');
  }
}

/**
 * Concrete Gemini Provider
 */
export class GeminiProvider extends AIProvider {
  constructor(apiKey, modelName = 'gemini-2.0-flash') {
    super(apiKey);
    this.modelName = modelName;
  }

  async parseResume(rawText) {
    if (!this.apiKey) {
      throw new Error('Missing Gemini Session AI Key. Please configure it in the dashboard.');
    }

    const startTime = Date.now();
    const ai = new GoogleGenAI({ apiKey: this.apiKey });

    const systemInstruction = `You are an expert Principal Engineering Technical Recruiter and Data Ingestion AI.
Your task is to accurately parse the provided raw resume text into a strict JSON structure matching an enterprise CMS database schema.

CRITICAL RULES:
1. NEVER guess or invent exact dates or months. If the resume only specifies a year (e.g. "2024"), return "2024" or null. Do NOT invent "2024-01-01". Unknown fields must remain null.
2. Calculate quantitative confidence scores (between 0.00 and 1.00) for every major section and individual item.
3. Keep technical descriptions factual and immutable based strictly on the text.
4. Categorize experiences correctly into: 'Work', 'Research', 'Leadership', 'Award', 'Certification', 'Education', 'Volunteer', or 'Mentorship'.

Output MUST strictly adhere to this JSON format:
{
  "confidence_summary": {
    "overall": 0.95,
    "profile": 0.99,
    "experience": 0.94,
    "education": 0.98,
    "skills": 0.99,
    "projects": 0.85,
    "research": 0.90
  },
  "profile": {
    "headline": "...",
    "bio": "...",
    "location": "...",
    "email": "...",
    "phone": "..."
  },
  "experience": [
    {
      "role_title": "...",
      "organization": "...",
      "location": "...",
      "start_date": "...",
      "end_date": "...",
      "is_current": false,
      "summary": "...",
      "description": "...",
      "type": "Work",
      "confidence": 0.95
    }
  ],
  "education": [
    {
      "institution": "...",
      "degree": "...",
      "field_of_study": "...",
      "cgpa": "...",
      "start_date": "...",
      "end_date": "...",
      "confidence": 0.98
    }
  ],
  "skills": [
    {
      "name": "...",
      "category": "...",
      "proficiency": 85,
      "confidence": 0.99
    }
  ],
  "projects": [
    {
      "title": "...",
      "short_description": "...",
      "full_description": "...",
      "tags": ["..."],
      "confidence": 0.85
    }
  ],
  "research": [
    {
      "title": "...",
      "type": "Publication",
      "venue": "...",
      "reference_number": "...",
      "abstract": "...",
      "authors": ["..."],
      "confidence": 0.90
    }
  ]
}`;

    const modelsToTry = [...new Set([this.modelName, 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'])];
    let lastError = null;
    let actualModelUsed = this.modelName;
    let response = null;

    for (const model of modelsToTry) {
      actualModelUsed = model;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          response = await ai.models.generateContent({
            model: model,
            contents: `${systemInstruction}\n\n=== RAW RESUME TEXT ===\n${rawText}`,
            config: {
              responseMimeType: 'application/json',
              temperature: 0.1
            }
          });
          break;
        } catch (err) {
          lastError = err;
          const errMsg = err?.message || JSON.stringify(err);
          const isOverloaded = errMsg.includes('503') || errMsg.includes('429') || errMsg.includes('high demand') || errMsg.includes('UNAVAILABLE') || errMsg.includes('RESOURCE_EXHAUSTED');
          
          if (isOverloaded && attempt < 3) {
            console.warn(`[Gemini] Model ${model} busy (attempt ${attempt}/3). Retrying in ${attempt * 1500}ms...`);
            await new Promise(r => setTimeout(r, attempt * 1500));
          } else {
            console.warn(`[Gemini] Model ${model} failed after ${attempt} attempt(s): ${errMsg}`);
            break; // Try next model in list
          }
        }
      }
      if (response) break; // Success!
    }

    if (!response) {
      throw new Error(`All Gemini AI models are currently busy or unavailable. Last error: ${lastError?.message || lastError}`);
    }

    const processingTimeMs = Date.now() - startTime;
    const rawJson = response.text || '{}';
    let parsedData = {};

    try {
      parsedData = JSON.parse(rawJson);
    } catch (e) {
      throw new Error(`AI generated malformed JSON: ${e.message}`);
    }

    return {
      rawJson,
      parsedData,
      modelUsed: actualModelUsed,
      promptVersion: PROMPT_VERSION,
      processingTimeMs
    };
  }
}

/**
 * Factory to instantiate provider based on type
 */
export function createAIProvider(type = 'gemini', apiKey, modelName) {
  switch (type.toLowerCase()) {
    case 'gemini':
      return new GeminiProvider(apiKey, modelName);
    // Future: case 'claude': return new ClaudeProvider(apiKey);
    default:
      return new GeminiProvider(apiKey, modelName);
  }
}
