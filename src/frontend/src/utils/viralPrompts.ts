// Utility helpers for image URLs, canonical URLs, and howToUse parsing
const BASE_URL = 'https://viralprompts.in';

export function constructImageUrl(imagePath: string | undefined | null): string {
  if (!imagePath || typeof imagePath !== 'string' || imagePath.trim() === '') {
    return ''; // Return empty string for graceful fallback
  }

  // Remove leading slash if present to avoid double slashes
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  
  return `${BASE_URL}/${cleanPath}`;
}

export function constructCanonicalUrl(urlTitle: string | undefined | null): string {
  if (!urlTitle || typeof urlTitle !== 'string' || urlTitle.trim() === '') {
    return BASE_URL; // Fallback to homepage
  }

  const cleanTitle = urlTitle.startsWith('/') ? urlTitle.slice(1) : urlTitle;
  
  return `${BASE_URL}/${cleanTitle}`;
}

export function parseHowToUseSteps(howToUse: string | undefined | null): string[] {
  if (!howToUse || typeof howToUse !== 'string') {
    return [];
  }

  // Split by newline and filter out empty lines
  return howToUse
    .split('\n')
    .map(step => step.trim())
    .filter(step => step.length > 0);
}
