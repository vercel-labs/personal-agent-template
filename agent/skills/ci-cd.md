# CI/CD Skill

Automate quality gates and safe delivery.

## Pipeline
1. Install dependencies deterministically.
2. Run formatting/lint checks.
3. Run typecheck.
4. Run unit/integration tests.
5. Build production artifacts.
6. Run smoke or end-to-end checks when available.
7. Deploy only after required gates pass.
8. Verify the deployed URL and runtime health.

Do not bypass failing gates to make a deployment appear green.
