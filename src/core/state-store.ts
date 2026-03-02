import type { ArtifactState } from './artifact-state.schema';

const STATE_STORE = new Map<string, ArtifactState>();

export function getPipelineState(runId: string): ArtifactState | undefined {
  return STATE_STORE.get(runId);
}

export function setPipelineState(runId: string, state: ArtifactState): void {
  STATE_STORE.set(runId, state);
}
