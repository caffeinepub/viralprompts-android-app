import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchViralPrompts, FetchError } from '../services/viralPromptsClient';
import { getCachedPrompts, setCachedPrompts, clearCache, hasCachedData } from '../services/viralPromptsCache';
import type { ViralPromptsResponse } from '../types/viralPrompts';

const PROMPTS_QUERY_KEY = ['viral-prompts'];

export function useViralPrompts() {
  const queryClient = useQueryClient();

  const query = useQuery<ViralPromptsResponse, FetchError>({
    queryKey: PROMPTS_QUERY_KEY,
    queryFn: async () => {
      try {
        const data = await fetchViralPrompts();
        // Cache successful fetch
        setCachedPrompts(data);
        return data;
      } catch (error) {
        // On error, try to return cached data
        const cached = getCachedPrompts();
        if (cached) {
          console.warn('Using cached data due to fetch error:', error);
          return cached;
        }
        throw error;
      }
    },
    // Bootstrap from cache immediately
    initialData: () => {
      const cached = getCachedPrompts();
      return cached || undefined;
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    retry: 2,
  });

  const refresh = () => {
    return queryClient.refetchQueries({ queryKey: PROMPTS_QUERY_KEY });
  };

  const clearCacheAndRefresh = async () => {
    try {
      clearCache();
      await queryClient.resetQueries({ queryKey: PROMPTS_QUERY_KEY });
      return refresh();
    } catch (error) {
      console.error('Error clearing cache and refreshing:', error);
      throw error;
    }
  };

  const isUsingCache = query.data && hasCachedData() && query.isError;

  return {
    prompts: query.data?.prompts || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isRefetching: query.isRefetching,
    isUsingCache: !!isUsingCache,
    hasCachedData: hasCachedData(),
    refresh,
    clearCacheAndRefresh,
  };
}
