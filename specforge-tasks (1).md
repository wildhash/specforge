# SpecForge — Task Breakdown

---

### TASK-001: Define ArtifactState JSON Schema

- **Epic**: Phase 1 — Agent Configuration & Contracts
- **Assignee**: architect
- **Spec Pointer**: Design Spec §5.2 — Public Interfaces and Types
- **Consultants**: None
- **Description**: Produce the canonical `ArtifactState` and `Artifact` JSON schemas that all agents and the Orchestrator will use as their shared contract. Store as `artifacts/schemas/artifact-state.schema.json`.
- **Acceptance Criteria**:
  - [ ] Schema covers all 12 artifact types defined in the file manifest
  - [ ] Schema includes `status` enum: `pending | valid | invalid | needs_revision`
  - [ ] Schema validated with a JSON Schema validator
  - [ ] Stored in Complete.dev workspace at `artifacts/schemas/`

---

### TASK-002: Build Strategist Agent

- **Epic**: Phase 1 — Agent Configuration & Contracts
- **Assignee**: product
- **Spec Pointer**: ADR-002 — Agent Roster; Design Spec §4
- **Consultants**: architect
- **Description**: Configure the Strategist agent in Complete.dev Agent Builder. System prompt must produce: PRD (Markdown), personas (JSON), user stories with acceptance criteria (JSON). Input: raw idea string. Output must conform to `ArtifactState` schema.
- **Acceptance Criteria**:
  - [ ] Agent configured in Complete.dev Agent Builder
  - [ ] Produces valid PRD Markdown on clear idea input
  - [ ] Produces valid PRD with flagged assumption sections on vague idea input
  - [ ] Output JSON conforms to `Artifact` schema
  - [ ] Tested with 3 sample inputs (clear, vague, partial)

---

### TASK-003: Build Architect Agent

- **Epic**: Phase 1 — Agent Configuration & Contracts
- **Assignee**: architect
- **Spec Pointer**: ADR-002 — Agent Roster; Design Spec §5.2
- **Consultants**: None
- **Description**: Configure the Architect agent in Complete.dev Agent Builder. Input: PRD. Output: ADRs (Markdown array), design spec (Markdown). Must follow ADR RFC format and Design Specification format defined in system standards.
- **Acceptance Criteria**:
  - [ ] Agent configured in Complete.dev Agent Builder
  - [ ] Produces ≥1 ADR per major technical decision in the PRD
  - [ ] Produces design spec with architecture diagram (Mermaid), layer breakdown, and file manifest
  - [ ] Output conforms to `Artifact` schema
  - [ ] Tested with 3 sample PRDs

---

### TASK-004: Build Engineer Agent

- **Epic**: Phase 1 — Agent Configuration & Contracts
- **Assignee**: architect
- **Spec Pointer**: Design Spec §5.1 — File Manifest; FR-007
- **Consultants**: None
- **Description**: Configure the Engineer agent. Input: design spec + ADRs. Output: task breakdown (JSON), code scaffolding (file tree + stub files), GitHub repo push via token.
- **Acceptance Criteria**:
  - [ ] Agent configured in Complete.dev Agent Builder
  - [ ] Produces structured task JSON with title, description, acceptance criteria per task
  - [ ] Scaffolds a valid Next.js project structure
  - [ ] Pushes scaffolding to GitHub repo when token is available
  - [ ] Gracefully stores in workspace when token is unavailable

---

### TASK-005: Build Copywriter Agent

- **Epic**: Phase 1 — Agent Configuration & Contracts
- **Assignee**: copywriter
- **Spec Pointer**: ADR-002 — Agent Roster; PRD §3 Personas
- **Consultants**: product
- **Description**: Configure the Copywriter agent. Input: PRD + positioning context. Output: GTM strategy (Markdown), pitch deck narrative (Markdown). Must embed the meta-story angle ("built with SpecForge") as a structural element.
- **Acceptance Criteria**:
  - [ ] Agent configured in Complete.dev Agent Builder
  - [ ] GTM strategy includes: positioning statement, ICP, channel strategy, launch phases, success metrics
  - [ ] Pitch deck includes ≥10 slides with meta-story slide
  - [ ] Output conforms to `Artifact` schema
  - [ ] Tested with 2 sample PRDs

