import type { ViralPromptsResponse } from '../types/viralPrompts';
import type { backendInterface } from '../backend';
import { preprocessRawText, normalizePromptsResponse } from './viralPromptsParsing';

const DATA_URL = 'https://viralprompts.in/data.json';
const FETCH_TIMEOUT = 15000; // 15 seconds

export class FetchError extends Error {
  constructor(
    message: string,
    public readonly type: 'network' | 'http' | 'parse' | 'validation' | 'cloudflare',
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'FetchError';
  }
}

/**
 * Detect if the response looks like HTML or a non-JSON error page
 * This must be called BEFORE attempting JSON.parse()
 */
function detectNonJsonResponse(rawText: string): boolean {
  if (!rawText || typeof rawText !== 'string') return false;
  
  const trimmed = rawText.trim();
  
  // Check for HTML document indicators
  const htmlIndicators = [
    '<!doctype',
    '<!DOCTYPE',
    '<html',
    '<HTML',
    '<head>',
    '<HEAD>',
    '<body>',
    '<BODY>',
  ];
  
  // Check if response starts with HTML tags
  const startsWithHtml = htmlIndicators.some(indicator => 
    trimmed.toLowerCase().startsWith(indicator.toLowerCase())
  );
  
  if (startsWithHtml) {
    return true;
  }
  
  // Check for common HTML patterns anywhere in the response
  const lowerText = trimmed.toLowerCase();
  const hasHtmlStructure = (
    (lowerText.includes('<html') || lowerText.includes('<!doctype')) &&
    (lowerText.includes('<head>') || lowerText.includes('<body>'))
  );
  
  if (hasHtmlStructure) {
    return true;
  }
  
  // Check if it starts with something that's definitely not JSON
  const firstChar = trimmed[0];
  if (firstChar && firstChar !== '{' && firstChar !== '[') {
    // Could be HTML, XML, plain text error, etc.
    // Check for common error page patterns
    if (lowerText.includes('<title>') || lowerText.includes('error') || lowerText.includes('forbidden')) {
      return true;
    }
  }
  
  return false;
}

/**
 * Detect if the response looks like a Cloudflare error or block
 */
function detectCloudflareBlock(rawText: string): boolean {
  if (!rawText || typeof rawText !== 'string') return false;
  
  const lowerText = rawText.toLowerCase();
  
  // Check for common Cloudflare error indicators
  const cloudflareIndicators = [
    'cloudflare',
    'cf-ray',
    'error 520',
    'error 521',
    'error 522',
    'error 523',
    'error 524',
    'error 525',
    'error 526',
    'web server is down',
    'connection timed out',
    'origin is unreachable',
    'ray id:',
  ];
  
  return cloudflareIndicators.some(indicator => lowerText.includes(indicator));
}

/**
 * Detect if the response looks like an access denied / forbidden error
 */
function detectAccessDenied(rawText: string): boolean {
  if (!rawText || typeof rawText !== 'string') return false;
  
  const lowerText = rawText.toLowerCase();
  
  const accessDeniedIndicators = [
    'access denied',
    '403 forbidden',
    'not authorized',
    'permission denied',
    'forbidden',
  ];
  
  return accessDeniedIndicators.some(indicator => lowerText.includes(indicator));
}

function parseAndValidatePrompts(rawText: string): ViralPromptsResponse {
  // Preprocess: remove BOM and trim whitespace
  const cleanedText = preprocessRawText(rawText);
  
  if (!cleanedText) {
    console.error('Empty response after preprocessing');
    throw new FetchError(
      `Empty response from ${DATA_URL}`,
      'validation'
    );
  }

  // CRITICAL: Check if response is HTML or non-JSON BEFORE attempting to parse
  if (detectNonJsonResponse(cleanedText)) {
    console.error('Response is not JSON (appears to be HTML or error page)');
    console.log('Response preview (first 500 chars):', cleanedText.substring(0, 500));
    
    // Determine the specific type of error
    if (detectCloudflareBlock(cleanedText)) {
      throw new FetchError(
        `The data source ${DATA_URL} is blocked by Cloudflare protection. The server's security system is rejecting automated requests. Please try again later.`,
        'cloudflare'
      );
    }
    
    if (detectAccessDenied(cleanedText)) {
      throw new FetchError(
        `Access denied by ${DATA_URL}. The server is blocking this request. Please try again later.`,
        'cloudflare'
      );
    }
    
    // Generic HTML/non-JSON error
    throw new FetchError(
      `The server at ${DATA_URL} returned an error page instead of JSON data. This may be due to server-side blocking or temporary unavailability. Please try again later.`,
      'cloudflare'
    );
  }

  let data: unknown;
  try {
    console.log('Parsing JSON response (length:', cleanedText.length, 'chars)');
    data = JSON.parse(cleanedText);
  } catch (parseError) {
    console.error('JSON parse error:', parseError);
    console.log('Failed to parse text (first 500 chars):', cleanedText.substring(0, 500) || '(empty response)');
    throw new FetchError(
      `Failed to parse JSON response from ${DATA_URL}`,
      'parse'
    );
  }

  // Normalize and validate using shared utility
  try {
    return normalizePromptsResponse(data);
  } catch (validationError) {
    console.error('Validation error:', validationError);
    throw new FetchError(
      validationError instanceof Error ? validationError.message : 'Data format error',
      'validation'
    );
  }
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
        'network'
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
      // Check if error message contains Cloudflare indicators
      const errorMsg = error.message.toLowerCase();
      if (errorMsg.includes('cloudflare') || errorMsg.includes('520') || errorMsg.includes('403')) {
        throw new FetchError(
          `The data source ${DATA_URL} may be blocked by Cloudflare protection. Please try again later.`,
          'cloudflare'
        );
      }
      
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
        
        // Check for non-JSON response
        if (detectNonJsonResponse(errorText)) {
          if (detectCloudflareBlock(errorText) || detectAccessDenied(errorText)) {
            throw new FetchError(
              `The data source ${DATA_URL} may be blocked by Cloudflare protection.`,
              'cloudflare',
              response.status
            );
          }
        }
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
