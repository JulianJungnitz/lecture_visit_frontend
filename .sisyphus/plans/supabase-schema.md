# Supabase Schema — Initial Database Setup

## TL;DR

> **Quick Summary**: Create the complete Supabase database schema (12 tables, 3 enum types, indexes, FK constraints, profiles trigger) for the Lecture Visit coordination tool. Single atomic migration on a blank-slate database.
> 
> **Deliverables**:
> - 12 public tables with proper relationships, constraints, and indexes
> - 3 custom enum types (outreach_status, campaign_status, visit_status)
> - 1 trigger + 1 function for auto-creating user profiles on signup
> - Verified via SQL queries post-migration
> 
> **Estimated Effort**: Short
> **Parallel Execution**: YES — 2 waves
> **Critical Path**: Task 1 (migration) → Task 2 (verification) → Task 3 (smoke test)

---

## Context

### Original Request
Create the Supabase database schema to support a lecture visit coordination tool. The club needs to track universities, study programs, lectures, professors, outreach campaigns, and visit assignments across semesters.

### Interview Summary
**Key Discussions**:
- Semesters: text field on lectures (no separate table)
- Studienordnung: URL field on study_programs (no file storage)
- Stars/notes on lectures: global shared team annotations
- Campaigns: first-class entity for per-semester outreach
- Outreach: per-campaign, linked to specific lectures via join table
- Visit assignments: many-to-many (multiple visitors per lecture)
- Auth: Supabase Auth with profiles table (canonical pattern)
- Faculties: separate table grouping study programs
- Source tracking: external_id + source on lectures/professors for scraper re-imports
- Professor names: single name field (not split)
- Professor scoped per university (one row per university)
- Extra columns: description + source_url on lectures, source_url on professors (from TUM scraper)
- No expected_attendance, no image_url

### Metis Review
**Identified Gaps** (addressed):
- Profiles table needed for visit assignment display names → added profiles table with trigger
- TUM scraper fields missing from schema → added description, source_url
- No FK cascade policies defined → explicit ON DELETE behavior on every FK
- No indexes on FK columns → indexes on all FK columns
- No enum types → CREATE TYPE for outreach_status, campaign_status, visit_status
- external_id uniqueness not defined → UNIQUE(university_id, external_id) WHERE external_id IS NOT NULL
- LMU person_guess data quality is poor → schema tolerates professors with minimal data (all fields nullable except name)

---

## Work Objectives

### Core Objective
Create all 12 database tables, 3 enum types, indexes, constraints, and the profiles auto-creation trigger in a single Supabase migration.

### Concrete Deliverables
- 12 tables in the public schema
- 3 enum types: `outreach_status`, `campaign_status`, `visit_status`
- FK indexes on all foreign key columns
- Unique constraints where specified
- `handle_new_user()` function + `on_auth_user_created` trigger
- Verification queries confirming structure

### Definition of Done
- [x] `supabase_list_tables` returns exactly 12 tables
- [x] All FK relationships verified via information_schema query
- [x] All enum types verified with correct values
- [x] Smoke test: full insert chain across all 12 tables + cascade delete succeeds

### Must Have
- All 12 tables with correct columns and types
- Proper FK constraints with explicit ON DELETE behavior
- Indexes on all FK columns
- Unique constraints: universities.name, campaign_professors(campaign_id, professor_id), external_id partial uniques
- Profiles trigger for auto-creation on signup
- `created_at DEFAULT now()` and `updated_at DEFAULT now()` where specified

### Must NOT Have (Guardrails)
- NO RLS policies (club-internal tool, deferred)
- NO email template tables (Phase 3)
- NO scraper pipeline tables
- NO analytics tables
- NO views or materialized views
- NO columns beyond what's specified (no image_url, no language, no expected_attendance)
- NO data seeding — schema only

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: NO (no test framework)
- **Automated tests**: None (database migration — verified via SQL queries)
- **Framework**: N/A

### QA Policy
Every task includes agent-executed QA scenarios using `supabase_execute_sql` and `supabase_list_tables`.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — migration + AGENTS.md update):
├── Task 1: Create the full migration (single atomic SQL) [quick]
└── Task 2: Update AGENTS.md with final schema documentation [writing]

Wave 2 (After Wave 1 — verification):
├── Task 3: Verify schema structure (tables, FKs, enums, indexes) [quick]
└── Task 4: Smoke test (insert chain + cascade delete) [quick]

