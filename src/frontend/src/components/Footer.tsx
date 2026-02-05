// App footer with attribution
import { Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-auto border-t bg-background">
      <div className="container flex h-16 items-center justify-center">
        <p className="text-center text-sm text-muted-foreground">
          © 2026. Built with{' '}
          <Heart className="inline h-4 w-4 fill-red-500 text-red-500" />{' '}
          using{' '}
          <a
            href="https://caffeine.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline-offset-4 hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </footer>
  );
}
