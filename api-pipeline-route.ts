/**
 * SpecForge — Pipeline API Routes
 * src/app/api/pipeline/
 * POST /api/pipeline/execute — Trigger pipeline
 * GET  /api/pipeline/status  — Poll state
 */

import { NextRequest, NextResponse } from 'next/server';
import { resolveNextAgents, mergeArtifact, validateArtifact, updateDagNodeStatus, isPipelineComplete } from '@/core/orchestrator-state-init';
import type { ArtifactState, AgentName, Artifact } from '@/core/artifact-state.schema';

const STATE_STORE = new Map<string, ArtifactState>();

export async function POST_execute(req: NextRequest): Promise<NextResponse> {
  try {
    const { runId, state: initialState } = await req.json();
    if (!runId || !initialState) return NextResponse.json({ error: 'Missing runId or state' }, { status: 400 });
    STATE_STORE.set(runId, initialState);
    executePipeline(runId, initialState).catch((err) => console.error(`[SpecForge] Pipeline ${runId} failed:`, err));
    return NextResponse.json({ runId, status: 'started' });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET_status(req: NextRequest): Promise<NextResponse> {
  const runId = req.nextUrl.searchParams.get('runId');
  if (!runId) return NextResponse.json({ error: 'Missing runId' }, { status: 400 });
  const state = STATE_STORE.get(runId);
  if (!state) return NextResponse.json({ error: 'Run not found' }, { status: 404 });
  return NextResponse.json({ runId, state, complete: isPipelineComplete(state) });
}

async function executePipeline(runId: string, state: ArtifactState): Promise<void> {
  let currentState = updateDagNodeStatus(state, 'orchestrator' as AgentName, 'running');
  STATE_STORE.set(runId, currentState);

  const MAX_ITERATIONS = 20;
  let iterations = 0;

  while (!isPipelineComplete(currentState) && iterations < MAX_ITERATIONS) {
    iterations++;
    const nextAgents = resolveNextAgents(currentState);
    if (nextAgents.length === 0) { await sleep(1000); continue; }

    for (const agent of nextAgents) currentState = updateDagNodeStatus(currentState, agent, 'running');
    STATE_STORE.set(runId, currentState);

    const results = await Promise.allSettled(nextAgents.map((agent) => invokeAgent(agent, currentState)));

    for (let i = 0; i < results.length; i++) {
      const agent = nextAgents[i];
      const result = results[i];
      if (result.status === 'fulfilled') {
        for (const artifact of result.value) {
          const validation = validateArtifact(artifact);
          if (!validation.valid) { artifact.status = 'invalid'; artifact.validationErrors = validation.errors; }
          currentState = mergeArtifact(currentState, artifact);
        }
        currentState = updateDagNodeStatus(currentState, agent, 'complete');
      } else {
        currentState = updateDagNodeStatus(currentState, agent, 'failed', String(result.reason));
      }
      STATE_STORE.set(runId, currentState);
    }
  }

  currentState = updateDagNodeStatus(currentState, 'orchestrator' as AgentName, 'complete');
  STATE_STORE.set(runId, currentState);
}

async function invokeAgent(agent: AgentName, state: ArtifactState): Promise<Artifact[]> {
  const AGENT_IDS: Record<AgentName, string> = {
    orchestrator: process.env.AGENT_ID_ORCHESTRATOR ?? '',
    strategist:   process.env.AGENT_ID_STRATEGIST ?? '',
    architect:    process.env.AGENT_ID_ARCHITECT ?? '',
    engineer:     process.env.AGENT_ID_ENGINEER ?? '',
    copywriter:   process.env.AGENT_ID_COPYWRITER ?? '',
    qa_sentinel:  process.env.AGENT_ID_QA_SENTINEL ?? '',
  };
  const agentId = AGENT_IDS[agent];
  if (!agentId) throw new Error(`No agent ID configured for: ${agent}`);
  const response = await fetch(`${process.env.COMPLETE_API_URL}/agents/${agentId}/invoke`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.COMPLETE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ runId: state.runId, idea: state.ideaRaw, currentState: state, agentRole: agent }),
  });
  if (!response.ok) throw new Error(`Agent ${agent} failed: ${response.status}`);
  const data = await response.json();
  return data.artifacts ?? [];
}

function sleep(ms: number): Promise<void> { return new Promise((r) => setTimeout(r, ms)); }

export { POST_execute as POST, GET_status as GET };
