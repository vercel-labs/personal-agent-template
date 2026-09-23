# Database Skill

Design safe, queryable, evolvable persistence.

## Workflow
1. Inspect schema, migrations, indexes, and access patterns.
2. Model ownership and constraints explicitly.
3. Prefer normalized data unless measured read paths justify denormalization.
4. Add indexes from actual query patterns.
5. Write reversible migrations where practical.
6. Preserve backward compatibility during staged releases.
7. Test migrations and representative queries.

Never expose credentials or execute destructive production operations without explicit authorization.
