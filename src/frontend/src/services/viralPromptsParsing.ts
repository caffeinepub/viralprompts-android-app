import type { ViralPromptsResponse, ViralPrompt } from '../types/viralPrompts';

/**
 * Preprocess raw response text to handle common formatting issues
 * - Removes UTF-8 BOM if present
 * - Trims leading/trailing whitespace
 */
export function preprocessRawText(rawText: string): string {
  if (!rawText || typeof rawText !== 'string') {
    return '';
  }

  // Remove UTF-8 BOM (Byte Order Mark) if present
  // UTF-8 BOM is the character sequence EF BB BF, which appears as \uFEFF in JavaScript
  let cleaned = rawText;
  if (cleaned.charCodeAt(0) === 0xFEFF) {
    cleaned = cleaned.slice(1);
  }

  // Trim leading and trailing whitespace
  return cleaned.trim();
}

/**
 * Sanitize and validate a single prompt item
 * Returns null if the item is invalid
 */
export function sanitizePrompt(item: any): ViralPrompt | null {
  try {
    // Required fields
    if (!item || typeof item !== 'object') return null;
    if (typeof item.title !== 'string' || !item.title.trim()) return null;
    if (typeof item.prompt !== 'string' || !item.prompt.trim()) return null;
    if (typeof item.urlTitle !== 'string' || !item.urlTitle.trim()) return null;
    
    // Accept id as number or numeric string, convert to number
    let id: number;
    if (typeof item.id === 'number') {
      id = item.id;
    } else if (typeof item.id === 'string') {
      id = Number(item.id);
    } else {
      return null;
    }
    
    // Reject NaN or non-finite numbers
    if (!Number.isFinite(id)) return null;

    // Accept copiedCount as number or numeric string, convert to number or null
    let copiedCount: number | null = null;
    if (typeof item.copiedCount === 'number') {
      copiedCount = Number.isFinite(item.copiedCount) ? item.copiedCount : null;
    } else if (typeof item.copiedCount === 'string') {
      const parsed = Number(item.copiedCount);
      copiedCount = Number.isFinite(parsed) ? parsed : null;
    }

    // Return sanitized prompt with safe defaults for optional/nullable fields
    return {
      title: item.title,
      description: typeof item.description === 'string' ? item.description : null,
      prompt: item.prompt,
      image: typeof item.image === 'string' ? item.image : null,
      categories: Array.isArray(item.categories) ? item.categories.filter((c: any) => typeof c === 'string') : null,
      howToUse: typeof item.howToUse === 'string' ? item.howToUse : null,
      urlTitle: item.urlTitle,
      id,
      copiedCount,
      createdDate: typeof item.createdDate === 'string' ? item.createdDate : null,
    };
  } catch (error) {
    console.warn('Failed to sanitize prompt item:', error);
    return null;
  }
}

/**
 * Normalize raw parsed JSON into a ViralPromptsResponse
 * Validates structure and sanitizes individual prompt items
 */
export function normalizePromptsResponse(data: unknown): ViralPromptsResponse {
  // Validate the expected structure: top-level object with "prompts" array
  if (!data || typeof data !== 'object' || !Array.isArray((data as any).prompts)) {
    console.error('Invalid data structure:', data);
    console.log('Expected top-level object with "prompts" array, got:', typeof data, data);
    throw new Error('Invalid JSON structure: expected top-level object with "prompts" array');
  }

  // Sanitize and validate individual prompt items
  const rawPrompts = (data as any).prompts;
  const sanitizedPrompts: ViralPrompt[] = [];
  let skippedCount = 0;

  for (const item of rawPrompts) {
    const sanitized = sanitizePrompt(item);
    if (sanitized) {
      sanitizedPrompts.push(sanitized);
    } else {
      skippedCount++;
    }
  }

  if (skippedCount > 0) {
    console.warn(`Skipped ${skippedCount} invalid prompt items out of ${rawPrompts.length} total`);
  }

  if (sanitizedPrompts.length === 0) {
    console.error('No valid prompts after sanitization. Total items:', rawPrompts.length, 'Skipped:', skippedCount);
    throw new Error('No valid prompts found in response');
  }

  console.log(`Successfully loaded ${sanitizedPrompts.length} prompts (skipped ${skippedCount})`);

  return { prompts: sanitizedPrompts };
}
