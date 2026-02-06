import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, Copy, AlertCircle, Trash2, Info, Search, X, Heart, Share2 } from 'lucide-react';
import type { ViralPrompt } from '../types/viralPrompts';
import { constructImageUrl } from '../utils/viralPrompts';
import { sharePrompt } from '../utils/sharePrompt';
import { useState, useMemo } from 'react';
import type { UserSettings } from '../hooks/useUserSettings';
import type { FetchError } from '../services/viralPromptsClient';
import { toast } from 'sonner';

interface PromptListProps {
  prompts: ViralPrompt[];
  isLoading: boolean;
  isError: boolean;
  error: FetchError | null;
  isRefetching: boolean;
  isUsingCache: boolean;
  hasCachedData: boolean;
  onRefresh: () => void;
  onClearCacheAndRefresh: () => Promise<void>;
  onSelectPrompt: (prompt: ViralPrompt) => void;
  settings: UserSettings;
  isLiked: (urlTitle: string) => boolean;
  onToggleLike: (urlTitle: string) => void;
}

export function PromptList({
  prompts,
  isLoading,
  isError,
  error,
  isRefetching,
  isUsingCache,
  hasCachedData,
  onRefresh,
  onClearCacheAndRefresh,
  onSelectPrompt,
  settings,
  isLiked,
  onToggleLike,
}: PromptListProps) {
  const [isClearing, setIsClearing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLikedOnly, setShowLikedOnly] = useState(false);

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      await onClearCacheAndRefresh();
    } finally {
      setIsClearing(false);
    }
  };

  const handleShare = async (e: React.MouseEvent, prompt: ViralPrompt) => {
    e.stopPropagation();
    const result = await sharePrompt(prompt.urlTitle, prompt.title);
    if (result.success && result.usedClipboard) {
      toast.success('Link copied to clipboard!');
    }
  };

  const handleLike = (e: React.MouseEvent, urlTitle: string) => {
    e.stopPropagation();
    onToggleLike(urlTitle);
  };

  // Filter and sort prompts
  const filteredAndSortedPrompts = useMemo(() => {
    let filtered = prompts;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((prompt) => {
        const titleMatch = prompt.title.toLowerCase().includes(query);
        const descMatch = prompt.description?.toLowerCase().includes(query);
        const categoryMatch = prompt.categories?.some((cat) =>
          cat.toLowerCase().includes(query)
        );
        return titleMatch || descMatch || categoryMatch;
      });
    }

    // Apply liked filter
    if (showLikedOnly) {
      filtered = filtered.filter((prompt) => isLiked(prompt.urlTitle));
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      if (settings.defaultSort === 'most-copied') {
        return (b.copiedCount || 0) - (a.copiedCount || 0);
      } else {
        return b.id - a.id;
      }
    });

    return sorted;
  }, [prompts, searchQuery, showLikedOnly, settings.defaultSort, isLiked]);

  // Format error message with diagnostics
  const getErrorMessage = () => {
    if (!error) return 'Unable to load prompts from https://viralprompts.in/data.json';
    
    const parts: string[] = [];
    
    // Add user-friendly message based on error type
    if (error.type === 'cloudflare') {
      parts.push('Network connection issue. Please check your internet connection and try again.');
      parts.push('\n\nIf the issue persists, the data source may be temporarily blocking automated requests. Try refreshing after a few moments.');
    } else if (error.type === 'network') {
      parts.push('Network connection issue. Please check your internet connection and try again.');
    } else if (error.type === 'http') {
      parts.push('Server error. The prompts service at https://viralprompts.in/data.json may be temporarily unavailable.');
    } else if (error.type === 'parse') {
      parts.push('Data format error. The server returned invalid data.');
    } else if (error.type === 'validation') {
      parts.push('Data format error. The server returned invalid data.');
    } else {
      parts.push('Unable to load prompts from https://viralprompts.in/data.json');
    }
    
    // Add error category details
    const categoryLabels = {
      cloudflare: 'Network error',
      network: 'Network error',
      http: 'Server error',
      parse: 'Data format error',
      validation: 'Data format error',
    };
    parts.push(`(${categoryLabels[error.type]}${error.statusCode ? ` - HTTP ${error.statusCode}` : ''})`);
    
    return parts.join(' ');
  };

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
      {/* Header with refresh control */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Viral Prompts</h2>
          <p className="text-muted-foreground">
            {filteredAndSortedPrompts.length} {filteredAndSortedPrompts.length === 1 ? 'prompt' : 'prompts'}
            {searchQuery && ' matching search'}
            {showLikedOnly && ' liked'}
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

      {/* Search and filter controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search prompts by title, description, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          onClick={() => setShowLikedOnly(!showLikedOnly)}
          variant={showLikedOnly ? 'default' : 'outline'}
          size="sm"
          className="shrink-0"
        >
          <Heart className={`mr-2 h-4 w-4 ${showLikedOnly ? 'fill-current' : ''}`} />
          {showLikedOnly ? 'Show All' : 'Show Liked Only'}
        </Button>
      </div>

      {/* Cache indicator - shown when using cached data */}
      {isUsingCache && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Showing cached prompts</AlertTitle>
          <AlertDescription>
            Unable to fetch the latest data from https://viralprompts.in/data.json. Displaying previously cached prompts. You can retry to fetch fresh data.
          </AlertDescription>
        </Alert>
      )}

      {/* Error state with recovery actions - only shown when no cached data available */}
      {isError && !isUsingCache && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Failed to load prompts</AlertTitle>
          <AlertDescription className="space-y-3">
            <p className="whitespace-pre-line">{getErrorMessage()}</p>
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
      {!isLoading && !isError && filteredAndSortedPrompts.length === 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>No prompts found</AlertTitle>
          <AlertDescription>
            {searchQuery || showLikedOnly
              ? 'Try adjusting your search or filters.'
              : 'No prompts available at the moment.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Prompts grid */}
      {filteredAndSortedPrompts.length > 0 && (
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 ${gridGap}`}>
          {filteredAndSortedPrompts.map((prompt) => {
            const liked = isLiked(prompt.urlTitle);
            return (
              <Card
                key={prompt.id}
                className="group cursor-pointer transition-all hover:shadow-lg"
                onClick={() => onSelectPrompt(prompt)}
              >
                {settings.showImages && prompt.image && (
                  <CardHeader className="p-0">
                    <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
                      <img
                        src={constructImageUrl(prompt.image)}
                        alt={prompt.title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                  </CardHeader>
                )}
                <CardContent className={settings.compactSpacing ? 'space-y-2 p-4' : 'space-y-3 p-6'}>
                  <CardTitle className={settings.compactSpacing ? 'text-base' : 'text-lg'}>
                    {prompt.title}
                  </CardTitle>
                  {prompt.description && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {prompt.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {prompt.categories?.slice(0, 3).map((category, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {category}
                      </Badge>
                    ))}
                    {prompt.categories && prompt.categories.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{prompt.categories.length - 3}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {prompt.copiedCount !== null && (
                        <span className="flex items-center gap-1">
                          <Copy className="h-3 w-3" />
                          {prompt.copiedCount.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => handleLike(e, prompt.urlTitle)}
                      >
                        <Heart
                          className={`h-4 w-4 ${liked ? 'fill-red-500 text-red-500' : ''}`}
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => handleShare(e, prompt)}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
