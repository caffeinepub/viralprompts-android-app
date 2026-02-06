import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchViralPromptsViaBackend, FetchError } from '../services/viralPromptsClient';
import { getCachedPrompts, setCachedPrompts, clearCache, hasCachedData } from '../services/viralPromptsCache';
import type { ViralPromptsResponse } from '../types/viralPrompts';
import { useActor } from './useActor';

const PROMPTS_QUERY_KEY = ['viral-prompts'];

export function useViralPrompts() {
  const queryClient = useQueryClient();
  const { actor, isFetching: isActorFetching } = useActor();

  const query = useQuery<ViralPromptsResponse, FetchError>({
    queryKey: PROMPTS_QUERY_KEY,
    queryFn: async () => {
      if (!actor) {
        throw new FetchError(
          'Backend actor not available',
          'network'
        );
      }
      
      const data = await fetchViralPromptsViaBackend(actor);
      // Cache successful fetch
      setCachedPrompts(data);
      return data;
    },
    // Bootstrap from cache immediately
    initialData: () => {
      const cached = getCachedPrompts();
      return cached || undefined;
    },
    // Only run query when actor is ready
    enabled: !!actor && !isActorFetching,
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

  // Compute isUsingCache: we have data AND there's an error AND cache exists
  const isUsingCache = !!query.data && query.isError && hasCachedData();

  return {
    prompts: query.data?.prompts || [],
    isLoading: query.isLoading || isActorFetching,
    isError: query.isError,
    error: query.error,
    isRefetching: query.isRefetching,
    isUsingCache,
    hasCachedData: hasCachedData(),
    refresh,
    clearCacheAndRefresh,
  };
}
