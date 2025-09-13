/*
  # Create Merit List Management System Tables

  1. New Tables
    - `students`
      - `id` (uuid, primary key)
      - `name` (text)
      - `roll_number` (text, unique)
      - `email` (text, optional)
      - `phone` (text, optional)
      - `semester` (text)
      - `batch` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `subjects`
      - `id` (uuid, primary key)
      - `name` (text)
      - `code` (text, unique)
      - `max_marks` (integer)
      - `semester` (text)
      - `created_at` (timestamp)

    - `marks`
      - `id` (uuid, primary key)
      - `student_id` (uuid, foreign key)
      - `subject_id` (uuid, foreign key)
      - `marks` (integer)
      - `semester` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to perform CRUD operations
*/

-- Students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  roll_number text UNIQUE NOT NULL,
  email text,
  phone text,
  semester text NOT NULL,
  batch text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  max_marks integer NOT NULL DEFAULT 100,
  semester text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Marks table
CREATE TABLE IF NOT EXISTS marks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  marks integer NOT NULL DEFAULT 0,
  semester text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, subject_id, semester)
);

-- Enable Row Level Security
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE marks ENABLE ROW LEVEL SECURITY;

-- Create policies for students table
CREATE POLICY "Students are viewable by authenticated users"
  ON students FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Students are insertable by authenticated users"
  ON students FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Students are updatable by authenticated users"
  ON students FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Students are deletable by authenticated users"
  ON students FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for subjects table
CREATE POLICY "Subjects are viewable by authenticated users"
  ON subjects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Subjects are insertable by authenticated users"
  ON subjects FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Subjects are updatable by authenticated users"
  ON subjects FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Subjects are deletable by authenticated users"
  ON subjects FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for marks table
CREATE POLICY "Marks are viewable by authenticated users"
  ON marks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Marks are insertable by authenticated users"
  ON marks FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Marks are updatable by authenticated users"
  ON marks FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Marks are deletable by authenticated users"
  ON marks FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_roll_number ON students(roll_number);
CREATE INDEX IF NOT EXISTS idx_students_semester ON students(semester);
CREATE INDEX IF NOT EXISTS idx_subjects_semester ON subjects(semester);
CREATE INDEX IF NOT EXISTS idx_marks_student_semester ON marks(student_id, semester);
CREATE INDEX IF NOT EXISTS idx_marks_subject_semester ON marks(subject_id, semester);