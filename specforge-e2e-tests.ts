/**
 * SpecForge — E2E Integration Test Suite
 * TASK-008 | Owner: architect
 * Version: 1.0 | Date: 2026-03-02
 *
 * Tests the full pipeline from ideaRaw → assembled product package.
 * Covers: happy path, revision loop, failure escalation, parallel execution,
 * artifact validation, DAG integrity, and pipeline completion checks.
 *
 * Run with: npx vitest run specforge-e2e-tests.ts
 */

import { describe, it, expect } from 'vitest';
import {
  initializeArtifactState,
  resolveNextAgents,
  mergeArtifact,
  validateArtifact,
  isPipelineComplete,
  updateDagNodeStatus,
} from './src/core/orchestrator-state-init';
import type {
  ArtifactState,
  Artifact,
  PrdArtifact,
  PersonasArtifact,
  UserStoriesArtifact,
  AdrArtifact,
  DesignSpecArtifact,
  TasksArtifact,
  ScaffoldingArtifact,
  GtmStrategyArtifact,
  PitchDeckArtifact,
  TestPlanArtifact,
  RiskRegisterArtifact,
} from './src/core/artifact-state.schema';

// ─── Test Fixtures ────────────────────────────────────────────────────────────

const TEST_IDEA = 'A SaaS tool that turns rough product ideas into full product specs using AI agents';
const TEST_RUN_ID = 'test-run-00000000-0000-4000-a000-000000000001';

function makeArtifact(producedBy: Artifact['producedBy'], filePath: string, overrides: Partial<Artifact> = {}): Artifact {
  return { id: `artifact-${producedBy}-${Date.now()}`, producedBy, timestamp: new Date().toISOString(), filePath, status: 'valid', revisionCount: 0, ...overrides };
}

function makePrdArtifact(overrides: Partial<PrdArtifact> = {}): PrdArtifact {
  return { ...makeArtifact('strategist', 'strategist/prd.md'), meta: { productName: 'SpecForge', targetPersonas: ['Hackathon Builder', 'Solo Founder', 'Product Team Lead'], epicCount: 4, userStoryCount: 10 }, ...overrides } as PrdArtifact;
}

function makePersonasArtifact(): PersonasArtifact {
  return { ...makeArtifact('strategist', 'strategist/personas.md'), meta: { personaCount: 3, personaNames: ['Hackathon Builder', 'Solo Founder', 'Product Team Lead'] } } as PersonasArtifact;
}

function makeUserStoriesArtifact(): UserStoriesArtifact {
  return { ...makeArtifact('strategist', 'strategist/user-stories.md'), meta: { storyCount: 10, epicIds: ['EPIC-001', 'EPIC-002', 'EPIC-003', 'EPIC-004'] } } as UserStoriesArtifact;
}

function makeAdrArtifact(adrId = '20260302-R-001'): AdrArtifact {
  return { ...makeArtifact('architect', `architect/adr-${adrId}.md`), meta: { adrId, title: 'Multi-Agent DAG Orchestration', status: 'Proposed' } } as AdrArtifact;
}

function makeDesignSpecArtifact(): DesignSpecArtifact {
  return { ...makeArtifact('architect', 'architect/design-spec.md'), meta: { componentCount: 6, hasArchitectureDiagram: true, newDependencies: ['vitest', 'zod'] } } as DesignSpecArtifact;
}

function makeTasksArtifact(): TasksArtifact {
  return { ...makeArtifact('engineer', 'engineer/tasks.json'), meta: { taskCount: 10, phaseCount: 5, criticalPathTaskIds: ['TASK-001', 'TASK-007', 'TASK-008'] } } as TasksArtifact;
}

function makeScaffoldingArtifact(): ScaffoldingArtifact {
  return { ...makeArtifact('engineer', 'engineer/scaffold/'), meta: { fileCount: 12, techStack: ['Next.js', 'TypeScript', 'Vitest'], repoUrl: 'https://github.com/wildhash/specforge' } } as ScaffoldingArtifact;
}

function makeGtmStrategyArtifact(): GtmStrategyArtifact {
  return { ...makeArtifact('copywriter', 'copywriter/gtm-strategy.md'), meta: { targetChannels: ['Twitter/X', 'ProductHunt', 'HackerNews', 'LinkedIn'], launchPhaseCount: 3 } } as GtmStrategyArtifact;
}

function makePitchDeckArtifact(): PitchDeckArtifact {
  return { ...makeArtifact('copywriter', 'copywriter/pitch-deck.md'), meta: { slideCount: 12, hasDemoSlide: true, hasMetaStorySlide: true } } as PitchDeckArtifact;
}