Wave FINAL (After ALL tasks — review):
├── Task F1: Plan compliance audit [oracle]
├── Task F2: Code quality review (run advisors) [unspecified-high]
├── Task F3: Real QA (query every table, test constraints) [unspecified-high]
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

- [x] 1. Apply initial schema migration

  **What to do**:
  Create a single migration via `supabase_apply_migration` named `create_initial_schema` containing:

  **Enum types** (create first):
  ```sql
  CREATE TYPE outreach_status AS ENUM ('not_contacted', 'emailed', 'confirmed', 'declined');
  CREATE TYPE campaign_status AS ENUM ('planning', 'active', 'completed');
  CREATE TYPE visit_status AS ENUM ('planned', 'visited', 'cancelled');
  ```

  **Tables** (in dependency order):

  1. `universities` — id (uuid PK DEFAULT gen_random_uuid()), name (text NOT NULL UNIQUE), full_name (text), website (text), created_at (timestamptz DEFAULT now())

  2. `faculties` — id (uuid PK DEFAULT gen_random_uuid()), university_id (uuid NOT NULL FK→universities ON DELETE CASCADE), name (text NOT NULL), created_at (timestamptz DEFAULT now())
     - INDEX on university_id

  3. `study_programs` — id (uuid PK DEFAULT gen_random_uuid()), university_id (uuid NOT NULL FK→universities ON DELETE CASCADE), faculty_id (uuid NULLABLE FK→faculties ON DELETE SET NULL), name (text NOT NULL), degree_type (text NOT NULL), category (text), studienordnung_url (text), url (text), created_at (timestamptz DEFAULT now())
     - INDEX on university_id, faculty_id

  4. `lectures` — id (uuid PK DEFAULT gen_random_uuid()), university_id (uuid NOT NULL FK→universities ON DELETE CASCADE), title (text NOT NULL), lecture_type (text), semester (text), schedule (text), location (text), duration (text), description (text), source_url (text), external_id (text), source (text), is_starred (boolean DEFAULT false), notes (text), created_at (timestamptz DEFAULT now()), updated_at (timestamptz DEFAULT now())
     - INDEX on university_id
     - UNIQUE(university_id, external_id) WHERE external_id IS NOT NULL (partial unique)

  5. `professors` — id (uuid PK DEFAULT gen_random_uuid()), university_id (uuid NOT NULL FK→universities ON DELETE CASCADE), name (text NOT NULL), email (text), title (text), department (text), source_url (text), external_id (text), source (text), notes (text), created_at (timestamptz DEFAULT now()), updated_at (timestamptz DEFAULT now())
     - INDEX on university_id
     - UNIQUE(university_id, external_id) WHERE external_id IS NOT NULL (partial unique)

  6. `lecture_professors` — lecture_id (uuid FK→lectures ON DELETE CASCADE), professor_id (uuid FK→professors ON DELETE CASCADE), PRIMARY KEY (lecture_id, professor_id)
     - INDEX on professor_id (lecture_id already indexed via PK)

  7. `lecture_study_programs` — lecture_id (uuid FK→lectures ON DELETE CASCADE), study_program_id (uuid FK→study_programs ON DELETE CASCADE), PRIMARY KEY (lecture_id, study_program_id)
     - INDEX on study_program_id

  8. `profiles` — id (uuid PK FK→auth.users ON DELETE CASCADE), display_name (text), created_at (timestamptz DEFAULT now()), updated_at (timestamptz DEFAULT now())

  9. `campaigns` — id (uuid PK DEFAULT gen_random_uuid()), name (text NOT NULL), semester (text NOT NULL), status (campaign_status DEFAULT 'planning'), created_by (uuid FK→profiles ON DELETE SET NULL), notes (text), created_at (timestamptz DEFAULT now()), updated_at (timestamptz DEFAULT now())
     - INDEX on created_by

  10. `campaign_professors` — id (uuid PK DEFAULT gen_random_uuid()), campaign_id (uuid NOT NULL FK→campaigns ON DELETE CASCADE), professor_id (uuid NOT NULL FK→professors ON DELETE RESTRICT), outreach_status (outreach_status DEFAULT 'not_contacted'), notes (text), created_at (timestamptz DEFAULT now()), updated_at (timestamptz DEFAULT now())
      - UNIQUE(campaign_id, professor_id)
      - INDEX on campaign_id, professor_id

  11. `campaign_professor_lectures` — campaign_professor_id (uuid FK→campaign_professors ON DELETE CASCADE), lecture_id (uuid FK→lectures ON DELETE CASCADE), PRIMARY KEY (campaign_professor_id, lecture_id)
      - INDEX on lecture_id

  12. `visit_assignments` — id (uuid PK DEFAULT gen_random_uuid()), campaign_id (uuid NOT NULL FK→campaigns ON DELETE CASCADE), lecture_id (uuid NOT NULL FK→lectures ON DELETE CASCADE), assigned_to (uuid FK→profiles ON DELETE SET NULL), status (visit_status DEFAULT 'planned'), visit_notes (text), visited_at (timestamptz), created_at (timestamptz DEFAULT now()), updated_at (timestamptz DEFAULT now())
      - INDEX on campaign_id, lecture_id, assigned_to

  **Trigger + Function** (after tables):
  ```sql
  CREATE FUNCTION public.handle_new_user()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER SET search_path = public
  AS $$
  BEGIN
    INSERT INTO public.profiles (id)
    VALUES (new.id);
    RETURN new;
  END;
  $$;

  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  ```

  **Must NOT do**:
  - Do NOT create RLS policies
  - Do NOT seed any data
  - Do NOT create views or materialized views
  - Do NOT add columns not listed above

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single tool call (supabase_apply_migration) with well-defined SQL
  - **Skills**: []
    - No special skills needed — direct MCP call
  - **Skills Evaluated but Omitted**:
    - None relevant

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 2)
  - **Parallel Group**: Wave 1 (with Task 2)
  - **Blocks**: Tasks 3, 4
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `.sisyphus/drafts/supabase-schema.md` — Complete schema design with all decisions documented

  **API/Type References**:
  - Supabase MCP `supabase_apply_migration` tool — name: "create_initial_schema", query: the full SQL

  **External References**:
  - Supabase profiles pattern: `profiles` table with `id uuid PK FK→auth.users ON DELETE CASCADE`, trigger `on_auth_user_created`, function `handle_new_user()` with `SECURITY DEFINER`

  **WHY Each Reference Matters**:
  - The draft file contains every column, type, and constraint decision — follow it exactly
  - The Supabase MCP tool is the only way to apply migrations to the connected project
  - The profiles pattern is the canonical Supabase approach for user display names

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Migration applies successfully
    Tool: supabase_apply_migration (MCP)
    Preconditions: Zero public tables in database
    Steps:
      1. Call supabase_apply_migration with name "create_initial_schema" and the full SQL
      2. Verify no error is returned
    Expected Result: Migration completes without error
    Failure Indicators: SQL syntax error, FK reference error, type not found error
    Evidence: .sisyphus/evidence/task-1-migration-applied.md

  Scenario: All 12 tables exist after migration
    Tool: supabase_list_tables (MCP)
    Preconditions: Migration applied
    Steps:
      1. Call supabase_list_tables with schemas ["public"]
      2. Count tables returned
      3. Verify table names match expected list
    Expected Result: Exactly 12 tables: campaign_professor_lectures, campaign_professors, campaigns, faculties, lecture_professors, lecture_study_programs, lectures, professors, profiles, study_programs, universities, visit_assignments
    Failure Indicators: Table count ≠ 12, missing table name
    Evidence: .sisyphus/evidence/task-1-tables-exist.md
  ```

  **Commit**: YES
  - Message: `feat(db): create initial schema with 12 tables, enums, and profiles trigger`
  - Files: Supabase migration (auto-tracked by Supabase)
  - Pre-commit: N/A (migration applied via MCP)

---

- [x] 2. Update AGENTS.md with final schema documentation

  **What to do**:
  - Update the "Architecture Decisions (Pending)" section in `AGENTS.md` to document the resolved schema decisions
  - Add a new "Database Schema" section documenting all 12 tables, their relationships, and the campaign workflow
  - Mark schema-related decisions as resolved
  - Keep it concise — reference the schema itself, don't duplicate every column

  **Must NOT do**:
  - Do NOT modify any database tables
  - Do NOT remove existing content from AGENTS.md (only add/update)

  **Recommended Agent Profile**:
  - **Category**: `writing`
    - Reason: Documentation update task
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - None relevant

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 1)
  - **Parallel Group**: Wave 1 (with Task 1)
  - **Blocks**: F4
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `frontend/AGENTS.md` — Current file to update (has "Architecture Decisions (Pending)" section)
  - `.sisyphus/drafts/supabase-schema.md` — Complete schema design decisions

  **WHY Each Reference Matters**:
  - AGENTS.md is the project knowledge base — must reflect resolved decisions
  - Draft contains all confirmed requirements and technical choices

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: AGENTS.md contains schema documentation
    Tool: Bash (grep)
    Preconditions: AGENTS.md exists
    Steps:
      1. Read AGENTS.md
      2. Verify it contains a "Database Schema" section (or similar)
      3. Verify it mentions all 12 tables by name
      4. Verify "Architecture Decisions" section reflects resolved decisions
    Expected Result: AGENTS.md documents the schema, all 12 table names present, decisions marked resolved
    Failure Indicators: Missing schema section, table names not listed, decisions still marked "pending"
    Evidence: .sisyphus/evidence/task-2-agents-md-updated.md

  Scenario: No accidental content deletion
    Tool: Bash (grep)
    Preconditions: AGENTS.md exists
    Steps:
      1. Verify "Project Vision" section still present
      2. Verify "Problem Statement" section still present
      3. Verify "Feature Roadmap" section still present
    Expected Result: All original sections preserved
    Failure Indicators: Any original section missing
    Evidence: .sisyphus/evidence/task-2-no-content-loss.md
  ```

  **Commit**: YES
  - Message: `docs: document resolved database schema in AGENTS.md`
  - Files: `AGENTS.md`
  - Pre-commit: N/A

