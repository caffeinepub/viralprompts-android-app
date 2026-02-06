import { useState, useEffect } from 'react';
import { useViralPrompts } from './hooks/useViralPrompts';
import { useUserSettings } from './hooks/useUserSettings';
import { useTheme } from './hooks/useTheme';
import { useLikedPrompts } from './hooks/useLikedPrompts';
import { PromptList } from './components/PromptList';
import { PromptDetail } from './components/PromptDetail';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import type { ViralPrompt } from './types/viralPrompts';

function App() {
  const {
    prompts,
    isLoading,
    isError,
    error,
    isRefetching,
    isUsingCache,
    hasCachedData,
    refresh,
    clearCacheAndRefresh,
  } = useViralPrompts();
  
  const { settings } = useUserSettings();
  const { setTheme } = useTheme();
  const { isLiked, toggleLike } = useLikedPrompts();
  const [selectedPrompt, setSelectedPrompt] = useState<ViralPrompt | null>(null);
  const [errorBoundaryKey, setErrorBoundaryKey] = useState(0);

  // Sync theme from settings
  useEffect(() => {
    setTheme(settings.theme);
  }, [settings.theme, setTheme]);

  const handleRefresh = () => {
    setErrorBoundaryKey((prev) => prev + 1);
    return refresh();
  };

  const handleClearCacheAndRefresh = async () => {
    setErrorBoundaryKey((prev) => prev + 1);
    return clearCacheAndRefresh();
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="container flex-1 py-8">
        <AppErrorBoundary
          onRefresh={handleRefresh}
          onClearCacheAndRefresh={handleClearCacheAndRefresh}
          resetKey={errorBoundaryKey}
        >
          {selectedPrompt ? (
            <PromptDetail
              prompt={selectedPrompt}
              onBack={() => setSelectedPrompt(null)}
              isLiked={isLiked(selectedPrompt.urlTitle)}
              onToggleLike={() => toggleLike(selectedPrompt.urlTitle)}
            />
          ) : (
            <PromptList
              prompts={prompts}
              isLoading={isLoading}
              isError={isError}
              error={error}
              isRefetching={isRefetching}
              isUsingCache={isUsingCache}
              hasCachedData={hasCachedData}
              onRefresh={handleRefresh}
              onClearCacheAndRefresh={handleClearCacheAndRefresh}
              onSelectPrompt={setSelectedPrompt}
              settings={settings}
              isLiked={isLiked}
              onToggleLike={toggleLike}
            />
          )}
        </AppErrorBoundary>
      </main>

      <Footer />
    </div>
  );
}

export default App;