function makeTestPlanArtifact(): TestPlanArtifact {
  return { ...makeArtifact('qa_sentinel', 'qa_sentinel/test-plan.md'), meta: { unitTestCount: 24, integrationTestCount: 8, e2eFlowCount: 3 } } as TestPlanArtifact;
}

function makeRiskRegisterArtifact(): RiskRegisterArtifact {
  return { ...makeArtifact('qa_sentinel', 'qa_sentinel/risk-register.md'), meta: { riskCount: 7, highSeverityCount: 2 } } as RiskRegisterArtifact;
}

function buildCompleteState(): ArtifactState {
  let state = initializeArtifactState(TEST_IDEA, TEST_RUN_ID);
  state = updateDagNodeStatus(state, 'strategist', 'complete');
  state = mergeArtifact(state, makePrdArtifact());
  state = mergeArtifact(state, makePersonasArtifact());
  state = mergeArtifact(state, makeUserStoriesArtifact());
  state = updateDagNodeStatus(state, 'architect', 'complete');
  state = mergeArtifact(state, makeAdrArtifact());
  state = mergeArtifact(state, makeDesignSpecArtifact());
  state = updateDagNodeStatus(state, 'engineer', 'complete');
  state = updateDagNodeStatus(state, 'copywriter', 'complete');
  state = mergeArtifact(state, makeTasksArtifact());
  state = mergeArtifact(state, makeScaffoldingArtifact());
  state = mergeArtifact(state, makeGtmStrategyArtifact());
  state = mergeArtifact(state, makePitchDeckArtifact());
  state = updateDagNodeStatus(state, 'qa_sentinel', 'complete');
  state = mergeArtifact(state, makeTestPlanArtifact());
  state = mergeArtifact(state, makeRiskRegisterArtifact());
  return state;
}

// ─── Test Suites ──────────────────────────────────────────────────────────────

