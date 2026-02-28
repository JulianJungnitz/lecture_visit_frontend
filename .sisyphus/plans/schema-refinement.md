# Schema Refinement — Lecture Schedules, Admin Profiles, Visit Scheduling

## TL;DR

> **Quick Summary**: Add structured lecture scheduling (new table), admin flag on profiles, visit scheduling field, and drop redundant `visited_at`. Single migration on existing 12-table schema.
> 
> **Deliverables**:
> - 1 new table: `lecture_schedules`
> - 2 new columns: `profiles.is_admin`, `visit_assignments.scheduled_for`
> - 1 dropped column: `visit_assignments.visited_at` (redundant with scheduled_for + status)
> - Updated AGENTS.md documentation
> - Verified via SQL queries
> 
> **Estimated Effort**: Quick
> **Parallel Execution**: YES — 2 waves
> **Critical Path**: Task 1 (migration) → Task 2 (verification) → Task 3 (smoke test)

---

## Context

### Original Request
Refine the existing Supabase schema to support structured lecture scheduling (multiple time slots per lecture with different locations), admin roles, and visit planning dates.

### Interview Summary
**Key Discussions**:
- Lectures can have multiple time slots with different locations → needs separate table
- Schedule format: `day_time` text ("MO 10:00 - 12:00"), `frequency` text ("WEEKLY 13.10.2025 - 06.02.2026" or "SINGLE 10.01.2026")
- Location is a simple text field + room_url link (no campuses/locations table)
- Keep existing `schedule` and `location` fields on `lectures` as raw scraper fallback
- `is_admin` boolean on profiles for role management
- `scheduled_for` replaces `visited_at` on visit_assignments (status field covers whether visit happened)
- No data exists yet — all tables have 0 rows, purely additive migration

### Metis Review
**Identified Gaps** (addressed):
- No data in any table → no data migration concerns, purely additive DDL
- No existing code references any of the affected fields → zero breaking change risk
- lecture_schedules needs FK index on lecture_id
- Consider: should `day_time` format be documented for downstream consumers

---

## Work Objectives

### Core Objective
Apply a single additive migration creating the `lecture_schedules` table and adding `is_admin` and `scheduled_for` columns. Update documentation.

### Concrete Deliverables
- `lecture_schedules` table with FK to lectures
- `profiles.is_admin` boolean column
- `visit_assignments.scheduled_for` timestamptz column
- Updated AGENTS.md

### Definition of Done
- [ ] `lecture_schedules` table exists with correct columns
- [ ] `profiles` has `is_admin` column with default false
- [ ] `visit_assignments` has `scheduled_for` column and `visited_at` is removed
- [ ] FK index on `lecture_schedules.lecture_id`
- [ ] Smoke test passes (insert schedule rows, verify defaults)

### Must Have
- `lecture_schedules` table: id, lecture_id (FK CASCADE), day_time, frequency, location, room_url
- `profiles.is_admin` boolean DEFAULT false
- `visit_assignments.scheduled_for` timestamptz nullable
- `visit_assignments.visited_at` dropped (redundant with scheduled_for + status)
- Index on `lecture_schedules.lecture_id`
- Existing `schedule` and `location` fields on `lectures` kept unchanged

### Must NOT Have (Guardrails)
- NO campuses or locations tables
- NO changes to existing columns or tables beyond the specified additions/removals
- NO RLS policies
- NO data seeding
- NO removal of existing `schedule`/`location` fields on lectures

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed.

### Test Decision
- **Automated tests**: None (DB migration — verified via SQL)
- **Framework**: N/A

### QA Policy
Every task includes agent-executed QA via `supabase_execute_sql` and `supabase_list_tables`.

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 1: Apply schema refinement migration [quick]
└── Task 2: Update AGENTS.md with new table + columns [writing]

Wave 2 (After Wave 1):
├── Task 3: Verify structure (new table, columns, indexes) [quick]
└── Task 4: Smoke test (insert schedules, verify admin default) [quick]

Wave FINAL (After ALL):
├── Task F1: Plan compliance audit [oracle]
├── Task F2: Code quality review (advisors) [unspecified-high]
├── Task F3: Real QA (realistic workflow with schedules) [unspecified-high]
└── Task F4: Scope fidelity check [deep]

