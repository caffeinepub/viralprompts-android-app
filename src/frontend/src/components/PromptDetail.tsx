import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Copy, ExternalLink, Check, Heart, Share2 } from 'lucide-react';
import { useState } from 'react';
import type { ViralPrompt } from '../types/viralPrompts';
import { constructImageUrl, constructCanonicalUrl, parseHowToUseSteps } from '../utils/viralPrompts';
import { copyToClipboard } from '../utils/clipboard';
import { sharePrompt } from '../utils/sharePrompt';
import { toast } from 'sonner';

interface PromptDetailProps {
  prompt: ViralPrompt;
  onBack: () => void;
  isLiked: boolean;
  onToggleLike: () => void;
}

export function PromptDetail({ prompt, onBack, isLiked, onToggleLike }: PromptDetailProps) {
  const [copied, setCopied] = useState(false);
  const steps = parseHowToUseSteps(prompt.howToUse);
  const canonicalUrl = constructCanonicalUrl(prompt.urlTitle);

  const handleCopy = async () => {
    const success = await copyToClipboard(prompt.prompt);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenFullPage = () => {
    window.open(canonicalUrl, '_blank', 'noopener,noreferrer');
  };

  const handleShare = async () => {
    const result = await sharePrompt(prompt.urlTitle, prompt.title);
    if (result.success && result.usedClipboard) {
      toast.success('Link copied to clipboard!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button onClick={onBack} variant="ghost" size="sm">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to prompts
      </Button>

      {/* Main content */}
      <Card>
        {/* Image */}
        {prompt.image && (
          <div className="relative aspect-video w-full overflow-hidden rounded-t-lg bg-muted">
            <img
              src={constructImageUrl(prompt.image)}
              alt={prompt.title}
              className="h-full w-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        )}

        <CardHeader>
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-3xl">{prompt.title}</CardTitle>
                {prompt.description && (
                  <CardDescription className="mt-2 text-base">
                    {prompt.description}
                  </CardDescription>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  variant={isLiked ? 'default' : 'outline'}
                  size="icon"
                  onClick={onToggleLike}
                  aria-label={isLiked ? 'Unlike' : 'Like'}
                >
                  <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleShare}
                  aria-label="Share"
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Categories */}
            {prompt.categories && prompt.categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {prompt.categories.map((category, idx) => (
                  <Badge key={idx} variant="secondary">
                    {category}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <Separator />

          {/* Prompt content with copy button */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Prompt</h3>
              <Button
                onClick={handleCopy}
                variant={copied ? 'default' : 'outline'}
                size="sm"
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <ScrollArea className="h-auto max-h-64 rounded-lg border bg-muted/30 p-4">
              <p className="whitespace-pre-wrap text-sm">{prompt.prompt}</p>
            </ScrollArea>
          </div>

          {/* How to use steps */}
          {steps.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">How to Use</h3>
                <ol className="space-y-2 pl-5">
                  {steps.map((step, idx) => (
                    <li key={idx} className="list-decimal text-sm leading-relaxed">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </>
          )}

          <Separator />

          {/* Open full page button */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              <p>View the complete prompt page with examples and more details</p>
            </div>
            <Button onClick={handleOpenFullPage} className="shrink-0">
              <ExternalLink className="mr-2 h-4 w-4" />
              Open Full Page
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
