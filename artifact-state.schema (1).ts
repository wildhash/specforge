/**
 * SpecForge — Canonical ArtifactState Schema
 * TASK-001 | Owner: Orchestrator
 * 
 * This is the single source of truth for all artifact contracts
 * flowing between agents in the SpecForge DAG pipeline.
 */

// ─── Agent Names ─────────────────────────────────────────────────────────────

/** All valid agent identifiers in the SpecForge pipeline */
export type AgentName =
  | 'orchestrator'
  | 'strategist'
  | 'architect'
  | 'engineer'
  | 'copywriter'
  | 'qa_sentinel';

// ─── Artifact Status ──────────────────────────────────────────────────────────

/** Lifecycle status of a produced artifact */
export type ArtifactStatus =
  | 'pending'       // Agent invoked, artifact not yet produced
  | 'valid'         // Artifact produced and passed schema validation
  | 'invalid'       // Artifact produced but failed schema validation
  | 'needs_revision'; // Artifact valid but flagged for improvement by Orchestrator

// ─── Base Artifact ────────────────────────────────────────────────────────────

/**
 * A single artifact produced by an agent, with full provenance metadata.
 */
export interface Artifact {
  /** Unique artifact identifier (uuid v4) */
  id: string;
  /** The agent that produced this artifact */
  producedBy: AgentName;
  /** ISO 8601 timestamp of production */
  timestamp: string;
  /** Workspace file path relative to project root */
  filePath: string;
  /** Validation status */
  status: ArtifactStatus;
  /** Number of revision attempts (0 = first pass) */
  revisionCount: number;
  /** Optional validation error details */
  validationErrors?: string[];
}

// ─── Typed Artifact Variants ──────────────────────────────────────────────────

/** PRD artifact — produced by Strategist */
export interface PrdArtifact extends Artifact {
  producedBy: 'strategist';
  /** Extracted metadata for downstream agents */
  meta: {
    productName: string;
    targetPersonas: string[];
    epicCount: number;
    userStoryCount: number;
  };
}

/** Persona artifact — produced by Strategist */
export interface PersonasArtifact extends Artifact {
  producedBy: 'strategist';
  meta: {
    personaCount: number;
    personaNames: string[];
  };
}

/** User stories artifact — produced by Strategist */
export interface UserStoriesArtifact extends Artifact {
  producedBy: 'strategist';
  meta: {
    storyCount: number;
    epicIds: string[];
  };
}

/** ADR artifact — produced by Architect (one per decision) */
export interface AdrArtifact extends Artifact {
  producedBy: 'architect';
  meta: {
    adrId: string;   // e.g. "20260302-R-001"
    title: string;
    status: 'Proposed' | 'Accepted' | 'Deprecated' | 'Superseded';
  };
}

/** Design spec artifact — produced by Architect */
export interface DesignSpecArtifact extends Artifact {
  producedBy: 'architect';
  meta: {
    componentCount: number;
    hasArchitectureDiagram: boolean;
    newDependencies: string[];
  };
}

/** Task breakdown artifact — produced by Engineer */
export interface TasksArtifact extends Artifact {
  producedBy: 'engineer';
  meta: {
    taskCount: number;
    phaseCount: number;
    criticalPathTaskIds: string[];
  };
}

/** Code scaffolding artifact — produced by Engineer */
export interface ScaffoldingArtifact extends Artifact {
  producedBy: 'engineer';
  meta: {
    fileCount: number;
    techStack: string[];
    repoUrl?: string;
  };
}

/** GTM strategy artifact — produced by Copywriter */
export interface GtmStrategyArtifact extends Artifact {
  producedBy: 'copywriter';
  meta: {
    targetChannels: string[];
    launchPhaseCount: number;
  };
}

/** Pitch deck artifact — produced by Copywriter */
export interface PitchDeckArtifact extends Artifact {
  producedBy: 'copywriter';
  meta: {
    slideCount: number;
    hasDemoSlide: boolean;
    hasMetaStorySlide: boolean;
  };
}

/** Test plan artifact — produced by QA Sentinel */
export interface TestPlanArtifact extends Artifact {
  producedBy: 'qa_sentinel';
  meta: {
    unitTestCount: number;
    integrationTestCount: number;
    e2eFlowCount: number;
  };
}

