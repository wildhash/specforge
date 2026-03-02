/**
 * SpecForge — Next.js App Scaffold
 * TASK-009 | Owner: architect
 * Version: 1.0 | Date: 2026-03-02
 *
 * FILE MANIFEST:
 * src/
 * ├── app/
 * │   ├── layout.tsx
 * │   ├── page.tsx
 * │   ├── run/[runId]/page.tsx
 * │   └── output/[runId]/page.tsx
 * ├── core/
 * │   ├── artifact-state.schema.ts
 * │   └── orchestrator-state-init.ts
 * ├── actions/
 * │   ├── start-pipeline.ts
 * │   └── poll-pipeline.ts
 * ├── components/
 * │   ├── IdeaInput.tsx
 * │   ├── PipelineProgress.tsx
 * │   ├── ArtifactCard.tsx
 * │   └── OutputPackage.tsx
 * └── lib/
 *     ├── complete-client.ts
 *     └── github-client.ts
 */

export const LandingPage = `
import { IdeaInput } from '@/components/IdeaInput';
export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-24 flex flex-col items-center gap-12">
        <div className="text-center space-y-4 max-w-3xl">
          <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight">
            Idea to Product Package
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400"> in Minutes</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            SpecForge deploys 6 AI agents in parallel to transform your raw idea into a complete product package.
          </p>
        </div>
        <IdeaInput />
      </div>
    </main>
  );
}
`;

export const IdeaInputComponent = `
'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { startPipeline } from '@/actions/start-pipeline';

export function IdeaInput() {
  const [idea, setIdea] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim() || isPending) return;
    startTransition(async () => {
      const { runId, error } = await startPipeline(idea.trim());
      if (error) return;
      router.push('/run/' + runId);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl space-y-4">
      <textarea
        value={idea}
        onChange={(e) => setIdea(e.target.value)}
        placeholder="Describe your product idea..."
        className="w-full h-40 px-6 py-4 rounded-2xl bg-white/10 border border-white/20 text-white"
        disabled={isPending}
        maxLength={2000}
      />
      <button type="submit" disabled={!idea.trim() || isPending}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-lg">
        {isPending ? 'Assembling...' : 'Launch SpecForge →'}
      </button>
    </form>
  );
}
`;

export const StartPipelineAction = `
'use server';
import { initializeArtifactState } from '@/orchestrator';
import { randomUUID } from 'crypto';

export async function startPipeline(idea: string): Promise<{ runId?: string; error?: string }> {
  try {
    if (!idea || idea.trim().length < 10) return { error: 'Idea must be at least 10 characters.' };
    const runId = randomUUID();
    const state = initializeArtifactState(idea.trim(), runId);
    await persistState(runId, state);
    triggerPipelineAsync(runId, state).catch(console.error);
    return { runId };
  } catch (err) {
    return { error: 'Failed to initialize pipeline.' };
  }
}

async function persistState(runId: string, state: unknown) {
  await fetch(process.env.COMPLETE_API_URL + '/files', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + process.env.COMPLETE_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'state-' + runId + '.json', content: JSON.stringify(state, null, 2), spaceId: process.env.COMPLETE_SPACE_ID }),
  });
}

async function triggerPipelineAsync(runId: string, state: unknown) {
  await fetch(process.env.NEXTAUTH_URL + '/api/pipeline/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ runId, state }),
  });
}
`;
