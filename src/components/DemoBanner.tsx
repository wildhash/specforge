/**
 * SpecForge — Demo Banner Component
 * Displays when running in demo mode
 */

'use client';

export function DemoBanner() {
  // Always show banner in static builds (GitHub Pages)
  const isDemoMode = true;
  
  if (!isDemoMode) return null;
  
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 text-center text-sm font-medium shadow-lg">
      <span className="inline-flex items-center gap-2">
        <span className="text-lg">🎭</span>
        <span>
          <strong>Demo Mode</strong> — This is a static preview with simulated pipeline execution.{' '}
          <a 
            href="https://github.com/wildhash/specforge" 
            target="_blank" 
            rel="noopener noreferrer"
            className="underline hover:text-yellow-100"
          >
            View source on GitHub
          </a>
        </span>
      </span>
    </div>
  );
}
