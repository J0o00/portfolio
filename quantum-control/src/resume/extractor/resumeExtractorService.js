/**
 * resume/extractor/resumeExtractorService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Client-Side Resume Text Extraction Engine
 *
 * Decoupled service responsible purely for extracting raw strings from uploaded
 * .pdf (using pdfjs-dist) or .docx (using mammoth) documents directly in browser.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Configure CDN worker for pdf.js to prevent Vite bundling worker errors
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

/**
 * Extracts raw text from a File object (.pdf or .docx).
 *
 * @param {File} file 
 * @returns {Promise<{ rawText: string, wordCount: number, pageCount: number, extractedAt: string }>}
 */
export async function extractTextFromFile(file) {
  if (!file) throw new Error('No file provided for extraction');

  const fileType = file.type;
  const fileName = file.name.toLowerCase();
  const arrayBuffer = await file.arrayBuffer();

  let rawText = '';
  let pageCount = 1;

  if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
    const pdfResult = await extractFromPDF(arrayBuffer);
    rawText = pdfResult.text;
    pageCount = pdfResult.pages;
  } else if (
    fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    fileName.endsWith('.docx')
  ) {
    rawText = await extractFromDOCX(arrayBuffer);
    // Estimate page count roughly (250 words per page)
    const words = rawText.trim().split(/\s+/).length;
    pageCount = Math.max(1, Math.ceil(words / 250));
  } else {
    throw new Error('Unsupported file format. Only PDF and DOCX are allowed.');
  }

  const cleanedText = rawText.replace(/\r\n/g, '\n').trim();
  const wordCount = cleanedText ? cleanedText.split(/\s+/).length : 0;

  return {
    rawText: cleanedText,
    wordCount,
    pageCount,
    extractedAt: new Date().toISOString()
  };
}

/**
 * Internal helper to parse PDF ArrayBuffer
 */
async function extractFromPDF(arrayBuffer) {
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  let fullText = '';

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    fullText += pageText + '\n\n';
  }

  return { text: fullText, pages: numPages };
}

/**
 * Internal helper to parse DOCX ArrayBuffer
 */
async function extractFromDOCX(arrayBuffer) {
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value || '';
}
