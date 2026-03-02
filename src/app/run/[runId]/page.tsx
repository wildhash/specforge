'use client';

/**
* SpecForge — Run Status + Output Package Page
* src/app/run/[runId]/page.tsx
 */

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { ArtifactState, Artifact } from '@/core/artifact-state.schema';

function ArtifactCard({ title, icon, artifact }: { title: string; icon: string; artifact?: Artifact }) {
  const status = artifact?.status ?? 'pending';
  return (
    <div className="flex flex-col gap-3 p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><span className="text-2xl">{icon}</span><span className="text-white font-semibold">{title}</span></div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${status === 'valid' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300 animate-pulse'}`}>{status}</span>
      </div>
      {artifact?.filePath && <p className="text-slate-500 text-xs font-mono truncate">{artifact.filePath}</p>}
      <button disabled={!artifact || status !== 'valid'} className="mt-auto py-2 px-4 rounded-xl bg-purple-600/30 border border-purple-500/30 text-purple-300 text-sm font-medium hover:bg-purple-600/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">View Artifact →</button>
    </div>
  );
}

export default function RunPage() {
  const { runId } = useParams<{ runId: string }>();
  const [state, setState] = useState<ArtifactState | null>(null);
  const [complete, setComplete] = useState(false);
  const [pipelineStatus, setPipelineStatus] = useState<ArtifactState['orchestrationPlan']['pipelineStatus'] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!runId) return;

    let stopped = false;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    const poll = async () => {
      try {
        const res = await fetch(`/api/pipeline/status?runId=${runId}`);
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const data = (await res.json()) as {
          state?: ArtifactState;
          complete?: boolean;
          pipelineStatus?: ArtifactState['orchestrationPlan']['pipelineStatus'];
        };
        if (stopped) return;

        const status = data.pipelineStatus ?? null;
        setState(data.state ?? null);
        setComplete(Boolean(data.complete));
        setPipelineStatus(status);

        if (status === 'failed') {
          const failedNode = data.state?.orchestrationPlan.nodes.find((n) => n.status === 'failed');
          setLoadError(failedNode?.error ?? 'Pipeline failed.');
        } else {
          setLoadError(null);
        }

        if ((data.complete || status === 'failed') && intervalId) {
          clearInterval(intervalId);
          intervalId = undefined;
        }
      } catch {
        if (stopped) return;
        setLoadError('Failed to load pipeline status.');
      }
    };

    void poll();
    intervalId = setInterval(() => void poll(), 1000);
    return () => {
      stopped = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [runId]);

  const groups = [
    { label: 'Strategy', color: 'from-yellow-500 to-orange-500', items: [{ title: 'PRD', icon: '📋', artifact: state?.prd }, { title: 'Personas', icon: '👥', artifact: state?.personas }, { title: 'User Stories', icon: '📖', artifact: state?.userStories }] },
    { label: 'Architecture', color: 'from-purple-500 to-violet-500', items: [{ title: 'ADRs', icon: '🏛️', artifact: state?.adrs?.[0] }, { title: 'Design Spec', icon: '📐', artifact: state?.designSpec }] },
    { label: 'Engineering', color: 'from-green-500 to-emerald-500', items: [{ title: 'Task Breakdown', icon: '✅', artifact: state?.tasks }, { title: 'Scaffolding', icon: '⚙️', artifact: state?.scaffolding }] },
    { label: 'Go-to-Market', color: 'from-pink-500 to-rose-500', items: [{ title: 'GTM Strategy', icon: '🚀', artifact: state?.gtmStrategy }, { title: 'Pitch Deck', icon: '🎯', artifact: state?.pitchDeck }] },
    { label: 'Quality', color: 'from-red-500 to-orange-500', items: [{ title: 'Test Plan', icon: '🧪', artifact: state?.testPlan }, { title: 'Risk Register', icon: '⚠️', artifact: state?.riskRegister }] },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
      <div className="container mx-auto px-4 py-16 flex flex-col items-center gap-12 max-w-5xl">
        <div className="text-center space-y-4">
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm ${
              pipelineStatus === 'failed'
                ? 'bg-red-500/20 border-red-500/30 text-red-300'
                : complete
                  ? 'bg-green-500/20 border-green-500/30 text-green-300'
                  : 'bg-purple-500/20 border-purple-500/30 text-purple-300 animate-pulse'
            }`}
          >
            {pipelineStatus === 'failed'
              ? 'Pipeline failed'
              : complete
                ? '✓ Product Package Assembled'
                : 'Assembling product package…'}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white">Your Product Package</h1>
          <p className="text-slate-400 font-mono text-sm">Run ID: {runId}</p>
        </div>
        {loadError && (
          <div className="w-full px-4 py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
            {loadError}
          </div>
        )}
        {groups.map((group) => (
          <div key={group.label} className="w-full space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${group.color}`} />
              <h2 className="text-white font-semibold text-lg">{group.label}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.items.map((item) => <ArtifactCard key={item.title} {...item} />)}
            </div>
          </div>
        ))}
        <button className="px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-lg hover:from-purple-500 hover:to-pink-500 transition-all transform hover:scale-[1.02] shadow-xl">Download Full Package →</button>
      </div>
    </main>
  );
}
