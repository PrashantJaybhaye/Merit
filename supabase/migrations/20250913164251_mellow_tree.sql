/*
  # Insert Sample Data for Merit List Management System

  1. Sample Data
    - Sample subjects for different semesters
    - Sample students
    - Sample marks for demonstration

  This data is for testing and demonstration purposes.
*/

-- Insert sample subjects
INSERT INTO subjects (name, code, max_marks, semester) VALUES
  ('Mathematics', 'MATH101', 100, 'Semester 1'),
  ('Physics', 'PHY101', 100, 'Semester 1'),
  ('Chemistry', 'CHEM101', 100, 'Semester 1'),
  ('English', 'ENG101', 100, 'Semester 1'),
  ('Computer Science', 'CS101', 100, 'Semester 1'),
  
  ('Advanced Mathematics', 'MATH201', 100, 'Semester 2'),
  ('Mechanics', 'PHY201', 100, 'Semester 2'),
  ('Organic Chemistry', 'CHEM201', 100, 'Semester 2'),
  ('Literature', 'ENG201', 100, 'Semester 2'),
  ('Data Structures', 'CS201', 100, 'Semester 2')
ON CONFLICT (code) DO NOTHING;

-- Insert sample students
INSERT INTO students (name, roll_number, email, phone, semester, batch) VALUES
  ('Alice Johnson', 'ST001', 'alice@example.com', '+1234567890', 'Semester 1', '2024-2025'),
  ('Bob Smith', 'ST002', 'bob@example.com', '+1234567891', 'Semester 1', '2024-2025'),
  ('Charlie Brown', 'ST003', 'charlie@example.com', '+1234567892', 'Semester 1', '2024-2025'),
  ('Diana Prince', 'ST004', 'diana@example.com', '+1234567893', 'Semester 1', '2024-2025'),
  ('Eve Wilson', 'ST005', 'eve@example.com', '+1234567894', 'Semester 1', '2024-2025'),
  
  ('Frank Miller', 'ST006', 'frank@example.com', '+1234567895', 'Semester 2', '2023-2024'),
  ('Grace Lee', 'ST007', 'grace@example.com', '+1234567896', 'Semester 2', '2023-2024'),
  ('Henry Davis', 'ST008', 'henry@example.com', '+1234567897', 'Semester 2', '2023-2024'),
  ('Ivy Chen', 'ST009', 'ivy@example.com', '+1234567898', 'Semester 2', '2023-2024'),
  ('Jack Thompson', 'ST010', 'jack@example.com', '+1234567899', 'Semester 2', '2023-2024')
ON CONFLICT (roll_number) DO NOTHING;

-- Insert sample marks for Semester 1 students
DO $$
DECLARE
    student_record RECORD;
    subject_record RECORD;
    random_marks INTEGER;
BEGIN
    -- Get Semester 1 students and subjects
    FOR student_record IN 
        SELECT id, semester FROM students WHERE semester = 'Semester 1'
    LOOP
        FOR subject_record IN 
            SELECT id FROM subjects WHERE semester = student_record.semester
        LOOP
            -- Generate random marks between 60-95
            random_marks := 60 + floor(random() * 36);
            
            INSERT INTO marks (student_id, subject_id, marks, semester)
            VALUES (student_record.id, subject_record.id, random_marks, student_record.semester)
            ON CONFLICT (student_id, subject_id, semester) DO NOTHING;
        END LOOP;
    END LOOP;

    -- Get Semester 2 students and subjects
    FOR student_record IN 
        SELECT id, semester FROM students WHERE semester = 'Semester 2'
    LOOP
        FOR subject_record IN 
            SELECT id FROM subjects WHERE semester = student_record.semester
        LOOP
            -- Generate random marks between 65-98
            random_marks := 65 + floor(random() * 34);
            
            INSERT INTO marks (student_id, subject_id, marks, semester)
            VALUES (student_record.id, subject_record.id, random_marks, student_record.semester)
            ON CONFLICT (student_id, subject_id, semester) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;