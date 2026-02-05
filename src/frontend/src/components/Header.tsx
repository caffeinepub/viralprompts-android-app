import { AboutDialog } from './AboutDialog';
import { ThemeToggle } from './ThemeToggle';
import { SettingsDialog } from './SettingsDialog';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
            <span className="text-xl font-bold text-primary-foreground">VP</span>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">ViralPrompts</h1>
            <p className="text-xs text-muted-foreground">AI Prompt Library</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <SettingsDialog />
          <AboutDialog />
        </div>
      </div>
    </header>
  );
}
