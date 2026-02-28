# AGENTS.md — Lecture Visit

## Project Vision

**Lecture Visit** is an internal coordination tool for a student club to plan and manage **lecture visit campaigns** — short promotional appearances during the first or second lecture of the semester at Munich universities. The initial focus is on **LMU** (Ludwig-Maximilians-Universität München) and **TUM** (Technische Universität München), with architecture designed to support additional universities over time.

The core idea: before each semester, the club needs to identify which lectures to visit, contact the right professors (without emailing the same person twice), and coordinate who visits which lecture. This app is the command center for that process.

## Problem Statement

Coordinating lecture visits across multiple universities is painful without tooling:

- **Scattered data** — Lecture info lives in PDFs, portals, and websites with different formats per university
- **Professor deduplication** — A professor may teach multiple lectures; emailing them once (not per lecture) requires tracking at the professor level
- **Filtering by relevance** — Not every lecture is worth visiting; the club needs to filter by study program, lecture size, type (Vorlesung vs Seminar), and timing
- **Outreach tracking** — Who has been contacted? Who said yes/no? Which lectures are confirmed for a visit?
- **Email drafting** — Writing personalized outreach emails to professors is repetitive and could be partially automated

## Core Domain Model

```
University (LMU, TUM, ...)
  └── Study Program (Physics BSc, Informatik MSc, ...)
        └── Lecture / Course
              ├── Title, Type (Vorlesung, Seminar, Übung, ...)
              ├── Schedule (day, time, location)
              ├── Semester (WiSe 2025/26, SoSe 2026, ...)
              └── Professor(s) / Lecturer(s)
                    └── Outreach Status (not contacted, emailed, confirmed, declined)
```

**Key relationships:**
- A university has many study programs
- A study program has many lectures
- A lecture belongs to one or more study programs (cross-listed)
- A lecture is taught by one or more professors
- A professor may teach at one university but across multiple programs
- **A professor is contacted ONCE, regardless of how many lectures they teach** — this is a core constraint

## Data Sources (Scrapers — Work in Progress)

Scrapers exist but are **not finalized**. The data in the scraper folders is preliminary and will be updated. Do not rely on current CSV contents or field names for schema design — treat them as directional only.

### LMU Scraper (`lmu_scraper/`)
  - Targets the LMU Veranstaltungsverzeichnis (course catalog) and study program listings
- Will produce: study programs, lectures, schedule info, professor names

### TUM Scraper (`tum_scraper/`)
- Playwright-based scraper targeting TUM Online for lecturer and course data
- Will produce: similar structure to LMU (programs, lectures, professors)

## Tech Stack

- **Frontend**: To be built (greenfield) — likely Next.js / React
- **Backend / Database**: Supabase (PostgreSQL) — schema deployed (`create_initial_schema`)
- **Data Pipeline**: Python scrapers (LMU + TUM) — work in progress, not yet finalized
- **Hosting**: TBD

## Feature Roadmap

### Phase 1 — Foundation (Core Infrastructure)
- [ ] Design and create Supabase database schema (universities, programs, lectures, professors, outreach status)
- [ ] Import scraped LMU and TUM data into Supabase
- [ ] Build frontend scaffold (Next.js)
- [ ] Browse & filter: universities → study programs → lectures → professors
- [ ] Professor-level deduplication (see all lectures per professor, across programs)

### Phase 2 — Outreach Workflow
- [ ] Professor outreach status tracking (not contacted / emailed / confirmed / declined)
- [ ] Filter professors by: not yet contacted, study program, lecture type, university
- [ ] Lecture visit assignment (who from the club visits which lecture)
- [ ] Dashboard: semester campaign overview (contacted, confirmed, pending, visited)

### Phase 3 — Email & Automation
- [ ] Email draft generation (first-pass template with professor name, lecture, program context)
- [ ] Email template management (different templates per campaign or university)
- [ ] Bulk outreach support (select multiple professors, generate drafts)
- [ ] History: outreach log per professor across semesters

### Phase 4 — Growth
- [ ] Add more universities beyond LMU and TUM
- [ ] Automated scraper pipeline (periodic data refresh per semester)
- [ ] Calendar view for visit scheduling (who goes where, when)
- [ ] Analytics: which programs/lectures yield the best recruitment results

## Architecture Decisions

Some decisions are resolved; others are still pending.

1. **Frontend framework** — Next.js App Router vs Pages Router vs other *(pending)*
2. **Styling approach** — Tailwind, CSS Modules, shadcn/ui, etc. *(pending)*
3. **Data import strategy** — One-time script vs ongoing sync pipeline *(pending)*
4. **Auth model** — **RESOLVED**: Supabase Auth with `profiles` table. Club-internal only.
5. **Schema design** — **RESOLVED**: Professor as first-class entity scoped per university. Campaigns model per-semester tracking. See Database Schema below.

## Database Schema

12 tables in Supabase PostgreSQL. Migration: `create_initial_schema`.

### Tables

| Table | Purpose |
|-------|---------|
| `universities` | LMU, TUM, and future institutions |
| `faculties` | Faculty groupings within a university (nullable for TUM programs) |
| `study_programs` | Degree programs (BSc Physics, MSc Informatik, etc.) |
| `lectures` | Individual courses — type, schedule, semester, notes, starred flag |
| `professors` | First-class entity scoped per university — name, email, external_id for scraper dedup |
| `lecture_professors` | Many-to-many: which professors teach which lectures |
| `lecture_study_programs` | Many-to-many: which lectures belong to which programs (cross-listing) |
| `profiles` | Club member profiles (mirrors auth.users id) — display_name |
| `campaigns` | Per-semester outreach campaigns (WiSe 2025/26, SoSe 2026, ...) |
| `campaign_professors` | Outreach status per professor per campaign (not_contacted → emailed → confirmed/declined) |
| `campaign_professor_lectures` | Which specific lectures were mentioned in each outreach |
| `visit_assignments` | Who from the club visits which lecture in a campaign |

### Key Design Decisions
- **Professor dedup**: One professor row per university. Contacted once per campaign regardless of how many lectures they teach.
- **Campaign model**: All outreach status lives in `campaign_professors` (not on the professor). New semester = new campaign. Full history preserved automatically.
- **Outreach statuses**: `not_contacted`, `emailed`, `confirmed`, `declined`
- **Source tracking**: `external_id` + `source` on lectures and professors enables clean scraper re-imports without duplicates
- **Profiles trigger**: `handle_new_user()` auto-creates a profile row when a club member signs up via Supabase Auth

## Conventions

- Database: Supabase (PostgreSQL), managed via MCP tooling
- Schema is deployed — 12 tables via migration `create_initial_schema`
- Scraped data is the source of truth for initial content
- Frontend repo is at `frontend/`, scrapers are sibling directories
