// About dialog with policy-safe copy and disclosure about live content source
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';

export function AboutDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Info className="mr-2 h-4 w-4" />
          About
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>About ViralPrompts</DialogTitle>
          <DialogDescription className="space-y-4 pt-4 text-left">
            <p>
              This app fetches live content from{' '}
              <a
                href="https://viralprompts.in"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                viralprompts.in
              </a>
              , your source for creative AI prompts.
            </p>
            <p>
              All prompt content, images, and detailed guides are hosted on the website. 
              This app provides a convenient way to browse and copy prompts, with full 
              pages available on the website.
            </p>
            <p className="text-xs text-muted-foreground">
              Content updates automatically without requiring app updates. Internet 
              connection required for latest content; cached data available offline.
            </p>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