---

- [x] 3. Verify schema structure (tables, FKs, enums, indexes)

  **What to do**:
  Run verification SQL queries via `supabase_execute_sql` to confirm the migration created everything correctly:

  1. **Verify all 12 tables exist**:
     ```sql
     SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' ORDER BY table_name;
     ```
     Assert: exactly 12 rows

  2. **Verify FK relationships**:
     ```sql
     SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table
     FROM information_schema.table_constraints tc
     JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
     JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema
     WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
     ORDER BY tc.table_name;
     ```
     Assert: at minimum 15 FK relationships

  3. **Verify enum types**:
     ```sql
     SELECT typname, enumlabel
     FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid
     ORDER BY typname, e.enumsortorder;
     ```
     Assert: outreach_status (4 values), campaign_status (3 values), visit_status (3 values)

  4. **Verify unique constraints**:
     ```sql
     SELECT tc.table_name, tc.constraint_name, string_agg(kcu.column_name, ', ')
     FROM information_schema.table_constraints tc
     JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
     WHERE tc.constraint_type = 'UNIQUE' AND tc.table_schema = 'public'
     GROUP BY tc.table_name, tc.constraint_name ORDER BY tc.table_name;
     ```
     Assert: universities(name), campaign_professors(campaign_id, professor_id)

  5. **Verify indexes on FK columns**:
     ```sql
     SELECT tablename, indexname FROM pg_indexes
     WHERE schemaname = 'public' ORDER BY tablename, indexname;
     ```
     Assert: indexes exist for all FK columns

  **Must NOT do**:
  - Do NOT modify any tables
  - Do NOT insert any data

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Series of read-only SQL verification queries
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 4)
  - **Parallel Group**: Wave 2 (with Task 4)
  - **Blocks**: F1, F2
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `.sisyphus/drafts/supabase-schema.md` — Expected table list and constraints to verify against

  **WHY Each Reference Matters**:
  - Need to compare actual DB state against designed schema

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: All structural queries pass
    Tool: supabase_execute_sql (MCP)
    Preconditions: Migration applied (Task 1 complete)
    Steps:
      1. Run all 5 verification queries listed above
      2. Compare results against expected values
      3. Record pass/fail for each
    Expected Result: All 5 queries return expected results
    Failure Indicators: Wrong table count, missing FK, missing enum value, missing index
    Evidence: .sisyphus/evidence/task-3-structure-verified.md

  Scenario: Partial unique indexes exist on external_id
    Tool: supabase_execute_sql (MCP)
    Steps:
      1. Query pg_indexes for lectures and professors tables
      2. Verify partial unique index on (university_id, external_id) WHERE external_id IS NOT NULL
    Expected Result: Both partial unique indexes exist
    Failure Indicators: Index missing or not partial
    Evidence: .sisyphus/evidence/task-3-partial-indexes.md
  ```

  **Commit**: NO (read-only verification)

---

- [x] 4. Smoke test (insert chain + cascade delete)

  **What to do**:
  Run a full insert chain across all 12 tables via `supabase_execute_sql` to verify FKs, defaults, and cascades work:

  ```sql
  DO $$
  DECLARE
    uni_id uuid;
    fac_id uuid;
    prog_id uuid;
    lec_id uuid;
    prof_id uuid;
    camp_id uuid;
    cp_id uuid;
    va_id uuid;
  BEGIN
    -- Insert into all tables following FK order
    INSERT INTO universities (id, name, full_name) VALUES (gen_random_uuid(), '_smoke_test_uni', 'Smoke Test University') RETURNING id INTO uni_id;
    INSERT INTO faculties (id, university_id, name) VALUES (gen_random_uuid(), uni_id, '_smoke_fac') RETURNING id INTO fac_id;
    INSERT INTO study_programs (id, university_id, faculty_id, name, degree_type) VALUES (gen_random_uuid(), uni_id, fac_id, '_smoke_prog', 'BSc') RETURNING id INTO prog_id;
    INSERT INTO lectures (id, university_id, title, lecture_type, semester) VALUES (gen_random_uuid(), uni_id, '_smoke_lecture', 'Vorlesung', 'WiSe 2025/26') RETURNING id INTO lec_id;
    INSERT INTO professors (id, university_id, name) VALUES (gen_random_uuid(), uni_id, '_smoke_prof') RETURNING id INTO prof_id;
    INSERT INTO lecture_professors (lecture_id, professor_id) VALUES (lec_id, prof_id);
    INSERT INTO lecture_study_programs (lecture_id, study_program_id) VALUES (lec_id, prog_id);
    -- Skip profiles (requires auth.users) — test campaigns with NULL created_by
    INSERT INTO campaigns (id, name, semester) VALUES (gen_random_uuid(), '_smoke_campaign', 'WiSe 2025/26') RETURNING id INTO camp_id;
    INSERT INTO campaign_professors (id, campaign_id, professor_id) VALUES (gen_random_uuid(), camp_id, prof_id) RETURNING id INTO cp_id;
    INSERT INTO campaign_professor_lectures (campaign_professor_id, lecture_id) VALUES (cp_id, lec_id);
    INSERT INTO visit_assignments (id, campaign_id, lecture_id) VALUES (gen_random_uuid(), camp_id, lec_id) RETURNING id INTO va_id;

    -- Verify defaults
    ASSERT (SELECT is_starred FROM lectures WHERE id = lec_id) = false, 'is_starred default should be false';
    ASSERT (SELECT outreach_status FROM campaign_professors WHERE id = cp_id) = 'not_contacted', 'outreach_status default should be not_contacted';
    ASSERT (SELECT status FROM campaigns WHERE id = camp_id) = 'planning', 'campaign status default should be planning';
    ASSERT (SELECT status FROM visit_assignments WHERE id = va_id) = 'planned', 'visit status default should be planned';

    -- Test cascade: deleting university should cascade to everything
    DELETE FROM universities WHERE id = uni_id;

    -- Verify cascade cleaned up
    ASSERT (SELECT count(*) FROM faculties WHERE university_id = uni_id) = 0, 'faculties should be cascaded';
    ASSERT (SELECT count(*) FROM lectures WHERE id = lec_id) = 0, 'lectures should be cascaded';
    ASSERT (SELECT count(*) FROM professors WHERE id = prof_id) = 0, 'professors should be cascaded';
    -- campaign_professors should be gone because professor was cascaded (RESTRICT won't fire because professor was cascade-deleted, not directly deleted)
    -- Actually RESTRICT on professor_id means: if you try to DELETE a professor directly who has campaign_professors, it blocks. But CASCADE from university deletes the professor which triggers... need to verify behavior.

    RAISE NOTICE 'Smoke test passed: all 11 tables (excl profiles) inserted + cascade delete verified';
  END $$;
  ```

  **Important edge case**: The `campaign_professors.professor_id` has ON DELETE RESTRICT. When a university cascades to delete a professor, Postgres CASCADE overrides RESTRICT in the cascade chain. Verify this works. If it doesn't, the smoke test will catch it — adjust the FK to CASCADE if needed.

  After smoke test, also test FK violation:
  ```sql
  -- Should fail: inserting faculty with non-existent university
  DO $$
  BEGIN
    INSERT INTO faculties (id, university_id, name) VALUES (gen_random_uuid(), gen_random_uuid(), 'should_fail');
    RAISE EXCEPTION 'FK violation was not enforced!';
  EXCEPTION WHEN foreign_key_violation THEN
    RAISE NOTICE 'FK violation correctly enforced';
  END $$;
  ```

  **Must NOT do**:
  - Do NOT leave test data in the database
  - Do NOT modify schema

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: SQL execution and assertion
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 3)
  - **Parallel Group**: Wave 2 (with Task 3)
  - **Blocks**: F1, F3
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `.sisyphus/drafts/supabase-schema.md` — Expected default values and constraints

  **WHY Each Reference Matters**:
  - Need to verify defaults and FK cascade behavior match the design

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Full insert chain succeeds
    Tool: supabase_execute_sql (MCP)
    Preconditions: Migration applied (Task 1 complete)
    Steps:
      1. Run the insert chain DO block above
      2. Verify NOTICE "Smoke test passed" is returned
    Expected Result: All inserts succeed, defaults correct, cascade works
    Failure Indicators: Any SQL error, assertion failure
    Evidence: .sisyphus/evidence/task-4-smoke-test.md

  Scenario: FK violation correctly blocks invalid inserts
    Tool: supabase_execute_sql (MCP)
    Steps:
      1. Run the FK violation test above
      2. Verify "FK violation correctly enforced" NOTICE
    Expected Result: Insert is rejected, exception caught
    Failure Indicators: Insert succeeds (FK not enforced)
    Evidence: .sisyphus/evidence/task-4-fk-violation.md
  ```

  **Commit**: NO (read-only test)

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Rejection → fix → re-run.

- [x] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (run `supabase_list_tables`, `supabase_execute_sql` to check columns, types, constraints). For each "Must NOT Have": query information_schema for forbidden objects (RLS policies, views, extra tables). Check evidence files exist in `.sisyphus/evidence/`. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [x] F2. **Code Quality Review** — `unspecified-high`
  Run `supabase_get_advisors(type="security")` and `supabase_get_advisors(type="performance")`. Review results. Flag but ACCEPT RLS warnings (intentionally deferred for club-internal tool). Verify no performance advisories. Check migration was recorded via `supabase_list_migrations`.
  Output: `Security [N advisories] | Performance [N advisories] | Migration [recorded/missing] | VERDICT`

- [x] F3. **Real Manual QA** — `unspecified-high`
  Execute a realistic workflow: insert a university (LMU), a faculty, 2 study programs, 3 lectures, 2 professors, link them via join tables, create a campaign, add outreach entries, create visit assignments. Then query: "show me all lectures for Prof. X", "show me outreach history for Prof. Y across campaigns", "show me all visit assignments for campaign Z". Verify queries return expected results. Clean up all test data.
  Output: `Insert workflow [PASS/FAIL] | Query patterns [N/N pass] | Cleanup [PASS/FAIL] | VERDICT`

- [x] F4. **Scope Fidelity Check** — `deep`
  Compare AGENTS.md schema documentation (Task 2) against actual database state. Verify 1:1 match: every documented table exists, every documented column exists with correct type, no undocumented tables or columns exist. Check that draft `.sisyphus/drafts/supabase-schema.md` decisions are all reflected in the final schema.
  Output: `Tables [N/N match] | Columns [N/N match] | Undocumented [CLEAN/N items] | VERDICT`

---

## Commit Strategy

| Task | Commit | Message |
|------|--------|---------|
| 1 | YES | `feat(db): create initial schema with 12 tables, enums, and profiles trigger` |
| 2 | YES | `docs: document resolved database schema in AGENTS.md` |
| 3 | NO | Read-only verification |
| 4 | NO | Read-only test |

---

## Success Criteria

### Verification Commands
```sql
SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';
-- Expected: 12

SELECT typname FROM pg_type WHERE typname IN ('outreach_status', 'campaign_status', 'visit_status');
-- Expected: 3 rows
```

### Final Checklist
- [x] All 12 tables present in public schema
- [x] All FK constraints enforced with correct ON DELETE behavior
- [x] All enum types created with correct values
- [x] All FK columns indexed
- [x] Unique constraints on universities.name and campaign_professors(campaign_id, professor_id)
- [x] Partial unique indexes on external_id for lectures and professors
- [x] Profiles trigger fires on auth.users insert
- [x] AGENTS.md updated with schema documentation
- [x] No RLS policies created (intentional)
- [x] No test data left in database
- [x] Supabase advisors reviewed