/** Risk register artifact — produced by QA Sentinel */
export interface RiskRegisterArtifact extends Artifact {
  producedBy: 'qa_sentinel';
  meta: {
    riskCount: number;
    highSeverityCount: number;
  };
}

// ─── Orchestration Plan ───────────────────────────────────────────────────────

/** A single node in the Orchestrator's execution DAG */
export interface DagNode {
  /** Agent to invoke */
  agent: AgentName;
  /** Agents that must complete before this node executes */
  dependsOn: AgentName[];
  /** Current execution status of this node */
  status: 'waiting' | 'running' | 'complete' | 'failed' | 'skipped';
  /** ISO timestamp when execution started */
  startedAt?: string;
  /** ISO timestamp when execution completed */
  completedAt?: string;
  /** Error message if status is 'failed' */
  error?: string;
}

/** The full orchestration execution plan */
export interface OrchestrationPlan {
  /** Unique run identifier */
  runId: string;
  /** ISO timestamp when run was initiated */
  initiatedAt: string;
  /** DAG nodes in topological order */
  nodes: DagNode[];
  /** Overall pipeline status */
  pipelineStatus: 'initializing' | 'running' | 'complete' | 'failed' | 'partial';
}

// ─── Canonical ArtifactState ──────────────────────────────────────────────────

/**
 * The canonical state object tracked by the Orchestrator throughout
 * the SpecForge pipeline. This is the single source of truth for
 * all artifact provenance, status, and routing decisions.
 * 
 * Stored as: orchestrator/state.json in the Complete.dev workspace.
 */
export interface ArtifactState {
  /** Unique run identifier (matches OrchestrationPlan.runId) */
  runId: string;
  /** The raw idea string submitted by the user */
  ideaRaw: string;
  /** ISO timestamp of run initiation */
  createdAt: string;
  /** ISO timestamp of last state mutation */
  updatedAt: string;
  /** Current orchestration plan and DAG status */
  orchestrationPlan: OrchestrationPlan;

  // ── Strategist Outputs ──
  prd?: PrdArtifact;
  personas?: PersonasArtifact;
  userStories?: UserStoriesArtifact;

  // ── Architect Outputs ──
  adrs?: AdrArtifact[];
  designSpec?: DesignSpecArtifact;

  // ── Engineer Outputs ──
  tasks?: TasksArtifact;
  scaffolding?: ScaffoldingArtifact;

  // ── Copywriter Outputs ──
  gtmStrategy?: GtmStrategyArtifact;
  pitchDeck?: PitchDeckArtifact;

  // ── QA Sentinel Outputs ──
  testPlan?: TestPlanArtifact;
  riskRegister?: RiskRegisterArtifact;
}

// ─── Validation Result ────────────────────────────────────────────────────────

/** Result of artifact schema validation */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ─── State Mutation Helpers ───────────────────────────────────────────────────

/**
 * Entry point — initializes a fresh ArtifactState for a new run.
 * @param idea - Raw user idea string
 * @param runId - UUID for this run
 * @returns Initialized ArtifactState with empty orchestration plan
 */
export declare function initializeArtifactState(idea: string, runId: string): ArtifactState;

/**
 * Evaluates current ArtifactState and returns next agent(s) ready to invoke.
 * Respects DAG dependency ordering and parallel execution opportunities.
 * @param state - Current artifact state
 * @returns Ordered list of agents ready to run (parallel-safe)
 */
export declare function resolveNextAgents(state: ArtifactState): AgentName[];

/**
 * Merges a newly produced artifact into the state and updates timestamps.
 * @param state - Current artifact state
 * @param artifact - The newly produced artifact
 * @returns Updated ArtifactState
 */
export declare function mergeArtifact(state: ArtifactState, artifact: Artifact): ArtifactState;

/**
 * Validates an artifact against its expected schema.
 * @param artifact - The artifact to validate
 * @returns ValidationResult with error and warning details
 */
export declare function validateArtifact(artifact: Artifact): ValidationResult;

/**
 * Checks whether the pipeline is complete (all required artifacts valid).
 * @param state - Current artifact state
 * @returns true if all required artifacts are present and valid
 */
export declare function isPipelineComplete(state: ArtifactState): boolean;
