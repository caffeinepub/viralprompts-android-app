import { useState, useEffect } from 'react';

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  compactSpacing: boolean;
  showImages: boolean;
  defaultSort: 'newest' | 'most-copied';
}

const SETTINGS_STORAGE_KEY = 'viralprompts_settings';

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'system',
  compactSpacing: false,
  showImages: true,
  defaultSort: 'most-copied',
};

function getStoredSettings(): UserSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (error) {
    console.error('Error reading settings from storage:', error);
  }
  return DEFAULT_SETTINGS;
}

export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings>(getStoredSettings);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings to storage:', error);
    }
  }, [settings]);

  const updateSetting = <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return {
    settings,
    updateSetting,
  };
}
