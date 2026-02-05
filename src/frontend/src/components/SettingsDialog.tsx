import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Settings } from 'lucide-react';
import { useUserSettings } from '../hooks/useUserSettings';
import { useTheme } from '../hooks/useTheme';
import { Separator } from '@/components/ui/separator';

export function SettingsDialog() {
  const { settings, updateSetting } = useUserSettings();
  const { theme, setTheme } = useTheme();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Settings">
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Customize your experience with ViralPrompts
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Theme Setting */}
          <div className="space-y-2">
            <Label htmlFor="theme-select">Theme</Label>
            <Select
              value={theme}
              onValueChange={(value: 'light' | 'dark' | 'system') => {
                setTheme(value);
                updateSetting('theme', value);
              }}
            >
              <SelectTrigger id="theme-select">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Compact Spacing */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="compact-spacing">Compact spacing</Label>
              <p className="text-sm text-muted-foreground">
                Reduce spacing in the grid layout
              </p>
            </div>
            <Switch
              id="compact-spacing"
              checked={settings.compactSpacing}
              onCheckedChange={(checked) =>
                updateSetting('compactSpacing', checked)
              }
            />
          </div>

          {/* Show Images */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show-images">Show images</Label>
              <p className="text-sm text-muted-foreground">
                Display images in prompt cards
              </p>
            </div>
            <Switch
              id="show-images"
              checked={settings.showImages}
              onCheckedChange={(checked) => updateSetting('showImages', checked)}
            />
          </div>

          {/* Default Sort */}
          <div className="space-y-2">
            <Label htmlFor="sort-select">Default sort order</Label>
            <Select
              value={settings.defaultSort}
              onValueChange={(value: 'newest' | 'most-copied') =>
                updateSetting('defaultSort', value)
              }
            >
              <SelectTrigger id="sort-select">
                <SelectValue placeholder="Select sort order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="most-copied">Most copied</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
