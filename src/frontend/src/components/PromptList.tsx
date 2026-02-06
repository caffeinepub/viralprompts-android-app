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
    if (!error) return 'Unable to load prompts from the server.';
    
    const parts: string[] = [];
    
    // Add user-friendly message based on error type
    if (error.type === 'network') {
      parts.push('Network connection issue. Please check your internet connection and try again.');
    } else if (error.type === 'http') {
      parts.push('Server error. The prompts service may be temporarily unavailable.');
    } else if (error.type === 'parse') {
      parts.push('Data format error. The server returned invalid data.');
    } else if (error.type === 'validation') {
      parts.push('Data validation error. The server data could not be processed.');
    } else {
      parts.push('Unable to load prompts.');
    }
    
    // Add error category details
    const categoryLabels = {
      network: 'Network error',
      http: 'Server error',
      parse: 'Data format error',
      validation: 'Data validation error',
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

      {/* Cache indicator */}
      {isUsingCache && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Showing cached data</AlertTitle>
          <AlertDescription>
            Unable to fetch latest data from the server. Displaying previously cached prompts.
          </AlertDescription>
        </Alert>
      )}

      {/* Error state with recovery actions */}
      {isError && !isUsingCache && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Failed to load prompts</AlertTitle>
          <AlertDescription className="mt-2 space-y-3">
            <p>{getErrorMessage()}</p>
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
      {!isLoading && filteredAndSortedPrompts.length === 0 && !isError && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            {searchQuery || showLikedOnly ? (
              <>
                <p className="text-muted-foreground">
                  {showLikedOnly && !searchQuery && 'No liked prompts yet'}
                  {searchQuery && !showLikedOnly && 'No prompts match your search'}
                  {searchQuery && showLikedOnly && 'No liked prompts match your search'}
                </p>
                <div className="mt-4 flex gap-2">
                  {searchQuery && (
                    <Button onClick={() => setSearchQuery('')} variant="outline">
                      Clear Search
                    </Button>
                  )}
                  {showLikedOnly && (
                    <Button onClick={() => setShowLikedOnly(false)} variant="outline">
                      Show All Prompts
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Prompts grid */}
      <div className={`grid sm:grid-cols-2 lg:grid-cols-3 ${gridGap}`}>
        {filteredAndSortedPrompts.map((prompt) => (
          <Card
            key={prompt.id}
            className="group cursor-pointer overflow-hidden transition-all hover:shadow-lg"
            onClick={() => onSelectPrompt(prompt)}
          >
            {settings.showImages && prompt.image && (
              <div className="relative aspect-video w-full overflow-hidden bg-muted">
                <img
                  src={constructImageUrl(prompt.image)}
                  alt={prompt.title}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                />
              </div>
            )}
            <CardHeader className={settings.compactSpacing ? 'p-4' : ''}>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="line-clamp-2 text-lg">{prompt.title}</CardTitle>
                <button
                  onClick={(e) => handleLike(e, prompt.urlTitle)}
                  className="shrink-0 text-muted-foreground transition-colors hover:text-primary"
                  aria-label={isLiked(prompt.urlTitle) ? 'Unlike' : 'Like'}
                >
                  <Heart
                    className={`h-5 w-5 ${isLiked(prompt.urlTitle) ? 'fill-primary text-primary' : ''}`}
                  />
                </button>
              </div>
            </CardHeader>
            <CardContent className={settings.compactSpacing ? 'p-4 pt-0' : 'pt-0'}>
              {prompt.description && (
                <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
                  {prompt.description}
                </p>
              )}
              <div className="mb-3 flex flex-wrap gap-2">
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
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Copy className="h-3 w-3" />
                  <span>{prompt.copiedCount || 0} copies</span>
                </div>
                <button
                  onClick={(e) => handleShare(e, prompt)}
                  className="flex items-center gap-1 transition-colors hover:text-foreground"
                  aria-label="Share"
                >
                  <Share2 className="h-3 w-3" />
                  <span>Share</span>
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