Critical Path: Task 1 → Task 3 → Task 4 → F1-F4
Parallel: Task 1 ∥ Task 2, Task 3 ∥ Task 4, F1 ∥ F2 ∥ F3 ∥ F4
```

### Dependency Matrix

| Task | Depends On | Blocks |
|------|-----------|--------|
| 1 | — | 3, 4 |
| 2 | — | F4 |
| 3 | 1 | F1, F2 |
| 4 | 1 | F1, F3 |

### Agent Dispatch Summary

- **Wave 1**: 2 tasks — T1 → `quick`, T2 → `writing`
- **Wave 2**: 2 tasks — T3 → `quick`, T4 → `quick`
- **FINAL**: 4 tasks — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

- [ ] 1. Apply schema refinement migration

  **What to do**:
  Create a single migration via `supabase_apply_migration` named `add_lecture_schedules_and_refinements` containing:

  ```sql
  -- 1. New table: lecture_schedules
  CREATE TABLE lecture_schedules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lecture_id uuid NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
    day_time text,
    frequency text,
    location text,
    room_url text,
    created_at timestamptz DEFAULT now()
  );
  CREATE INDEX idx_lecture_schedules_lecture_id ON lecture_schedules(lecture_id);

  -- 2. Add is_admin to profiles
  ALTER TABLE profiles ADD COLUMN is_admin boolean DEFAULT false;

  -- 3. Add scheduled_for to visit_assignments and drop visited_at
  ALTER TABLE visit_assignments ADD COLUMN scheduled_for timestamptz;
  ALTER TABLE visit_assignments DROP COLUMN visited_at;

  After applying, verify with `supabase_list_tables` that 13 tables now exist.

  **Must NOT do**:
  - Do NOT modify existing columns
  - Do NOT remove schedule/location from lectures
  - Do NOT create RLS policies
  - Do NOT seed data

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single MCP tool call with straightforward SQL
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 2)
  - **Parallel Group**: Wave 1
  - **Blocks**: Tasks 3, 4
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `AGENTS.md` — Current schema documentation (12 tables)
  - `.sisyphus/plans/supabase-schema.md` — Original schema plan for pattern reference

  **WHY Each Reference Matters**:
  - AGENTS.md shows the existing table structure to build upon
  - Original plan shows the migration pattern used (supabase_apply_migration)

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Migration applies successfully
    Tool: supabase_apply_migration (MCP)
    Preconditions: 12 tables exist from previous migration
    Steps:
      1. Call supabase_apply_migration with name "add_lecture_schedules_and_refinements"
      2. Verify no error returned
    Expected Result: Migration completes without error
    Failure Indicators: SQL syntax error, FK reference error
    Evidence: .sisyphus/evidence/task-1-refinement-migration.md

  Scenario: 13 tables exist after migration
    Tool: supabase_list_tables (MCP)
    Steps:
      1. Call supabase_list_tables with schemas ["public"]
      2. Verify 13 tables returned
      3. Verify lecture_schedules is in the list
    Expected Result: 13 tables including lecture_schedules
    Failure Indicators: Table count ≠ 13
    Evidence: .sisyphus/evidence/task-1-table-count.md
  ```

  **Commit**: YES
  - Message: `feat(db): add lecture_schedules table, profiles.is_admin, visit scheduled_for`
  - Files: Supabase migration (auto-tracked)

---

- [ ] 2. Update AGENTS.md with schema refinement documentation

  **What to do**:
  - Update the Database Schema section in AGENTS.md:
    - Add `lecture_schedules` to the tables list
    - Update table count from 12 to 13
    - Add a note about the schedule format conventions
    - Document `is_admin` on profiles and `scheduled_for` on visit_assignments
  - Update the migration reference from `create_initial_schema` to mention the refinement migration too

  **Must NOT do**:
  - Do NOT remove existing content
  - Do NOT modify database tables

  **Recommended Agent Profile**:
  - **Category**: `writing`
    - Reason: Documentation update
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 1)
  - **Parallel Group**: Wave 1
  - **Blocks**: F4
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `frontend/AGENTS.md` — Current file to update

  **WHY Each Reference Matters**:
  - Must reflect the new table and columns accurately

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: AGENTS.md documents new table and columns
    Tool: Bash (grep)
    Steps:
      1. Verify "lecture_schedules" appears in AGENTS.md
      2. Verify "13 tables" (updated count)
      3. Verify "is_admin" mentioned
      4. Verify "scheduled_for" mentioned
    Expected Result: All 4 terms present
    Failure Indicators: Any term missing
    Evidence: .sisyphus/evidence/task-2-agents-md-updated.md
  ```

  **Commit**: YES
  - Message: `docs: add lecture_schedules, is_admin, scheduled_for to AGENTS.md`
  - Files: `AGENTS.md`

