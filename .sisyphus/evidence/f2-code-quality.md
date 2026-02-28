# F2 — Code Quality: Supabase Schema Audit

**Date:** 2026-02-28
**Project:** wgdzikstvulyrkuozemb

---

## Security Advisors

**Total advisories: 12** — ALL are `rls_disabled_in_public` (RLS not enabled)

| # | Table | Level | Category |
|---|-------|-------|----------|
| 1 | `universities` | ERROR | SECURITY — RLS disabled |
| 2 | `faculties` | ERROR | SECURITY — RLS disabled |
| 3 | `study_programs` | ERROR | SECURITY — RLS disabled |
| 4 | `lectures` | ERROR | SECURITY — RLS disabled |
| 5 | `professors` | ERROR | SECURITY — RLS disabled |
| 6 | `lecture_professors` | ERROR | SECURITY — RLS disabled |
| 7 | `lecture_study_programs` | ERROR | SECURITY — RLS disabled |
| 8 | `profiles` | ERROR | SECURITY — RLS disabled |
| 9 | `campaigns` | ERROR | SECURITY — RLS disabled |
| 10 | `campaign_professors` | ERROR | SECURITY — RLS disabled |
| 11 | `campaign_professor_lectures` | ERROR | SECURITY — RLS disabled |
| 12 | `visit_assignments` | ERROR | SECURITY — RLS disabled |

**Assessment:** ACCEPTED — RLS is intentionally deferred. This is a club-internal tool; RLS will be added in a later phase. All 12 advisories are the same lint (`rls_disabled_in_public`). **Zero non-RLS security issues found.**

---

## Performance Advisors

**Total advisories: 2** — Both are `unused_index` at INFO level

| # | Index | Table | Level |
|---|-------|-------|-------|
| 1 | `idx_campaigns_created_by` | `campaigns` | INFO |
| 2 | `idx_visit_assignments_assigned_to` | `visit_assignments` | INFO |

**Assessment:** ACCEPTED — These are INFO-level (not ERROR/WARNING) false positives on a freshly-deployed schema with zero queries executed. Both indexes are on foreign key columns (`created_by` → profiles, `assigned_to` → profiles) that will be actively queried once the application is running. No action needed.

---

## Migrations

**Expected: 2 | Found: 2** ✅

| Version | Name | Status |
|---------|------|--------|
| `20260228114139` | `create_initial_schema` | ✅ Present |
| `20260228114342` | `fix_cascade_delete_campaign_professors` | ✅ Present |

---

## Verdict

```
Security [12 advisories — all RLS, accepted] | Performance [2 advisories — INFO unused_index, accepted] | Migrations [2/2] | VERDICT: APPROVE
```

**Reasoning:**
1. All 12 security advisories are RLS-disabled warnings — intentionally deferred for club-internal tool, no non-RLS security issues
2. Both performance advisories are INFO-level unused-index false positives on a fresh schema with no traffic — indexes will be used once app queries data
3. Migration history is clean: exactly 2 migrations as expected, in correct order
4. Schema is production-ready for Phase 1 development
