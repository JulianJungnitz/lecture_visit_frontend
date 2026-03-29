export type University = {
  id: string
  name: string
  full_name: string | null
  website: string | null
}

export type Faculty = {
  id: string
  university_id: string
  name: string
}

export type StudyProgram = {
  id: string
  university_id: string
  faculty_id: string | null
  name: string
  degree_type: string
  category: string | null
  studienordnung_url: string | null
  url: string | null
  is_starred: boolean | null
}

export type SemesterType =
  | 'SoSe 2026' | 'WiSe 2026/27' | 'SoSe 2027' | 'WiSe 2027/28'
  | 'SoSe 2028' | 'WiSe 2028/29' | 'SoSe 2029' | 'WiSe 2029/30'
  | 'SoSe 2030' | 'WiSe 2030/31'

export type OutreachStatus = 'not_contacted' | 'emailed' | 'confirmed' | 'declined' | 'done'

export type Lecture = {
  id: string
  university_id: string
  title: string
  lecture_type: string | null
  semester: SemesterType | null
  description: string | null
  source_url: string | null
  external_id: string | null
  is_starred: boolean | null
  notes: string | null
  owner: string | null
  outreach_status: OutreachStatus | null
  estimated_attendees: number | null
  ics_uid: string | null
}

export type ProfessorGender = 'male' | 'female' | 'other' | 'unknown'

export type Professor = {
  id: string
  university_id: string
  first_name: string
  last_name: string | null
  email: string | null
  title: string | null
  gender: ProfessorGender
  department: string | null
  source_url: string | null
  notes: string | null
}

export type LectureSchedule = {
  id: string
  lecture_id: string
  day_time: string | null
  frequency: string | null
  location: string | null
  room_url: string | null
  date_range: string | null
}

// Junction table types
export type LectureProfessor = {
  lecture_id: string
  professor_id: string
}

export type LectureStudyProgram = {
  lecture_id: string
  study_program_id: string
  lecture_obligation: string | null
}

export type LectureWithObligation = Lecture & {
  lecture_obligation: string | null
}

// Composite types for common query results
export type StudyProgramWithUniversity = StudyProgram & {
  university: University
}

export type StudyProgramWithDetails = StudyProgram & {
  university: University
  faculty: Faculty | null
}

export type LectureWithDetails = Lecture & {
  university: University
  professors: Professor[]
  schedules: LectureSchedule[]
  study_programs: StudyProgram[]
}

export type ProfessorWithUniversity = Professor & {
  university: University
}

export type Profile = {
  id: string
  display_name: string | null
  is_admin: boolean | null
  created_at: string
  updated_at: string
}

export type LectureWithOwnerProfile = Lecture & {
  owner_profile: Profile | null
}

// Parameter type for settings
export type Parameter = {
  key: string
  value: string | null
}
