# Implementation Plan: SpecForge

## 1. Implementation Phases

- **Phase 1 — Agent Configuration & Contracts**: Build and test all six agents in Complete.dev Agent Builder with validated system prompts and JSON I/O contracts. Establish `ArtifactState` schema and workspace file structure.
- **Phase 2 — Orchestrator Logic**: Implement DAG routing, artifact state evaluation, parallel invocation (Engineer + Copywriter), and retry logic (max 2 retries per agent).
- **Phase 3 — End-to-End Pipeline Integration**: Wire all agents through the Orchestrator, validate full happy-path run from raw idea to complete package, test partial-input (skip) flows.
- **Phase 4 — GitHub Scaffolding & Deployment**: Engineer agent pushes scaffolding to GitHub repo via token; GitHub Actions deploys marketing site to GitHub Pages.
- **Phase 5 — Polish & Demo Prep**: Artifact summary view, assumption flagging, revision flow, meta-story demo run (SpecForge speccing itself).

## 2. Milestones and Deliverables

- **Milestone 1 (End of Phase 1)**: All six agents operational in Agent Builder; I/O contracts validated with sample inputs.
- **Milestone 2 (End of Phase 2)**: Orchestrator routes correctly through full DAG; parallel execution confirmed; retry logic tested.
- **Milestone 3 (End of Phase 3)**: Full pipeline produces all 12 artifact types from a single raw idea input; partial-input flow verified.
- **Milestone 4 (End of Phase 4)**: GitHub repo scaffolded automatically; marketing site live on GitHub Pages.
- **Milestone 5 (End of Phase 5)**: Demo-ready; meta-story run recorded; all deliverables in workspace.

## 3. Sequencing and Dependencies

```
Phase 1 (Agents) → Phase 2 (Orchestrator) → Phase 3 (Integration)
                                                      ↓
                                          Phase 4 (GitHub) runs in parallel with Phase 5 (Polish)
```

- Phase 2 is blocked by Phase 1 — Orchestrator cannot route to agents that don't exist yet.
- Phase 3 is blocked by Phase 2 — integration requires working routing logic.
- Phase 4 and Phase 5 can run in parallel once Phase 3 is stable.
- **Critical path**: Agent prompts → Orchestrator DAG → Full pipeline run.

## 4. Breaking Changes Strategy

- No external consumers at MVP stage — no backward compatibility constraints.
- `ArtifactState` schema is the internal contract; any changes during Phase 1–2 are acceptable before Phase 3 locks it.
- After Phase 3 milestone, `ArtifactState` schema is frozen — changes require explicit sign-off.
- GitHub scaffolding is additive only — no destructive repo operations.

## 5. Testing Strategy

- **Unit Tests**: Each agent tested in isolation with 3 sample inputs: (1) clear idea, (2) vague idea, (3) partial artifact input. Validate output schema conformance.
- **Integration Tests**: Orchestrator routing tested with mock agent outputs covering: happy path, agent failure + retry, parallel execution, partial-input skip flow.
- **End-to-End (E2E) Tests**:
  - Run 1: "Build a task management app for remote teams" → full 12-artifact package
  - Run 2: Provide existing PRD → verify Strategist is skipped
  - Run 3: Meta-story run — "Build SpecForge" → used as live demo

## 6. Rollout Plan

- **Hackathon Demo**: Single-instance deployment, live demo run during judging using the meta-story (SpecForge speccing itself).
- **Post-Hackathon**: Canary release to 10 beta users (solo founders from persona 2); collect NPS and artifact quality feedback before broader rollout.
- **Feature flags**: Partial-input flow and revision flow behind flags for post-MVP enablement.
