# F3 — Real-World QA: End-to-End Workflow Test

**Date:** 2026-02-28
**Supabase Project:** wgdzikstvulyrkuozemb

---

## 1. Test Data Setup — PASS

Inserted realistic test data via DO block:
- 2 universities (LMU_TEST, TUM_TEST)
- 2 faculties (Physik @ LMU, Informatik @ TUM)
- 2 study programs (Physik BSc, Informatik MSc)
- 3 lectures (Quantenmechanik, Klassische Mechanik, Algorithmen und Datenstrukturen)
- 2 professors (Müller @ LMU, Schmidt @ TUM)
- 3 lecture-professor links, 3 lecture-program links
- 2 campaigns (WiSe 2024/25, WiSe 2025/26)
- 3 campaign-professor outreach records (confirmed, emailed, not_contacted)
- 4 campaign-professor-lecture links
- 2 visit assignments (visited, planned)

All inserts succeeded without errors. Foreign keys, check constraints, and unique constraints all satisfied.

---

## 2. Query A — All Lectures for Prof. Müller at LMU — PASS

**SQL:**
```sql
SELECT l.title, l.lecture_type, l.semester, p.name as professor
FROM lectures l
JOIN lecture_professors lp ON l.id = lp.lecture_id
JOIN professors p ON lp.professor_id = p.id
WHERE p.name = 'Müller, Hans' AND p.university_id = (SELECT id FROM universities WHERE name = 'LMU_TEST')
ORDER BY l.title;
```

**Result (2 rows — expected 2):**
| title | lecture_type | semester | professor |
|-------|-------------|----------|-----------|
| Einführung in die Quantenmechanik | Vorlesung | WiSe 2025/26 | Müller, Hans |
| Klassische Mechanik | Vorlesung | WiSe 2025/26 | Müller, Hans |

✅ Correct: Both LMU lectures for Prof. Müller returned, TUM lecture excluded.

---

## 3. Query B — Outreach History for Prof. Müller Across Campaigns — PASS

**SQL:**
```sql
SELECT c.name as campaign, c.semester, cp.outreach_status, cp.notes,
       array_agg(l.title) as lectures_mentioned
FROM campaign_professors cp
JOIN campaigns c ON cp.campaign_id = c.id
JOIN professors p ON cp.professor_id = p.id
LEFT JOIN campaign_professor_lectures cpl ON cp.id = cpl.campaign_professor_id
LEFT JOIN lectures l ON cpl.lecture_id = l.id
WHERE p.name = 'Müller, Hans'
GROUP BY c.name, c.semester, cp.outreach_status, cp.notes
ORDER BY c.semester;
```

**Result (2 rows — expected 2):**
| campaign | semester | outreach_status | notes | lectures_mentioned |
|----------|----------|----------------|-------|-------------------|
| WiSe 2024/25 Campaign | WiSe 2024/25 | confirmed | Prof. sehr freundlich, hat zugesagt | {Klassische Mechanik, Einführung in die Quantenmechanik} |
| WiSe 2025/26 Campaign | WiSe 2025/26 | emailed | NULL | {Einführung in die Quantenmechanik} |

✅ Correct: Cross-campaign history preserved. Status progression visible (confirmed → emailed in new campaign). Notes and per-outreach lecture links working.

---

## 4. Query C — Visit Assignments for WiSe 2025/26 Campaign — PASS

**SQL:**
```sql
SELECT l.title, l.location, va.status, va.visit_notes
FROM visit_assignments va
JOIN campaigns c ON va.campaign_id = c.id
JOIN lectures l ON va.lecture_id = l.id
WHERE c.name = 'WiSe 2025/26 Campaign'
ORDER BY l.title;
```

**Result (1 row — expected 1):**
| title | location | status | visit_notes |
|-------|----------|--------|-------------|
| Einführung in die Quantenmechanik | Geschwister-Scholl-Platz 1 | planned | NULL |

✅ Correct: Only the 2025/26 campaign assignment returned, with location data populated.

---

## 5. Cleanup — PASS

**Cleanup SQL:**
```sql
DELETE FROM universities WHERE name IN ('LMU_TEST', 'TUM_TEST');
DELETE FROM campaigns WHERE name IN ('WiSe 2024/25 Campaign', 'WiSe 2025/26 Campaign');
```

**Verification query (all counts = 0):**
| table | count |
|-------|-------|
| universities | 0 |
| campaigns | 0 |
| professors | 0 |
| lectures | 0 |

✅ Cascade deletes worked correctly: deleting universities cascaded through faculties → study_programs → lectures → lecture_professors → lecture_study_programs → professors. Deleting campaigns cascaded through campaign_professors → campaign_professor_lectures → visit_assignments.

---

## Summary

| Check | Result |
|-------|--------|
| Insert workflow | **PASS** |
| Query A: lectures for Prof. X | **PASS** (2/2 rows) |
| Query B: outreach history across campaigns | **PASS** (2/2 rows) |
| Query C: visit assignments for campaign | **PASS** (1/1 rows) |
| Cleanup complete | **PASS** (0 orphans) |

Insert workflow **PASS** | Query patterns **3/3 pass** | Cleanup **PASS** | **VERDICT: APPROVE**
