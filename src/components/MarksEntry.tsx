import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import { supabase } from '../lib/supabase';
import { Student, Subject, Mark } from '../types';
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  BookOpen, 
  Save,
  X,
  Filter,
  AlertCircle
} from 'lucide-react';

interface MarksEntryProps {
  onBack: () => void;
}

const MarksEntry: React.FC<MarksEntryProps> = ({ onBack }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectForm, setSubjectForm] = useState({
    name: '',
    code: '',
    max_marks: 100,
    semester: ''
  });
  const [marksData, setMarksData] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [studentsResult, subjectsResult, marksResult] = await Promise.all([
        supabase.from('students').select('*').order('name'),
        supabase.from('subjects').select('*').order('name'),
        supabase.from('marks').select('*')
      ]);

      setStudents(studentsResult.data || []);
      setSubjects(subjectsResult.data || []);
      setMarks(marksResult.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('subjects')
        .insert([subjectForm]);

      if (error) throw error;

      setSubjectForm({
        name: '',
        code: '',
        max_marks: 100,
        semester: ''
      });
      setShowSubjectForm(false);
      loadData();
    } catch (error) {
      console.error('Error saving subject:', error);
      alert('Error saving subject. Please try again.');
    }
  };

  const handleMarksSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    try {
      // Delete existing marks for this student and semester
      await supabase
        .from('marks')
        .delete()
        .eq('student_id', selectedStudent.id)
        .eq('semester', selectedStudent.semester);

      // Insert new marks
      const marksToInsert = Object.entries(marksData)
        .filter(([_, marks]) => marks > 0)
        .map(([subjectId, marksValue]) => ({
          student_id: selectedStudent.id,
          subject_id: subjectId,
          marks: marksValue,
          semester: selectedStudent.semester
        }));

      if (marksToInsert.length > 0) {
        const { error } = await supabase
          .from('marks')
          .insert(marksToInsert);

        if (error) throw error;
      }

      alert('Marks saved successfully!');
      setSelectedStudent(null);
      setMarksData({});
      loadData();
    } catch (error) {
      console.error('Error saving marks:', error);
      alert('Error saving marks. Please try again.');
    }
  };

  const loadStudentMarks = async (student: Student) => {
    try {
      const { data } = await supabase
        .from('marks')
        .select('*')
        .eq('student_id', student.id)
        .eq('semester', student.semester);

      const marksMap: { [key: string]: number } = {};
      data?.forEach(mark => {
        marksMap[mark.subject_id] = mark.marks;
      });
      setMarksData(marksMap);
    } catch (error) {
      console.error('Error loading student marks:', error);
    }
  };

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student);
    loadStudentMarks(student);
  };

  const getFilteredStudents = () => {
    let filtered = students;
    
    if (selectedSemester) {
      filtered = filtered.filter(s => s.semester === selectedSemester);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.roll_number.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  const getSubjectsForSemester = (semester: string) => {
    return subjects.filter(s => s.semester === semester);
  };

  const semesters = [...new Set(students.map(s => s.semester))].filter(Boolean);

  return (
    <Layout title="Marks Entry">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Dashboard</span>
            </button>
            <div className="h-6 border-l border-gray-300"></div>
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-green-600" />
              <h1 className="text-2xl font-bold text-gray-900">Marks Entry</h1>
            </div>
          </div>
          <button
            onClick={() => setShowSubjectForm(true)}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Subject</span>
          </button>
        </div>

        {/* Subject Form */}
        {showSubjectForm && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Add New Subject</h2>
              <button
                onClick={() => setShowSubjectForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubjectSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject Name *
                </label>
                <input
                  type="text"
                  required
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject Code *
                </label>
                <input
                  type="text"
                  required
                  value={subjectForm.code}
                  onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Marks *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={subjectForm.max_marks}
                  onChange={(e) => setSubjectForm({ ...subjectForm, max_marks: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Semester *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Semester 1"
                  value={subjectForm.semester}
                  onChange={(e) => setSubjectForm({ ...subjectForm, semester: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div className="md:col-span-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowSubjectForm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Subject</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Student Selection */}
        {!selectedStudent && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Student</h2>
            
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">All Semesters</option>
                  {semesters.map(semester => (
                    <option key={semester} value={semester}>{semester}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Students Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getFilteredStudents().map(student => (
                <button
                  key={student.id}
                  onClick={() => handleStudentSelect(student)}
                  className="text-left p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
                >
                  <div className="font-medium text-gray-900">{student.name}</div>
                  <div className="text-sm text-gray-500">Roll: {student.roll_number}</div>
                  <div className="text-sm text-gray-500">{student.semester}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Marks Entry Form */}
        {selectedStudent && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Enter Marks</h2>
                <p className="text-gray-600">
                  Student: {selectedStudent.name} (Roll: {selectedStudent.roll_number})
                </p>
                <p className="text-sm text-gray-500">{selectedStudent.semester}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedStudent(null);
                  setMarksData({});
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleMarksSubmit} className="space-y-4">
              {getSubjectsForSemester(selectedStudent.semester).length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">
                    No subjects found for {selectedStudent.semester}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    Please add subjects for this semester first.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {getSubjectsForSemester(selectedStudent.semester).map(subject => (
                      <div key={subject.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-medium text-gray-900">{subject.name}</h3>
                          <span className="text-sm text-gray-500">Max: {subject.max_marks}</span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          max={subject.max_marks}
                          value={marksData[subject.id] || ''}
                          onChange={(e) => setMarksData({
                            ...marksData,
                            [subject.id]: parseInt(e.target.value) || 0
                          })}
                          placeholder={`Enter marks (0-${subject.max_marks})`}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStudent(null);
                        setMarksData({});
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Save className="h-4 w-4" />
                      <span>Save Marks</span>
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MarksEntry;