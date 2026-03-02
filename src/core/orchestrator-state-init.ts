/**
 * SpecForge — Orchestrator State Implementation
 * TASK-007 | Owner: architect
 * Version: 1.0 | Date: 2026-03-02
 *
 * Implements the five helper functions declared in artifact-state.schema.ts.
 * This is the runtime core of the Orchestrator — all state mutations flow
 * through these functions.
 */

import type {
  AgentName,
  Artifact,
  ArtifactState,
  ArtifactStatus,
  DagNode,
  OrchestrationPlan,
  PitchDeckArtifact,
  ValidationResult,
} from './artifact-state.schema';

// ─── DAG Definition ───────────────────────────────────────────────────────────

const DAG_NODES: Omit<DagNode, 'status' | 'startedAt' | 'completedAt' | 'error'>[] = [
  { agent: 'strategist', dependsOn: [] },
  { agent: 'architect', dependsOn: ['strategist'] },
  { agent: 'engineer', dependsOn: ['architect'] },
  { agent: 'copywriter', dependsOn: ['architect'] },
  { agent: 'qa_sentinel', dependsOn: ['strategist', 'architect', 'engineer', 'copywriter'] },
];

type RequiredArtifactKey =
  | 'prd'
  | 'personas'
  | 'userStories'
  | 'adrs'
  | 'designSpec'
  | 'tasks'
  | 'scaffolding'
  | 'gtmStrategy'
  | 'pitchDeck'
  | 'testPlan'
  | 'riskRegister';

const REQUIRED_ARTIFACTS: Record<Exclude<AgentName, 'orchestrator'>, RequiredArtifactKey[]> = {
  strategist: ['prd', 'personas', 'userStories'],
  architect: ['adrs', 'designSpec'],
  engineer: ['tasks', 'scaffolding'],
  copywriter: ['gtmStrategy', 'pitchDeck'],
  qa_sentinel: ['testPlan', 'riskRegister'],
};

export function initializeArtifactState(idea: string, runId: string): ArtifactState {
  const now = new Date().toISOString();
  const nodes: DagNode[] = DAG_NODES.map((node) => ({ ...node, status: 'waiting' }));
  const orchestrationPlan: OrchestrationPlan = {
    runId,
    initiatedAt: now,
    nodes,
    pipelineStatus: 'initializing',
  };
  return { runId, ideaRaw: idea, createdAt: now, updatedAt: now, orchestrationPlan };
}

export function resolveNextAgents(state: ArtifactState): AgentName[] {
  const { nodes } = state.orchestrationPlan;
  const statusMap = new Map<AgentName, DagNode['status']>(nodes.map((n) => [n.agent, n.status]));
  const ready: AgentName[] = [];
  for (const node of nodes) {
    if (node.status !== 'waiting') continue;
    const allDepsComplete = node.dependsOn.every((dep) => statusMap.get(dep) === 'complete');
    if (allDepsComplete) ready.push(node.agent);
  }
  return ready;
}

export function mergeArtifact(state: ArtifactState, artifact: Artifact): ArtifactState {
  const now = new Date().toISOString();
  const updates: Partial<ArtifactState> = {};
  const path = artifact.filePath.toLowerCase();
  if (path.includes('prd')) updates.prd = artifact as ArtifactState['prd'];
  else if (path.includes('personas')) updates.personas = artifact as ArtifactState['personas'];
  else if (path.includes('user-stories')) updates.userStories = artifact as ArtifactState['userStories'];
  else if (path.includes('adr')) updates.adrs = [...(state.adrs ?? []), artifact as NonNullable<ArtifactState['adrs']>[number]];
  else if (path.includes('design-spec')) updates.designSpec = artifact as ArtifactState['designSpec'];
  else if (path.includes('tasks')) updates.tasks = artifact as ArtifactState['tasks'];
  else if (path.includes('scaffold')) updates.scaffolding = artifact as ArtifactState['scaffolding'];
  else if (path.includes('gtm')) updates.gtmStrategy = artifact as ArtifactState['gtmStrategy'];
  else if (path.includes('pitch')) updates.pitchDeck = artifact as ArtifactState['pitchDeck'];
  else if (path.includes('test-plan') || path.includes('validation-report')) updates.testPlan = artifact as ArtifactState['testPlan'];
  else if (path.includes('risk')) updates.riskRegister = artifact as ArtifactState['riskRegister'];
  return { ...state, ...updates, updatedAt: now };
}

