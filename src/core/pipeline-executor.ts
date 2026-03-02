import {
  isPipelineComplete,
  mergeArtifact,
  resolveNextAgents,
  updateDagNodeStatus,
  validateArtifact,
} from './orchestrator-state-init';
import type { AgentName, Artifact, ArtifactState } from './artifact-state.schema';
import { setPipelineState } from './state-store';

export function startPipelineExecution(runId: string, initialState: ArtifactState): void {
  console.log(`[SpecForge] Starting pipeline execution for runId: ${runId}`);
  setPipelineState(runId, initialState);
  console.log(`[SpecForge] State stored for runId: ${runId}. Idea: "${initialState.ideaRaw.substring(0, 50)}..."`);
  void executePipeline(runId, initialState).catch((err) =>
    console.error(`[SpecForge] Pipeline ${runId} failed:`, err)
  );
}

async function executePipeline(runId: string, state: ArtifactState): Promise<void> {
  let currentState = state;
  setPipelineState(runId, currentState);

  const maxIterations = parsePositiveInt(process.env.PIPELINE_MAX_ITERATIONS, 20, 'PIPELINE_MAX_ITERATIONS');
  let iterations = 0;

  while (!isPipelineComplete(currentState) && iterations < maxIterations) {
    iterations++;

    const nextAgents = resolveNextAgents(currentState);
    if (nextAgents.length === 0) {
      if (currentState.orchestrationPlan.nodes.some((n) => n.status === 'failed')) return;
      await sleep(750);
      continue;
    }

    for (const agent of nextAgents) {
      currentState = updateDagNodeStatus(currentState, agent, 'running');
    }
    setPipelineState(runId, currentState);

    const results = await Promise.allSettled(nextAgents.map((agent) => invokeAgent(agent, currentState)));

    for (let i = 0; i < results.length; i++) {
      const agent = nextAgents[i];
      const result = results[i];

      if (result.status === 'fulfilled') {
        for (const artifact of result.value) {
          const validation = validateArtifact(artifact);
          if (!validation.valid) {
            artifact.status = 'invalid';
            artifact.validationErrors = validation.errors;
          }
          currentState = mergeArtifact(currentState, artifact);
        }
        currentState = updateDagNodeStatus(currentState, agent, 'complete');
      } else {
        currentState = updateDagNodeStatus(currentState, agent, 'failed', String(result.reason));
      }

      setPipelineState(runId, currentState);
    }

    if (currentState.orchestrationPlan.nodes.some((n) => n.status === 'failed')) return;
  }
}

async function invokeAgent(agent: AgentName, state: ArtifactState): Promise<Artifact[]> {
  const completeApiUrl = process.env.COMPLETE_API_URL;
  const completeApiKey = process.env.COMPLETE_API_KEY;

  if (!completeApiUrl) throw new Error('Missing COMPLETE_API_URL');
  if (!completeApiKey) throw new Error('Missing COMPLETE_API_KEY');

  const AGENT_IDS: Record<AgentName, string> = {
    orchestrator: process.env.AGENT_ID_ORCHESTRATOR ?? '',
    strategist: process.env.AGENT_ID_STRATEGIST ?? '',
    architect: process.env.AGENT_ID_ARCHITECT ?? '',
    engineer: process.env.AGENT_ID_ENGINEER ?? '',
    copywriter: process.env.AGENT_ID_COPYWRITER ?? '',
    qa_sentinel: process.env.AGENT_ID_QA_SENTINEL ?? '',
  };

  const agentId = AGENT_IDS[agent];
  if (!agentId) throw new Error(`No agent ID configured for: ${agent}`);

  const response = await fetch(`${completeApiUrl}/agents/${agentId}/invoke`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${completeApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      runId: state.runId,
      idea: state.ideaRaw,
      currentState: state,
      agentRole: agent,
    }),
  });

  if (!response.ok) throw new Error(`Agent ${agent} failed: ${response.status}`);
  const data = await response.json();
  return data.artifacts ?? [];
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function parsePositiveInt(
  value: string | undefined,
  defaultValue: number,
  label = 'value'
): number {
  if (value == null || value === '') return defaultValue;

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    console.warn(`[SpecForge] Invalid ${label} '${value}', falling back to ${defaultValue}`);
    return defaultValue;
  }

  return parsed;
}
