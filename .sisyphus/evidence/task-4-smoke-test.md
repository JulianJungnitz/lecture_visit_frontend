# Task 4: Smoke Test — Full Insert Chain & Cascade Delete

## Execution Date
2026-02-28

## Test Results

### ✅ Block 1: Full Insert Chain + Defaults + Cascade Delete
**Status**: PASSED

**What was tested**:
1. Full insert chain across all 11 non-auth tables:
   - `universities` → `faculties` → `study_programs` → `lectures` → `professors`
   - `lecture_professors` (M2M) → `lecture_study_programs` (M2M)
   - `campaigns` → `campaign_professors` → `campaign_professor_lectures`
   - `visit_assignments`

2. Default values verification:
   - ✅ `lectures.is_starred` = `false`
   - ✅ `campaign_professors.outreach_status` = `'not_contacted'`
   - ✅ `campaigns.status` = `'planning'`
   - ✅ `visit_assignments.status` = `'planned'`

3. Cascade delete from `universities`:
   - ✅ `faculties` cascaded (deleted)
   - ✅ `lectures` cascaded (deleted)
   - ✅ `professors` cascaded (deleted)
   - ✅ `campaign_professors` cascaded (deleted via professor FK)
   - ✅ `campaign_professor_lectures` cascaded (deleted)
   - ✅ `visit_assignments` cascaded (deleted)
   - ✅ `campaigns` NOT cascaded (correct — not directly linked to university)

4. Manual cleanup:
   - ✅ Orphaned campaign deleted successfully

**SQL Output**: No errors, all assertions passed, NOTICE message: "SMOKE TEST PASSED: insert chain + defaults + cascade delete all verified"

### ✅ Block 2: Foreign Key Violation Test
**Status**: PASSED

**What was tested**:
- Attempted to insert a `faculties` row with a non-existent `university_id`
- Expected: FK violation exception
- Result: ✅ FK violation correctly caught and handled

**SQL Output**: No errors, NOTICE message: "FK VIOLATION TEST PASSED: correctly blocked invalid insert"

## Schema Fixes Applied

### Issue Found
`campaign_professors.professor_id` FK had `ON DELETE RESTRICT` instead of `ON DELETE CASCADE`, which prevented cascade delete from `universities` → `professors` → `campaign_professors`.

### Fix Applied
Migration: `fix_cascade_delete_campaign_professors`
```sql
ALTER TABLE campaign_professors
DROP CONSTRAINT campaign_professors_professor_id_fkey,
ADD CONSTRAINT campaign_professors_professor_id_fkey
  FOREIGN KEY (professor_id) REFERENCES professors(id) ON DELETE CASCADE;
```

**Status**: ✅ Applied successfully

## Verification Checklist

- [x] Full insert chain succeeds without SQL errors
- [x] Default values correct: is_starred=false, outreach_status=not_contacted, campaign status=planning, visit status=planned
- [x] Cascade delete from university removes all dependent rows
- [x] FK violation correctly blocked
- [x] No test data left in database after cleanup
- [x] Evidence saved to `.sisyphus/evidence/task-4-smoke-test.md`

## Conclusion

**All smoke tests passed.** The schema is functionally correct with proper cascade delete behavior and FK constraint enforcement. One constraint was fixed to ensure proper cascade semantics.
