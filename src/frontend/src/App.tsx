import { useState, useEffect } from 'react';
import { useViralPrompts } from './hooks/useViralPrompts';
import { useUserSettings } from './hooks/useUserSettings';
import { useTheme } from './hooks/useTheme';
import { PromptList } from './components/PromptList';
import { PromptDetail } from './components/PromptDetail';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import type { ViralPrompt } from './types/viralPrompts';

function App() {
  const {
    prompts,
    isLoading,
    isError,
    isRefetching,
    isUsingCache,
    hasCachedData,
    refresh,
    clearCacheAndRefresh,
  } = useViralPrompts();
  
  const { settings } = useUserSettings();
  const { setTheme } = useTheme();
  const [selectedPrompt, setSelectedPrompt] = useState<ViralPrompt | null>(null);

  // Sync theme from settings
  useEffect(() => {
    setTheme(settings.theme);
  }, [settings.theme, setTheme]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="container flex-1 py-8">
        {selectedPrompt ? (
          <PromptDetail
            prompt={selectedPrompt}
            onBack={() => setSelectedPrompt(null)}
          />
        ) : (
          <PromptList
            prompts={prompts}
            isLoading={isLoading}
            isError={isError}
            isRefetching={isRefetching}
            isUsingCache={isUsingCache}
            hasCachedData={hasCachedData}
            onRefresh={refresh}
            onClearCacheAndRefresh={clearCacheAndRefresh}
            onSelectPrompt={setSelectedPrompt}
            settings={settings}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;
