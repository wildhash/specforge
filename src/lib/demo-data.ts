/**
 * SpecForge — Demo Mode Mock Data
 * Provides realistic mock data for GitHub Pages demo
 */

import type { ArtifactState, Artifact } from '@/core/artifact-state.schema';

export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export function createMockArtifact(
  id: string,
  producedBy: Artifact['producedBy'],
  filePath: string,
  status: Artifact['status'] = 'valid'
): Artifact {
  return {
    id,
    producedBy,
    timestamp: new Date().toISOString(),
    filePath,
    status,
    revisionCount: 0,
  };
}

export function generateDemoState(idea: string, runId: string): ArtifactState {
  const now = new Date().toISOString();
  
  return {
    runId,
    ideaRaw: idea,
    createdAt: now,
    updatedAt: now,
    prd: {
      ...createMockArtifact('prd-001', 'strategist', 'artifacts/prd.md'),
      meta: {
        productName: 'AI Product Engine',
        targetPersonas: ['Solo Founders', 'Product Managers', 'Startup Teams'],
        epicCount: 5,
        userStoryCount: 24,
      },
    } as unknown as ArtifactState['prd'],
    personas: {
      ...createMockArtifact('personas-001', 'strategist', 'artifacts/personas.json'),
      meta: {
        personaCount: 3,
        personaNames: ['Solo Sarah', 'PM Pete', 'Startup Sam'],
      },
    } as unknown as ArtifactState['personas'],
    userStories: {
      ...createMockArtifact('stories-001', 'strategist', 'artifacts/user-stories.json'),
      meta: {
        storyCount: 24,
        epicIds: ['EPIC-001', 'EPIC-002', 'EPIC-003', 'EPIC-004', 'EPIC-005'],
      },
    } as unknown as ArtifactState['userStories'],
    adrs: [
      {
        ...createMockArtifact('adr-001', 'architect', 'artifacts/adrs/20260302-R-001-nextjs-framework.md'),
        meta: {
          adrId: '20260302-R-001',
          title: 'Use Next.js 14 as Application Framework',
          status: 'Accepted' as const,
        },
      } as NonNullable<ArtifactState['adrs']>[number],
      {
        ...createMockArtifact('adr-002', 'architect', 'artifacts/adrs/20260302-R-002-dag-orchestration.md'),
        meta: {
          adrId: '20260302-R-002',
          title: 'Implement DAG-Based Agent Orchestration',
          status: 'Accepted' as const,
        },
      } as NonNullable<ArtifactState['adrs']>[number],
    ],
    designSpec: {
      ...createMockArtifact('design-001', 'architect', 'artifacts/design-spec.md'),
      meta: {
        componentCount: 12,
        hasArchitectureDiagram: true,
        newDependencies: ['next', 'react', 'zod', 'tailwindcss'],
      },
    } as unknown as ArtifactState['designSpec'],
    tasks: {
      ...createMockArtifact('tasks-001', 'engineer', 'artifacts/tasks.json'),
      meta: {
        taskCount: 18,
        phaseCount: 4,
        criticalPathTaskIds: ['TASK-001', 'TASK-007', 'TASK-012'],
      },
    } as unknown as ArtifactState['tasks'],
    scaffolding: {
      ...createMockArtifact('scaffold-001', 'engineer', 'artifacts/scaffolding/'),
      meta: {
        fileCount: 28,
        techStack: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Vitest'],
        repoUrl: 'https://github.com/specforge/demo-project',
      },
    } as unknown as ArtifactState['scaffolding'],
    gtmStrategy: {
      ...createMockArtifact('gtm-001', 'copywriter', 'artifacts/gtm-strategy.md'),
      meta: {
        targetChannels: ['Product Hunt', 'Hacker News', 'Twitter/X', 'LinkedIn'],
        launchPhaseCount: 3,
      },
    } as unknown as ArtifactState['gtmStrategy'],
    pitchDeck: {
      ...createMockArtifact('pitch-001', 'copywriter', 'artifacts/pitch-deck.md'),
      meta: {
        slideCount: 12,
        hasDemoSlide: true,
        hasMetaStorySlide: true,
      },
    } as unknown as ArtifactState['pitchDeck'],
    testPlan: {
      ...createMockArtifact('test-001', 'qa_sentinel', 'artifacts/test-plan.md'),
      meta: {
        unitTestCount: 42,
        integrationTestCount: 18,
        e2eFlowCount: 6,
      },
    } as unknown as ArtifactState['testPlan'],
    riskRegister: {
      ...createMockArtifact('risk-001', 'qa_sentinel', 'artifacts/risk-register.json'),
      meta: {
        riskCount: 8,
        criticalRiskCount: 2,
      },
    } as unknown as ArtifactState['riskRegister'],
    orchestrationPlan: {
      runId,
      initiatedAt: now,
      pipelineStatus: 'complete',
      nodes: [
        { agent: 'strategist', dependsOn: [], status: 'complete', startedAt: now, completedAt: now },
        { agent: 'architect', dependsOn: ['strategist'], status: 'complete', startedAt: now, completedAt: now },
        { agent: 'engineer', dependsOn: ['architect'], status: 'complete', startedAt: now, completedAt: now },
        { agent: 'copywriter', dependsOn: ['architect'], status: 'complete', startedAt: now, completedAt: now },
        { agent: 'qa_sentinel', dependsOn: ['strategist', 'architect', 'engineer', 'copywriter'], status: 'complete', startedAt: now, completedAt: now },
      ],
    },
  };
}

