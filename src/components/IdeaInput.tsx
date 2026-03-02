'use client';

/**
 * SpecForge — Idea Input Component
 * src/components/IdeaInput.tsx
 */

import { useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { startPipeline } from '@/actions/start-pipeline';

const EXAMPLE_IDEAS = [
  'A SaaS tool that helps solo founders validate ideas before building',
  'An AI-powered code review assistant for small engineering teams',
  'A marketplace connecting freelance designers with early-stage startups',
];

export function IdeaInput() {
  const [idea, setIdea] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!idea.trim() || isPending) return;
    setError(null);
    startTransition(() => {
      void (async () => {
        try {
          const { runId, error: pipelineError } = await startPipeline(idea.trim());
          if (pipelineError || !runId) {
            setError(pipelineError ?? 'Unknown error.');
            return;
          }
          router.push(`/run/${runId}`);
        } catch {
          setError('Unknown error.');
        }
      })();
    });
  };

  return (
    <div className="w-full max-w-3xl space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <textarea value={idea} onChange={(e) => setIdea(e.target.value)} placeholder="Describe your product idea in plain English..." className="w-full h-44 px-6 py-5 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-slate-500 text-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all" disabled={isPending} maxLength={2000} />
          <div className="absolute bottom-4 right-5 text-xs text-slate-500">{idea.length}/2000</div>
        </div>
        {error && <div className="px-4 py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm">{error}</div>}
        <button type="submit" disabled={idea.trim().length < 10 || isPending} className="w-full py-5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-lg hover:from-purple-500 hover:to-pink-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all transform hover:scale-[1.01] shadow-xl">
          {isPending ? <span className="flex items-center justify-center gap-3"><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Assembling...</span> : 'Launch SpecForge →'}
        </button>
      </form>
      <div className="space-y-2">
        <p className="text-xs text-slate-500 text-center uppercase tracking-widest">Try an example</p>
        {EXAMPLE_IDEAS.map((ex) => (
          <button
            key={ex}
            onClick={() => !isPending && setIdea(ex)}
            disabled={isPending}
            className="w-full text-left px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-sm hover:bg-white/10 hover:text-white transition-all disabled:opacity-40"
          >
            &quot;{ex}&quot;
          </button>
        ))}
      </div>
    </div>
  );
}