---

- [ ] 3. Verify schema structure

  **What to do**:
  Run verification SQL queries via `supabase_execute_sql`:

  1. **Verify lecture_schedules columns**:
     ```sql
     SELECT column_name, data_type, is_nullable, column_default
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'lecture_schedules'
     ORDER BY ordinal_position;
     ```
     Assert: 7 columns (id, lecture_id, day_time, frequency, location, room_url, created_at)

  2. **Verify profiles.is_admin**:
     ```sql
     SELECT column_name, data_type, column_default
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_admin';
     ```
     Assert: boolean, default false

  3. **Verify visit_assignments.scheduled_for**:
     ```sql
     SELECT column_name, data_type, is_nullable
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'visit_assignments' AND column_name = 'scheduled_for';
     ```
     Assert: timestamptz, nullable

  4. **Verify FK + index on lecture_schedules.lecture_id**:
     ```sql
     SELECT indexname FROM pg_indexes
     WHERE schemaname = 'public' AND tablename = 'lecture_schedules';
     ```
     Assert: index exists on lecture_id

  5. **Verify existing lectures.schedule and lectures.location still exist**:
     ```sql
     SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'lectures'
       AND column_name IN ('schedule', 'location');
     ```
     Assert: both columns still present

  6. **Verify visited_at is removed from visit_assignments**:
     ```sql
     SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'visit_assignments'
       AND column_name = 'visited_at';
     ```
     Assert: zero rows (column does not exist)

  **Must NOT do**: Do NOT modify anything

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 4)
  - **Parallel Group**: Wave 2
  - **Blocks**: F1, F2
  - **Blocked By**: Task 1

  **References**:
  - This plan's Task 1 SQL — expected columns and types

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: All 5 structural queries pass
    Tool: supabase_execute_sql (MCP)
    Steps:
      1. Run all 5 queries above
      2. Record PASS/FAIL for each
    Expected Result: All 5 pass
    Evidence: .sisyphus/evidence/task-3-structure-verified.md
  ```

  **Commit**: NO (read-only)

---

- [ ] 4. Smoke test (insert schedules, verify defaults)

  **What to do**:
  Run via `supabase_execute_sql`:

  ```sql
  DO $$
  DECLARE
    uni_id uuid;
    lec_id uuid;
    sched1_id uuid;
    sched2_id uuid;
  BEGIN
    -- Setup
    INSERT INTO universities (id, name) VALUES (gen_random_uuid(), '_refine_test_uni') RETURNING id INTO uni_id;
    INSERT INTO lectures (id, university_id, title, lecture_type, semester)
      VALUES (gen_random_uuid(), uni_id, '_refine_test_lecture', 'Vorlesung', 'WiSe 2025/26') RETURNING id INTO lec_id;

    -- Insert two schedule slots for the same lecture (different days/locations)
    INSERT INTO lecture_schedules (id, lecture_id, day_time, frequency, location, room_url)
      VALUES (gen_random_uuid(), lec_id, 'MO 10:00 - 12:00', 'WEEKLY 13.10.2025 - 06.02.2026', 'Geschw.-Scholl-Pl. 1, A 020', 'https://lmu.de/rooms/a020')
      RETURNING id INTO sched1_id;
    INSERT INTO lecture_schedules (id, lecture_id, day_time, frequency, location, room_url)
      VALUES (gen_random_uuid(), lec_id, 'MI 14:00 - 16:00', 'WEEKLY 15.10.2025 - 04.02.2026', 'Amalienstr. 73A, 218', 'https://lmu.de/rooms/218')
      RETURNING id INTO sched2_id;

    -- Verify: two schedules for one lecture
    ASSERT (SELECT count(*) FROM lecture_schedules WHERE lecture_id = lec_id) = 2,
      'Should have 2 schedule slots for one lecture';

    -- Verify is_admin default
    -- (Can't test profiles without auth.users, but verify column default)
    ASSERT (SELECT column_default FROM information_schema.columns
      WHERE table_name = 'profiles' AND column_name = 'is_admin') = 'false',
      'is_admin should default to false';

    -- Verify scheduled_for is nullable on visit_assignments
    ASSERT (SELECT is_nullable FROM information_schema.columns
      WHERE table_name = 'visit_assignments' AND column_name = 'scheduled_for') = 'YES',
      'scheduled_for should be nullable';

    -- Verify visited_at is gone
    ASSERT (SELECT count(*) FROM information_schema.columns
      WHERE table_name = 'visit_assignments' AND column_name = 'visited_at') = 0,
      'visited_at should be removed';
    -- Test cascade: delete lecture should cascade to schedules
    DELETE FROM lectures WHERE id = lec_id;
    ASSERT (SELECT count(*) FROM lecture_schedules WHERE lecture_id = lec_id) = 0,
      'lecture_schedules should cascade on lecture delete';

    -- Cleanup
    DELETE FROM universities WHERE id = uni_id;

    RAISE NOTICE 'REFINEMENT SMOKE TEST PASSED';
  END $$;
  ```

  **Must NOT do**: Do NOT leave test data

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 3)
  - **Parallel Group**: Wave 2
  - **Blocks**: F1, F3
  - **Blocked By**: Task 1

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Smoke test passes
    Tool: supabase_execute_sql (MCP)
    Steps:
      1. Run the DO block above
      2. Verify NOTICE "REFINEMENT SMOKE TEST PASSED"
    Expected Result: All assertions pass, no test data remains
    Evidence: .sisyphus/evidence/task-4-refinement-smoke.md
  ```

  **Commit**: NO (read-only)

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Rejection → fix → re-run.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Verify all "Must Have" items exist (lecture_schedules table, is_admin column, scheduled_for column, index). Verify all "Must NOT Have" items absent (no campuses table, no removed columns, no RLS). Check evidence files.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | VERDICT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `supabase_get_advisors(type="security")` and `supabase_get_advisors(type="performance")`. Verify migration recorded via `supabase_list_migrations` (should now be 3 total). Accept RLS warnings.
  Output: `Security [N] | Performance [N] | Migrations [3/3] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high`
  Insert realistic data: a lecture with 3 schedule slots (Mon/Wed weekly + Fri single block), query "what's the schedule for lecture X", query "all lectures happening on Monday", create a visit assignment with scheduled_for set. Verify queries work. Clean up.
  Output: `Workflow [PASS/FAIL] | Queries [N/N] | Cleanup [PASS/FAIL] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  Compare AGENTS.md against actual DB. Verify 13 tables documented and present. Verify no undocumented changes. Verify existing `schedule` and `location` on lectures still intact.
  Output: `Tables [13/13] | Columns [match/mismatch] | VERDICT`

---

## Commit Strategy

| Task | Commit | Message |
|------|--------|---------|
| 1 | YES | `feat(db): add lecture_schedules table, profiles.is_admin, visit scheduled_for` |
| 2 | YES | `docs: add lecture_schedules, is_admin, scheduled_for to AGENTS.md` |
| 3 | NO | Read-only verification |
| 4 | NO | Read-only test |

---

## Success Criteria

### Verification Commands
```sql
SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';
-- Expected: 13

SELECT column_name FROM information_schema.columns
WHERE table_name = 'lecture_schedules' ORDER BY ordinal_position;
-- Expected: id, lecture_id, day_time, frequency, location, room_url, created_at
```

### Final Checklist
- [ ] lecture_schedules table exists with 7 columns
- [ ] lecture_schedules.lecture_id has FK to lectures with CASCADE
- [ ] Index on lecture_schedules.lecture_id
- [ ] profiles.is_admin boolean DEFAULT false
- [ ] visit_assignments.scheduled_for timestamptz nullable
- [ ] visit_assignments.visited_at removed
- [ ] Existing lectures.schedule and lectures.location unchanged
- [ ] AGENTS.md updated
- [ ] 3 migrations recorded
- [ ] No test data left
- [ ] Advisors reviewed