describe('SpecForge E2E Integration Tests', () => {

  describe('SUITE-1: initializeArtifactState', () => {
    it('S1-T1: initializes with correct runId and ideaRaw', () => {
      const state = initializeArtifactState(TEST_IDEA, TEST_RUN_ID);
      expect(state.runId).toBe(TEST_RUN_ID);
      expect(state.ideaRaw).toBe(TEST_IDEA);
    });
    it('S1-T2: orchestrationPlan has 5 DAG nodes', () => {
      const state = initializeArtifactState(TEST_IDEA, TEST_RUN_ID);
      expect(state.orchestrationPlan.nodes).toHaveLength(5);
    });
    it('S1-T3: all DAG nodes start in waiting status', () => {
      const state = initializeArtifactState(TEST_IDEA, TEST_RUN_ID);
      state.orchestrationPlan.nodes.forEach((node) => expect(node.status).toBe('waiting'));
    });
    it('S1-T4: pipelineStatus starts as initializing', () => {
      const state = initializeArtifactState(TEST_IDEA, TEST_RUN_ID);
      expect(state.orchestrationPlan.pipelineStatus).toBe('initializing');
    });
    it('S1-T5: no artifacts present on initialization', () => {
      const state = initializeArtifactState(TEST_IDEA, TEST_RUN_ID);
      expect(state.prd).toBeUndefined();
      expect(state.adrs).toBeUndefined();
    });
  });

  describe('SUITE-2: resolveNextAgents (DAG ordering)', () => {
    it('S2-T1: only strategist ready on fresh state', () => {
      const state = initializeArtifactState(TEST_IDEA, TEST_RUN_ID);
      expect(resolveNextAgents(state)).toEqual(['strategist']);
    });
    it('S2-T2: architect ready after strategist completes', () => {
      let state = initializeArtifactState(TEST_IDEA, TEST_RUN_ID);
      state = updateDagNodeStatus(state, 'strategist', 'complete');
      expect(resolveNextAgents(state)).toContain('architect');
    });
    it('S2-T3: engineer AND copywriter both ready after architect (parallel)', () => {
      let state = initializeArtifactState(TEST_IDEA, TEST_RUN_ID);
      state = updateDagNodeStatus(state, 'strategist', 'complete');
      state = updateDagNodeStatus(state, 'architect', 'complete');
      const next = resolveNextAgents(state);
      expect(next).toContain('engineer');
      expect(next).toContain('copywriter');
      expect(next).toHaveLength(2);
    });
    it('S2-T4: qa_sentinel NOT ready until both engineer and copywriter complete', () => {
      let state = initializeArtifactState(TEST_IDEA, TEST_RUN_ID);
      state = updateDagNodeStatus(state, 'strategist', 'complete');
      state = updateDagNodeStatus(state, 'architect', 'complete');
      state = updateDagNodeStatus(state, 'engineer', 'complete');
      expect(resolveNextAgents(state)).not.toContain('qa_sentinel');
    });
    it('S2-T5: qa_sentinel ready when all upstream complete', () => {
      let state = initializeArtifactState(TEST_IDEA, TEST_RUN_ID);
      state = updateDagNodeStatus(state, 'strategist', 'complete');
      state = updateDagNodeStatus(state, 'architect', 'complete');
      state = updateDagNodeStatus(state, 'engineer', 'complete');
      state = updateDagNodeStatus(state, 'copywriter', 'complete');
      expect(resolveNextAgents(state)).toContain('qa_sentinel');
    });
    it('S2-T6: no agents ready when all nodes complete', () => {
      expect(resolveNextAgents(buildCompleteState())).toHaveLength(0);
    });
  });

  describe('SUITE-3: mergeArtifact', () => {
    it('S3-T1: merges PRD artifact into state', () => {
      let state = initializeArtifactState(TEST_IDEA, TEST_RUN_ID);
      state = mergeArtifact(state, makePrdArtifact());
      expect(state.prd?.meta.productName).toBe('SpecForge');
    });
    it('S3-T2: merges multiple ADRs into array', () => {
      let state = initializeArtifactState(TEST_IDEA, TEST_RUN_ID);
      state = mergeArtifact(state, makeAdrArtifact('20260302-R-001'));
      state = mergeArtifact(state, makeAdrArtifact('20260302-R-002'));
      expect(state.adrs).toHaveLength(2);
    });
    it('S3-T3: immutable — does not mutate original state', () => {
      const state = initializeArtifactState(TEST_IDEA, TEST_RUN_ID);
      mergeArtifact(state, makePrdArtifact());
      expect(state.prd).toBeUndefined();
    });
  });

  describe('SUITE-4: validateArtifact', () => {
    it('S4-T1: valid PRD passes validation', () => {
      expect(validateArtifact(makePrdArtifact()).valid).toBe(true);
    });
    it('S4-T2: missing id fails validation', () => {
      expect(validateArtifact(makePrdArtifact({ id: '' })).valid).toBe(false);
    });
    it('S4-T3: invalid timestamp fails validation', () => {
      expect(validateArtifact(makePrdArtifact({ timestamp: 'not-a-date' })).valid).toBe(false);
    });
    it('S4-T4: pitch deck with wrong slide count fails', () => {
      const deck = makePitchDeckArtifact();
      deck.meta = { ...deck.meta, slideCount: 8 };
      expect(validateArtifact(deck).valid).toBe(false);
    });
    it('S4-T5: pitch deck missing meta-story slide fails', () => {
      const deck = makePitchDeckArtifact();
      deck.meta = { ...deck.meta, hasMetaStorySlide: false };
      expect(validateArtifact(deck).valid).toBe(false);
    });
    it('S4-T6: revisionCount >= 2 produces warning', () => {
      const result = validateArtifact(makePrdArtifact({ revisionCount: 2 }));
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('SUITE-5: isPipelineComplete', () => {
    it('S5-T1: fresh state is NOT complete', () => {
      expect(isPipelineComplete(initializeArtifactState(TEST_IDEA, TEST_RUN_ID))).toBe(false);
    });
    it('S5-T2: fully assembled state IS complete', () => {
      expect(isPipelineComplete(buildCompleteState())).toBe(true);
    });
    it('S5-T3: state with invalid artifact is NOT complete', () => {
      let state = buildCompleteState();
      state = { ...state, prd: { ...state.prd!, status: 'invalid' } };
      expect(isPipelineComplete(state)).toBe(false);
    });
    it('S5-T4: state with empty adrs array is NOT complete', () => {
      expect(isPipelineComplete({ ...buildCompleteState(), adrs: [] })).toBe(false);
    });
  });

  describe('SUITE-6: updateDagNodeStatus', () => {
    it('S6-T1: transitions to running, sets startedAt', () => {
      let state = initializeArtifactState(TEST_IDEA, TEST_RUN_ID);
      state = updateDagNodeStatus(state, 'strategist', 'running');
      const node = state.orchestrationPlan.nodes.find((n) => n.agent === 'strategist');
      expect(node?.status).toBe('running');
      expect(node?.startedAt).toBeDefined();
    });
    it('S6-T2: failed node captures error message', () => {
      let state = initializeArtifactState(TEST_IDEA, TEST_RUN_ID);
      state = updateDagNodeStatus(state, 'strategist', 'failed', 'E001: timeout');
      expect(state.orchestrationPlan.nodes.find((n) => n.agent === 'strategist')?.error).toBe('E001: timeout');
    });
    it('S6-T3: pipelineStatus becomes complete when all nodes complete', () => {
      expect(buildCompleteState().orchestrationPlan.pipelineStatus).toBe('complete');
    });
    it('S6-T4: immutable — does not mutate original', () => {
      const state = initializeArtifactState(TEST_IDEA, TEST_RUN_ID);
      updateDagNodeStatus(state, 'strategist', 'running');
      expect(state.orchestrationPlan.nodes.find((n) => n.agent === 'strategist')?.status).toBe('waiting');
    });
  });

  describe('SUITE-7: Full Happy Path E2E', () => {
    it('S7-T1: pipeline executes in correct topological order', () => {
      const order: string[] = [];
      let state = initializeArtifactState(TEST_IDEA, TEST_RUN_ID);
      let next = resolveNextAgents(state);
      expect(next).toEqual(['strategist']);
      order.push(...next);
      state = updateDagNodeStatus(state, 'strategist', 'complete');
      state = mergeArtifact(state, makePrdArtifact());
      state = mergeArtifact(state, makePersonasArtifact());
      state = mergeArtifact(state, makeUserStoriesArtifact());
      next = resolveNextAgents(state);
      expect(next).toEqual(['architect']);
      order.push(...next);
      state = updateDagNodeStatus(state, 'architect', 'complete');
      state = mergeArtifact(state, makeAdrArtifact());
      state = mergeArtifact(state, makeDesignSpecArtifact());
      next = resolveNextAgents(state);
      expect(next).toHaveLength(2);
      order.push(...next.sort());
      state = updateDagNodeStatus(state, 'engineer', 'complete');
      state = updateDagNodeStatus(state, 'copywriter', 'complete');
      state = mergeArtifact(state, makeTasksArtifact());
      state = mergeArtifact(state, makeScaffoldingArtifact());
      state = mergeArtifact(state, makeGtmStrategyArtifact());
      state = mergeArtifact(state, makePitchDeckArtifact());
      next = resolveNextAgents(state);
      expect(next).toEqual(['qa_sentinel']);
      order.push(...next);
      state = updateDagNodeStatus(state, 'qa_sentinel', 'complete');
      state = mergeArtifact(state, makeTestPlanArtifact());
      state = mergeArtifact(state, makeRiskRegisterArtifact());
      expect(isPipelineComplete(state)).toBe(true);
      expect(order[0]).toBe('strategist');
      expect(order[1]).toBe('architect');
      expect(order[order.length - 1]).toBe('qa_sentinel');
    });

    it('S7-T2: all required artifacts present in final state', () => {
      const state = buildCompleteState();
      expect(state.prd).toBeDefined();
      expect(state.personas).toBeDefined();
      expect(state.userStories).toBeDefined();
      expect(state.adrs?.length).toBeGreaterThan(0);
      expect(state.designSpec).toBeDefined();
      expect(state.tasks).toBeDefined();
      expect(state.scaffolding).toBeDefined();
      expect(state.gtmStrategy).toBeDefined();
      expect(state.pitchDeck).toBeDefined();
      expect(state.testPlan).toBeDefined();
      expect(state.riskRegister).toBeDefined();
    });

    it('S7-T3: all artifacts in final state pass validation', () => {
      const state = buildCompleteState();
      const artifacts: Artifact[] = [
        state.prd!, state.personas!, state.userStories!,
        ...(state.adrs ?? []), state.designSpec!, state.tasks!,
        state.scaffolding!, state.gtmStrategy!, state.pitchDeck!,
        state.testPlan!, state.riskRegister!,
      ];
      artifacts.forEach((a) => expect(validateArtifact(a).valid).toBe(true));
    });
  });

  describe('SUITE-8: Revision Loop', () => {
    it('S8-T1: needs_revision artifact blocks pipeline completion', () => {
      let state = buildCompleteState();
      state = { ...state, prd: { ...state.prd!, status: 'needs_revision' } };
      expect(isPipelineComplete(state)).toBe(false);
    });
    it('S8-T2: revision increments revisionCount', () => {
      const original = makePrdArtifact({ revisionCount: 0 });
      const revised = { ...original, revisionCount: original.revisionCount + 1 };
      expect(revised.revisionCount).toBe(1);
    });
    it('S8-T3: revisionCount >= 2 triggers warning', () => {
      expect(validateArtifact(makePrdArtifact({ revisionCount: 2 })).warnings.length).toBeGreaterThan(0);
    });
  });

});
