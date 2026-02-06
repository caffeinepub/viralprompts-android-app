import type { ViralPromptsResponse, ViralPrompt } from '../types/viralPrompts';
import type { backendInterface } from '../backend';

const DATA_URL = '/data.json';
const FETCH_TIMEOUT = 15000; // 15 seconds

export class FetchError extends Error {
  constructor(
    message: string,
    public readonly type: 'network' | 'http' | 'parse' | 'validation',
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'FetchError';
  }
}

function sanitizePrompt(item: any): ViralPrompt | null {
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

function parseAndValidatePrompts(rawText: string): ViralPromptsResponse {
  let data: unknown;
  try {
    console.log('Parsing JSON response (length:', rawText.length, 'chars)');
    data = JSON.parse(rawText);
  } catch (parseError) {
    console.error('JSON parse error:', parseError);
    console.log('Failed to parse text:', rawText.substring(0, 500) || '(empty response)');
    throw new FetchError(
      'Failed to parse JSON response',
      'parse'
    );
  }

  // Validate the expected structure
  if (!data || typeof data !== 'object' || !Array.isArray((data as any).prompts)) {
    console.error('Invalid data structure:', data);
    console.log('Expected top-level object with "prompts" array, got:', typeof data, data);
    throw new FetchError(
      'Invalid JSON structure: expected top-level object with "prompts" array',
      'validation'
    );
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
    throw new FetchError(
      'No valid prompts found in response',
      'validation'
    );
  }

  console.log(`Successfully loaded ${sanitizedPrompts.length} prompts (skipped ${skippedCount})`);

  return { prompts: sanitizedPrompts };
}

/**
 * Fetch prompts via backend canister (bypasses CORS)
 */
export async function fetchViralPromptsViaBackend(actor: backendInterface): Promise<ViralPromptsResponse> {
  try {
    console.log('Fetching prompts via backend canister from', DATA_URL);
    
    const rawText = await actor.loadConfirmedViralPrompts();
    
    if (!rawText || typeof rawText !== 'string') {
      console.error('Backend returned invalid response:', typeof rawText, rawText);
      throw new FetchError(
        'Backend returned invalid response (expected string)',
        'validation'
      );
    }

    console.log('Backend fetch successful, received', rawText.length, 'characters');
    
    return parseAndValidatePrompts(rawText);
  } catch (error) {
    console.error('Backend fetch error:', error);
    
    if (error instanceof FetchError) {
      throw error;
    }

    if (error instanceof Error) {
      throw new FetchError(
        `Backend fetch failed: ${error.message}`,
        'network'
      );
    }

    throw new FetchError('Unknown error occurred during backend fetch', 'network');
  }
}

/**
 * Legacy direct fetch (kept for fallback, but may fail due to CORS)
 */
export async function fetchViralPrompts(): Promise<ViralPromptsResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    console.log('Fetching prompts directly from', DATA_URL);
    
    const response = await fetch(DATA_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      console.error('Fetch failed:', errorMessage);
      
      // Try to log response body even on HTTP error
      try {
        const errorText = await response.text();
        console.log('Raw response text (HTTP error):', errorText);
      } catch (textError) {
        console.warn('Could not read error response text:', textError);
      }
      
      throw new FetchError(
        `Failed to fetch prompts: ${errorMessage}`,
        'http',
        response.status
      );
    }

    // Parse response as text first, then JSON (don't rely on Content-Type)
    const rawText = await response.text();
    console.log('Direct fetch successful, received', rawText.length, 'characters');
    
    return parseAndValidatePrompts(rawText);
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof FetchError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error('Fetch timeout after', FETCH_TIMEOUT, 'ms');
        throw new FetchError(
          'Request timeout: server took too long to respond',
          'network'
        );
      }
      
      console.error('Network error:', error.message);
      throw new FetchError(
        `Network error: ${error.message}`,
        'network'
      );
    }

    throw new FetchError('Unknown error occurred', 'network');
  }
}
