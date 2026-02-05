import type { ViralPromptsResponse } from '../types/viralPrompts';

const DATA_URL = 'https://viralprompts.in/data.json';
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

export async function fetchViralPrompts(): Promise<ViralPromptsResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
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
      throw new FetchError(
        `Failed to fetch prompts: ${errorMessage}`,
        'http',
        response.status
      );
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      throw new FetchError(
        'Failed to parse JSON response',
        'parse'
      );
    }

    // Validate the expected structure
    if (!data || typeof data !== 'object' || !Array.isArray((data as any).prompts)) {
      console.error('Invalid data structure:', data);
      throw new FetchError(
        'Invalid JSON structure: expected top-level object with "prompts" array',
        'validation'
      );
    }

    return data as ViralPromptsResponse;
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
