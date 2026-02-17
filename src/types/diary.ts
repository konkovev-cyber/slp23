// Типы для школьного дневника

export interface DiaryEntry {
  lesson_number: number;
  subject_name: string;
  teacher_name: string;
  room: string | null;
  homework?: {
    title: string;
    description: string;
  };
  grade?: {
    grade: string;
    comment: string | null;
  };
}

export interface DaySchedule {
  date: Date;
  entries: DiaryEntry[];
}

export interface ScheduleEntry {
  id: number;
  day_of_week: number;
  lesson_number: number;
  subject_name: string;
  teacher_name: string;
  room: string | null;
  start_time: string;
  end_time: string;
}

export interface HomeworkEntry {
  id: string;
  date: string;
  title: string;
  description: string;
  subject_name: string;
  teacher_assignment_id: number;
}

export interface GradeEntry {
  id: string;
  grade: string;
  comment: string | null;
  date: string;
  subject_name: string;
  weight?: number;
}

export interface StudentInfo {
  student_id: string;
  class_id: number;
  class_name: string;
}

export interface TeacherAssignment {
  id: number;
  subject_id: number;
  subject_name: string;
  teacher_id: string;
  teacher_name: string;
  class_id: number;
}

export interface ClassInfo {
  id: number;
  name: string;
}

export interface SubjectInfo {
  id: number;
  name: string;
}

export interface UserProfile {
  auth_id: string;
  full_name: string;
  role: 'student' | 'teacher' | 'parent' | 'admin';
  avatar_url?: string | null;
}

export interface ParentChildRelation {
  parent_id: string;
  child_id: string;
  child_name: string;
  class_name: string;
}

export interface UpcomingHomeworkItem {
  date: Date;
  subject: string;
  title: string;
  description?: string;
}
