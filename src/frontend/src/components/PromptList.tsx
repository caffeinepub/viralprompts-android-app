import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, Copy, AlertCircle, Trash2, Info } from 'lucide-react';
import type { ViralPrompt } from '../types/viralPrompts';
import { constructImageUrl } from '../utils/viralPrompts';
import { useState } from 'react';
import type { UserSettings } from '../hooks/useUserSettings';

interface PromptListProps {
  prompts: ViralPrompt[];
  isLoading: boolean;
  isError: boolean;
  isRefetching: boolean;
  isUsingCache: boolean;
  hasCachedData: boolean;
  onRefresh: () => void;
  onClearCacheAndRefresh: () => Promise<void>;
  onSelectPrompt: (prompt: ViralPrompt) => void;
  settings: UserSettings;
}

export function PromptList({
  prompts,
  isLoading,
  isError,
  isRefetching,
  isUsingCache,
  hasCachedData,
  onRefresh,
  onClearCacheAndRefresh,
  onSelectPrompt,
  settings,
}: PromptListProps) {
  const [isClearing, setIsClearing] = useState(false);

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      await onClearCacheAndRefresh();
    } finally {
      setIsClearing(false);
    }
  };

  // Sort prompts based on settings
  const sortedPrompts = [...prompts].sort((a, b) => {
    if (settings.defaultSort === 'most-copied') {
      return (b.copiedCount || 0) - (a.copiedCount || 0);
    } else {
      // Newest first (assuming higher ID = newer)
      return b.id - a.id;
    }
  });

  if (isLoading && prompts.length === 0) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-48 w-full rounded-lg" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const gridGap = settings.compactSpacing ? 'gap-4' : 'gap-6';

  return (
    <div className="space-y-6">
      {/* Refresh control */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Viral Prompts</h2>
          <p className="text-muted-foreground">
            {prompts.length} {prompts.length === 1 ? 'prompt' : 'prompts'} available
            {settings.defaultSort === 'most-copied' ? ' (sorted by most copied)' : ' (sorted by newest)'}
          </p>
        </div>
        <Button
          onClick={onRefresh}
          disabled={isRefetching}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Cache indicator */}
      {isUsingCache && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Showing cached data</AlertTitle>
          <AlertDescription>
            Unable to fetch latest data. Displaying previously cached prompts.
          </AlertDescription>
        </Alert>
      )}

      {/* Error state with recovery actions */}
      {isError && !isUsingCache && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Failed to load prompts</AlertTitle>
          <AlertDescription className="mt-2 space-y-3">
            <p>
              {prompts.length > 0
                ? 'Unable to refresh. Showing cached data.'
                : 'Unable to load prompts from the server.'}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={onRefresh}
                disabled={isRefetching}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
                Retry
              </Button>
              {hasCachedData && (
                <Button
                  onClick={handleClearCache}
                  disabled={isClearing}
                  variant="outline"
                  size="sm"
                >
                  <Trash2 className={`mr-2 h-4 w-4 ${isClearing ? 'animate-spin' : ''}`} />
                  Clear cache & retry
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Empty state */}
      {!isLoading && prompts.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">No prompts available</p>
            <div className="mt-4 flex gap-2">
              <Button onClick={onRefresh} variant="outline">
                Try Again
              </Button>
              {hasCachedData && (
                <Button onClick={handleClearCache} variant="outline">
                  Clear Cache
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prompts grid */}
      <div className={`grid sm:grid-cols-2 lg:grid-cols-3 ${gridGap}`}>
        {sortedPrompts.map((prompt) => (
          <Card
            key={prompt.id}
            className="group cursor-pointer overflow-hidden transition-all hover:shadow-lg"
            onClick={() => onSelectPrompt(prompt)}
          >
            {/* Image */}
            {settings.showImages && (
              <div className="relative aspect-video w-full overflow-hidden bg-muted">
                {prompt.image ? (
                  <img
                    src={constructImageUrl(prompt.image)}
                    alt={prompt.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <span className="text-muted-foreground">No image</span>
                  </div>
                )}
              </div>
            )}

            <CardHeader>
              <CardTitle className="line-clamp-2 text-lg">{prompt.title}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Categories */}
              {prompt.categories && prompt.categories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {prompt.categories.slice(0, 3).map((category, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {category}
                    </Badge>
                  ))}
                  {prompt.categories.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{prompt.categories.length - 3}
                    </Badge>
                  )}
                </div>
              )}

              {/* Copied count */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Copy className="h-4 w-4" />
                <span>{prompt.copiedCount || 0} copies</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
