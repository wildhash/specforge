/**
 * SpecForge — Run Status + Output Package Page
 * src/app/run/[runId]/page.tsx
 */

import { DemoBanner } from '@/components/DemoBanner';
import { RunPageClient } from '@/components/RunPageClient';

// Generate static params for demo builds
export function generateStaticParams() {
  return [{ runId: 'demo' }];
}

export default function RunPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
      <DemoBanner />
      <RunPageClient />
    </main>
  );
}