export function validateArtifact(artifact: Artifact): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!artifact.id) errors.push('Artifact missing required field: id');
  if (!artifact.producedBy) errors.push('Artifact missing required field: producedBy');
  if (!artifact.timestamp) errors.push('Artifact missing required field: timestamp');
  if (!artifact.filePath) errors.push('Artifact missing required field: filePath');
  if (!artifact.status) errors.push('Artifact missing required field: status');
  if (typeof artifact.revisionCount !== 'number') errors.push('Artifact missing required field: revisionCount');
  if (artifact.timestamp && isNaN(Date.parse(artifact.timestamp))) errors.push(`Invalid timestamp format: ${artifact.timestamp}`);
  const validStatuses: ArtifactStatus[] = ['pending', 'valid', 'invalid', 'needs_revision'];
  if (artifact.status && !validStatuses.includes(artifact.status)) errors.push(`Unknown artifact status: ${artifact.status}`);
  const validAgents: AgentName[] = ['orchestrator', 'strategist', 'architect', 'engineer', 'copywriter', 'qa_sentinel'];
  if (artifact.producedBy && !validAgents.includes(artifact.producedBy)) errors.push(`Unknown agent: ${artifact.producedBy}`);
  if (artifact.revisionCount >= 2) warnings.push(`Artifact revised ${artifact.revisionCount} times — approaching max`);
  if (artifact.status === 'needs_revision') warnings.push('Artifact flagged for revision');
  if (artifact.producedBy === 'copywriter' && artifact.filePath.toLowerCase().includes('pitch')) {
    const meta = (artifact as PitchDeckArtifact).meta;
    if (meta.slideCount !== 12) errors.push(`Pitch deck must have exactly 12 slides — found ${meta.slideCount}`);
    if (!meta.hasMetaStorySlide) errors.push('Pitch deck missing required meta-story slide');
  }
  return { valid: errors.length === 0, errors, warnings };
}

export function isPipelineComplete(state: ArtifactState): boolean {
  const { nodes } = state.orchestrationPlan;
  const allNodesComplete = nodes.filter((n) => n.agent !== 'orchestrator').every((n) => n.status === 'complete');
  if (!allNodesComplete) return false;
  const agentsToCheck: Array<Exclude<AgentName, 'orchestrator'>> = [
    'strategist',
    'architect',
    'engineer',
    'copywriter',
    'qa_sentinel',
  ];
  for (const agent of agentsToCheck) {
    for (const key of REQUIRED_ARTIFACTS[agent]) {
      const artifact = state[key];
      if (!artifact) return false;

      if (Array.isArray(artifact)) {
        if (artifact.length === 0) return false;
        if (artifact.some((a) => a.status !== 'valid')) return false;
      } else {
        if (artifact.status !== 'valid') return false;
      }
    }
  }
  return true;
}

export function updateDagNodeStatus(
  state: ArtifactState,
  agent: AgentName,
  status: DagNode['status'],
  error?: string
): ArtifactState {
  const now = new Date().toISOString();
  const updatedNodes = state.orchestrationPlan.nodes.map((node) => {
    if (node.agent !== agent) return node;
    return {
      ...node,
      status,
      ...(status === 'running' ? { startedAt: now } : {}),
      ...(status === 'complete' || status === 'failed' ? { completedAt: now } : {}),
      ...(error ? { error } : {}),
    };
  });
  const allComplete = updatedNodes.every((n) => n.status === 'complete');
  const anyFailed = updatedNodes.some((n) => n.status === 'failed');
  const anyRunning = updatedNodes.some((n) => n.status === 'running');
  const pipelineStatus: OrchestrationPlan['pipelineStatus'] = allComplete ? 'complete' : anyFailed ? 'failed' : anyRunning ? 'running' : 'initializing';
  return { ...state, updatedAt: now, orchestrationPlan: { ...state.orchestrationPlan, nodes: updatedNodes, pipelineStatus } };
}