export function simulatePipelineProgress(
  idea: string,
  runId: string,
  progress: number // 0-100
): ArtifactState {
  const baseState = generateDemoState(idea, runId);
  
  if (progress < 20) {
    return {
      ...baseState,
      prd: undefined,
      personas: undefined,
      userStories: undefined,
      adrs: undefined,
      designSpec: undefined,
      tasks: undefined,
      scaffolding: undefined,
      gtmStrategy: undefined,
      pitchDeck: undefined,
      testPlan: undefined,
      riskRegister: undefined,
      orchestrationPlan: {
        ...baseState.orchestrationPlan,
        pipelineStatus: 'running',
        nodes: baseState.orchestrationPlan.nodes.map(n => ({ ...n, status: 'waiting' })),
      },
    };
  }
  
  if (progress < 40) {
    return {
      ...baseState,
      adrs: undefined,
      designSpec: undefined,
      tasks: undefined,
      scaffolding: undefined,
      gtmStrategy: undefined,
      pitchDeck: undefined,
      testPlan: undefined,
      riskRegister: undefined,
      orchestrationPlan: {
        ...baseState.orchestrationPlan,
        pipelineStatus: 'running',
        nodes: baseState.orchestrationPlan.nodes.map(n => 
          n.agent === 'strategist' ? { ...n, status: 'complete' } : { ...n, status: 'waiting' }
        ),
      },
    };
  }
  
  if (progress < 60) {
    return {
      ...baseState,
      tasks: undefined,
      scaffolding: undefined,
      gtmStrategy: undefined,
      pitchDeck: undefined,
      testPlan: undefined,
      riskRegister: undefined,
      orchestrationPlan: {
        ...baseState.orchestrationPlan,
        pipelineStatus: 'running',
        nodes: baseState.orchestrationPlan.nodes.map(n => 
          ['strategist', 'architect'].includes(n.agent) ? { ...n, status: 'complete' } : { ...n, status: 'waiting' }
        ),
      },
    };
  }
  
  if (progress < 80) {
    return {
      ...baseState,
      testPlan: undefined,
      riskRegister: undefined,
      orchestrationPlan: {
        ...baseState.orchestrationPlan,
        pipelineStatus: 'running',
        nodes: baseState.orchestrationPlan.nodes.map(n => 
          n.agent === 'qa_sentinel' ? { ...n, status: 'waiting' } : { ...n, status: 'complete' }
        ),
      },
    };
  }
  
  return baseState;
}
