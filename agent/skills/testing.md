# Testing Skill

Provide confidence that behavior remains correct after changes.

## Strategy
- Unit tests for deterministic logic.
- Component tests for important UI behavior.
- Integration tests for API and persistence boundaries.
- End-to-end tests for critical user journeys.

## Workflow
1. Identify changed behavior and failure modes.
2. Reuse existing test infrastructure.
3. Test happy paths and meaningful edge cases.
4. Keep tests deterministic and isolated.
5. Run the narrowest relevant suite first, then required full checks.
6. Report failures with exact commands and evidence.
