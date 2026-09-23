# Backend Engineering Skill

Implement reliable server-side APIs, services, jobs, and persistence.

## Workflow
1. Inspect server architecture and authentication boundaries.
2. Define request/response contracts and validation.
3. Separate business logic from transport concerns.
4. Enforce authorization at the server boundary.
5. Make mutations idempotent where practical.
6. Return predictable errors and useful logs without secrets.
7. Test success, validation failure, authorization failure, and dependency failure.

## Quality bar
No client-only authorization, silent failures, or undocumented side effects.
