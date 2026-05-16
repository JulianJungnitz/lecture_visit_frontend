import type {
  Lecture,
  Professor,
  LectureSchedule,
  StudyProgram,
  University,
} from '@/types/database'

interface BuildLecturePromptInput {
  lecture: Lecture & { university: University }
  professors: Professor[]
  schedules: LectureSchedule[]
  studyPrograms: (StudyProgram & { university: University })[]
}

function formatProfessorName(prof: Professor): string {
  return [prof.title, prof.first_name, prof.last_name].filter(Boolean).join(' ')
}

function getSalutation(gender: Professor['gender']): string | null {
  if (gender === 'male') return 'Herr'
  if (gender === 'female') return 'Frau'
  return null
}

export function buildLecturePrompt({
  lecture,
  professors,
  schedules,
  studyPrograms,
}: BuildLecturePromptInput): string {
  const lines: string[] = []

  lines.push(`# ${lecture.title}`)
  lines.push('')
  lines.push(
    'The following is structured information about a university lecture. Use it as context for any follow-up questions.',
  )
  lines.push('')

  // Overview
  lines.push('## Overview')
  lines.push(`- **University:** ${lecture.university.name}`)
  if (lecture.lecture_type) lines.push(`- **Type:** ${lecture.lecture_type}`)
  if (lecture.semester) lines.push(`- **Semester:** ${lecture.semester}`)
  if (lecture.description) lines.push(`- **Description:** ${lecture.description}`)
  if (lecture.source_url) lines.push(`- **Source:** ${lecture.source_url}`)
  if (lecture.notes) lines.push(`- **Notes:** ${lecture.notes}`)
  lines.push('')

  // Professors
  lines.push(`## Professors (${professors.length})`)
  if (professors.length === 0) {
    lines.push('_No professor information available._')
  } else {
    for (const prof of professors) {
      const salutation = getSalutation(prof.gender)
      const heading = [salutation, formatProfessorName(prof)].filter(Boolean).join(' ')
      lines.push(`- **${heading}**`)
      if (prof.department) lines.push(`  - Department: ${prof.department}`)
      if (prof.email) lines.push(`  - Email: ${prof.email}`)
      if (prof.source_url) lines.push(`  - Profile: ${prof.source_url}`)
    }
  }
  lines.push('')

  // Schedule
  lines.push(`## Schedule (${schedules.length})`)
  if (schedules.length === 0) {
    lines.push('_No schedule information available._')
  } else {
    for (const schedule of schedules) {
      const head = schedule.day_time ?? 'Unspecified time'
      lines.push(`- **${head}**`)
      if (schedule.frequency) lines.push(`  - Frequency: ${schedule.frequency}`)
      if (schedule.date_range) lines.push(`  - Date range: ${schedule.date_range}`)
      if (schedule.location) lines.push(`  - Location: ${schedule.location}`)
      if (schedule.room_url) lines.push(`  - Room: ${schedule.room_url}`)
    }
  }
  lines.push('')

  // Study Programs
  lines.push(`## Study Programs (${studyPrograms.length})`)
  if (studyPrograms.length === 0) {
    lines.push('_Not assigned to any study program._')
  } else {
    for (const program of studyPrograms) {
      lines.push(
        `- ${program.name} (${program.degree_type}, ${program.university.name})`,
      )
    }
  }

  return lines.join('\n').trimEnd() + '\n'
}
