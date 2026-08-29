# Coworkers — Production Workforce Architecture

Coworkers is a local-first desktop AI workforce. It uses real agent runtimes and real tools; the office visualization is a control surface, not a simulator.

## Workforce

- Commander — plans, delegates, coordinates, verifies, escalates.
- Coder — vibe coding, refactoring, debugging, Git/GitHub, project work.
- QA — tests, browser verification, security checks, regression analysis.
- IT Ops — shell, PowerShell, SSH, Docker, Kubernetes, diagnostics, incidents.
- DevOps — CI/CD, deployments, cloud operations, release verification.
- Music — composition, MIDI/audio workflows, stems, rendering.
- Video — scripting, storyboards, assets, voice, editing, rendering.
- Designer — images, branding, thumbnails, UI assets.
- Daily — planning, reminders, personal workflows, approved connectors.
- Research — web research, documentation, synthesis, source tracking.

## Execution model

User request -> Commander plan -> policy check -> specialist agent -> real runtime/tool -> observation -> verification -> audit -> report.

No task may be marked complete from hard-coded terminal output. Command output shown in the UI must originate from a real process or an explicitly marked provider job.

## Free-first providers

No paid provider is mandatory. Each capability supports an adapter chain:

1. Local/open model or local tool when available.
2. Free/open-compatible endpoint.
3. Existing CLI/subscription configured by the user.
4. Optional paid provider.

Media generation is compute-bound; the platform must clearly distinguish free/open software from externally billed generation services.

## Safety

- Tool capabilities are explicit per agent.
- Destructive actions, production mutations, spending, credential changes and scope changes require approval unless the user explicitly enables a policy exception.
- Agents run with least privilege and isolated workspaces where possible.
- Stop/interrupt controls remain available.
- Every execution has task, agent, tool, target, start/end, status and verification metadata.

## Persistence

Use the local desktop persistence layer for agent/task configuration and a durable task/event ledger. Browser localStorage must not be the source of truth for execution state.

## Runtime integration

Munder Difflin is the reference implementation for wrapping real terminal agent CLIs, PTYs, agent memory, mailboxes, supervision and desktop execution. Coworkers should preserve those proven primitives while replacing simulated task execution with real process-backed execution.
