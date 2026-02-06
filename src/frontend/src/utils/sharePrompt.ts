import { constructCanonicalUrl } from './viralPrompts';
import { copyToClipboard } from './clipboard';

export interface ShareResult {
  success: boolean;
  usedClipboard: boolean;
}

export async function sharePrompt(urlTitle: string, title: string): Promise<ShareResult> {
  const url = constructCanonicalUrl(urlTitle);
  
  // Try Web Share API first
  if (navigator.share) {
    try {
      await navigator.share({
        title: title,
        url: url,
      });
      return { success: true, usedClipboard: false };
    } catch (error) {
      // User cancelled or share failed, fall back to clipboard
      if ((error as Error).name === 'AbortError') {
        return { success: false, usedClipboard: false };
      }
    }
  }

  // Fallback to clipboard
  const copied = await copyToClipboard(url);
  return { success: copied, usedClipboard: copied };
}
