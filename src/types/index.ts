export interface Student {
  id: string;
  name: string;
  roll_number: string;
  email?: string;
  phone?: string;
  semester: string;
  batch: string;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  max_marks: number;
  semester: string;
  created_at: string;
}

export interface Mark {
  id: string;
  student_id: string;
  subject_id: string;
  marks: number;
  semester: string;
  created_at: string;
}

export interface MeritListEntry {
  student: Student;
  subjects: Array<{
    subject: Subject;
    marks: number;
  }>;
  total_marks: number;
  max_marks: number;
  percentage: number;
  rank: number;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
}