import type { ViralPromptsResponse } from '../types/viralPrompts';

const CACHE_KEY = 'viralprompts_cache_v1';
const CACHE_TIMESTAMP_KEY = 'viralprompts_cache_timestamp_v1';

export interface CachedData {
  data: ViralPromptsResponse;
  timestamp: number;
}

export function getCachedPrompts(): ViralPromptsResponse | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const parsed = JSON.parse(cached) as ViralPromptsResponse;
    
    // Validate structure
    if (!parsed || !Array.isArray(parsed.prompts)) {
      return null;
    }

    return parsed;
  } catch (error) {
    console.error('Error reading cache:', error);
    return null;
  }
}

export function setCachedPrompts(data: ViralPromptsResponse): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.error('Error writing cache:', error);
  }
}

export function getCacheTimestamp(): number | null {
  try {
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    return timestamp ? parseInt(timestamp, 10) : null;
  } catch (error) {
    return null;
  }
}

export function hasCachedData(): boolean {
  try {
    return localStorage.getItem(CACHE_KEY) !== null;
  } catch (error) {
    return false;
  }
}

export function clearCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TIMESTAMP_KEY);
    console.log('Cache cleared successfully');
  } catch (error) {
    console.error('Error clearing cache:', error);
    throw error;
  }
}
