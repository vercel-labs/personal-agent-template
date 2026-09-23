# Debugging Skill

Find root causes instead of masking symptoms.

## Workflow
1. Reproduce the failure.
2. Capture exact error, stack, request, environment, and recent change.
3. Narrow the fault domain: UI, state, network, server, database, dependency, or deployment.
4. Form the smallest falsifiable hypothesis.
5. Inspect evidence or instrument the system.
6. Fix the root cause.
7. Add a regression test when practical.
8. Re-run the original reproduction and relevant validation.

Do not declare a fix successful until the failing path has been re-tested.
