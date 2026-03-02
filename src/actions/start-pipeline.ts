'use server';

import { randomUUID } from 'crypto';
import { initializeArtifactState } from '@/core/orchestrator-state-init';
import { startPipelineExecution } from '@/core/pipeline-executor';

export async function startPipeline(idea: string): Promise<{ runId?: string; error?: string }> {
  if (!idea || idea.trim().length < 10) {
    return { error: 'Idea must be at least 10 characters.' };
  }

  const runId = randomUUID();
  const state = initializeArtifactState(idea.trim(), runId);
  startPipelineExecution(runId, state);
  return { runId };
}
