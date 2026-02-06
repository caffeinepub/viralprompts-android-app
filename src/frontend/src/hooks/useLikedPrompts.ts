import { useState, useEffect, useCallback } from 'react';

const LIKED_PROMPTS_KEY = 'viralprompts_liked';

export function useLikedPrompts() {
  const [likedPromptIds, setLikedPromptIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(LIKED_PROMPTS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return new Set(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error('Error reading liked prompts from storage:', error);
    }
    return new Set();
  });

  useEffect(() => {
    try {
      localStorage.setItem(LIKED_PROMPTS_KEY, JSON.stringify(Array.from(likedPromptIds)));
    } catch (error) {
      console.error('Error saving liked prompts to storage:', error);
    }
  }, [likedPromptIds]);

  const isLiked = useCallback((urlTitle: string): boolean => {
    return likedPromptIds.has(urlTitle);
  }, [likedPromptIds]);

  const toggleLike = useCallback((urlTitle: string) => {
    setLikedPromptIds((prev) => {
      const next = new Set(prev);
      if (next.has(urlTitle)) {
        next.delete(urlTitle);
      } else {
        next.add(urlTitle);
      }
      return next;
    });
  }, []);

  return {
    isLiked,
    toggleLike,
    likedCount: likedPromptIds.size,
  };
}