---

### TASK-006: Build QA Sentinel Agent

- **Epic**: Phase 1 — Agent Configuration & Contracts
- **Assignee**: product
- **Spec Pointer**: ADR-002 — Agent Roster; PRD §6 FR-008
- **Consultants**: architect
- **Description**: Configure the QA Sentinel agent. Input: user stories + design spec. Output: test plan (Markdown), risk register (JSON). Test plan must cover happy path, edge cases, and accessibility.
- **Acceptance Criteria**:
  - [ ] Agent configured in Complete.dev Agent Builder
  - [ ] Test plan covers all user stories from PRD
  - [ ] Risk register JSON includes: risk, likelihood, impact, mitigation per entry
  - [ ] Output conforms to `Artifact` schema

---

### TASK-007: Build Orchestrator Agent & DAG Routing Logic

- **Epic**: Phase 2 — Orchestrator Logic
- **Assignee**: architect
- **Spec Pointer**: ADR-003 — DAG Orchestration; Design Spec §4; Design Spec §5.3
- **Consultants**: None
- **Description**: Configure the Orchestrator agent implementing `resolveNextAgents()` logic. Must evaluate `ArtifactState`, determine next agent(s), support parallel invocation of Engineer + Copywriter, and implement retry logic (max 2 retries).
- **Acceptance Criteria**:
  - [ ] Orchestrator correctly sequences: Strategist → Architect → [Engineer ∥ Copywriter] → QA Sentinel
  - [ ] Detects existing artifacts and skips responsible agents (partial-input flow)
  - [ ] Retries failed agent up to 2 times before flagging for user input
  - [ ] Stores `orchestrator/state.json` in workspace after each step
  - [ ] Parallel invocation of Engineer + Copywriter confirmed

---

### TASK-008: End-to-End Pipeline Integration Test

- **Epic**: Phase 3 — Integration
- **Assignee**: architect
- **Spec Pointer**: Implementation Plan §5 — Testing Strategy
- **Consultants**: product
- **Description**: Run three full E2E test scenarios as defined in the implementation plan. Validate all 12 artifact types are produced, stored correctly, and conform to schema.
- **Acceptance Criteria**:
  - [ ] Run 1 (clear idea) produces all 12 artifacts in < 5 minutes
  - [ ] Run 2 (existing PRD) skips Strategist correctly
  - [ ] Run 3 (meta-story: "Build SpecForge") produces demo-quality output
  - [ ] All artifacts stored at correct workspace paths per file manifest
  - [ ] No unhandled agent failures in any run

---

### TASK-009: GitHub Scaffolding & Marketing Site Deployment

- **Epic**: Phase 4 — GitHub & Deployment
- **Assignee**: architect
- **Spec Pointer**: Design Spec §6 — Configuration Changes; PRD FR-007
- **Consultants**: None
- **Description**: Configure GitHub Actions workflow triggered by Engineer agent artifact completion. Deploys marketing site (generated by Copywriter) to GitHub Pages.
- **Acceptance Criteria**:
  - [ ] GitHub Actions workflow file created and committed
  - [ ] Marketing site deploys successfully to GitHub Pages on trigger
  - [ ] Engineer agent scaffolding pushed to correct repo
  - [ ] GitHub token handled securely — never logged

---

### TASK-010: Demo Preparation & Meta-Story Run

- **Epic**: Phase 5 — Polish & Demo
- **Assignee**: product
- **Spec Pointer**: PRD §2 — Goals; GTM Strategy — Live Demo Slide
- **Consultants**: copywriter
- **Description**: Execute the meta-story demo run ("Build SpecForge using SpecForge"), record output, and prepare the live demo script for judging. Ensure all deliverables are in the workspace and the summary view is clean.
- **Acceptance Criteria**:
  - [ ] Meta-story run completes successfully with all 12 artifacts
  - [ ] Demo script written and rehearsed
  - [ ] All hackathon deliverables present in workspace: prototype, GTM, pitch deck, marketing site
  - [ ] Artifact summary view accessible from single entry point
  - [ ] NPS baseline collected from at least 3 test users before demo
