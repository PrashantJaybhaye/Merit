import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import { supabase } from '../lib/supabase';
import { MeritListEntry, Student, Subject, Mark } from '../types';
import { 
  ArrowLeft, 
  Trophy, 
  Download, 
  Search, 
  Filter,
  Medal,
  Award,
  Star
} from 'lucide-react';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

interface MeritListProps {
  onBack: () => void;
}

const MeritList: React.FC<MeritListProps> = ({ onBack }) => {
  const [meritList, setMeritList] = useState<MeritListEntry[]>([]);
  const [filteredList, setFilteredList] = useState<MeritListEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [minPercentage, setMinPercentage] = useState('');
  const [maxPercentage, setMaxPercentage] = useState('');

  useEffect(() => {
    loadMeritList();
  }, []);

  useEffect(() => {
    filterMeritList();
  }, [meritList, selectedSemester, searchTerm, minPercentage, maxPercentage]);

  const loadMeritList = async () => {
    try {
      // Get all students with their marks and subjects
      const { data: studentsData } = await supabase
        .from('students')
        .select('*')
        .order('name');

      const { data: marksData } = await supabase
        .from('marks')
        .select(`
          *,
          subjects!inner(*)
        `);

      const { data: subjectsData } = await supabase
        .from('subjects')
        .select('*');

      if (!studentsData || !marksData || !subjectsData) return;

      // Group marks by student and semester
      const studentMarks: { [key: string]: { [semester: string]: Array<{ subject: Subject; marks: number }> } } = {};
      
      marksData.forEach(mark => {
        if (!studentMarks[mark.student_id]) {
          studentMarks[mark.student_id] = {};
        }
        if (!studentMarks[mark.student_id][mark.semester]) {
          studentMarks[mark.student_id][mark.semester] = [];
        }
        studentMarks[mark.student_id][mark.semester].push({
          subject: mark.subjects,
          marks: mark.marks
        });
      });

      // Create merit list entries
      const entries: MeritListEntry[] = [];

      studentsData.forEach(student => {
        const semesterMarks = studentMarks[student.id]?.[student.semester];
        if (!semesterMarks || semesterMarks.length === 0) return;

        const totalMarks = semesterMarks.reduce((sum, item) => sum + item.marks, 0);
        const maxMarks = semesterMarks.reduce((sum, item) => sum + item.subject.max_marks, 0);
        const percentage = maxMarks > 0 ? (totalMarks / maxMarks) * 100 : 0;

        entries.push({
          student,
          subjects: semesterMarks,
          total_marks: totalMarks,
          max_marks: maxMarks,
          percentage,
          rank: 0 // Will be calculated after sorting
        });
      });

      // Sort by percentage (descending) and assign ranks
      entries.sort((a, b) => b.percentage - a.percentage);
      entries.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      setMeritList(entries);
    } catch (error) {
      console.error('Error loading merit list:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterMeritList = () => {
    let filtered = meritList;

    if (selectedSemester) {
      filtered = filtered.filter(entry => entry.student.semester === selectedSemester);
    }

    if (searchTerm) {
      filtered = filtered.filter(entry =>
        entry.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.student.roll_number.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (minPercentage) {
      filtered = filtered.filter(entry => entry.percentage >= parseFloat(minPercentage));
    }

    if (maxPercentage) {
      filtered = filtered.filter(entry => entry.percentage <= parseFloat(maxPercentage));
    }

    // Re-rank filtered results
    filtered.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    setFilteredList(filtered);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text('Merit List', 20, 20);
    
    if (selectedSemester) {
      doc.setFontSize(14);
      doc.text(`Semester: ${selectedSemester}`, 20, 30);
    }
    
    // Table headers
    doc.setFontSize(10);
    let y = selectedSemester ? 45 : 35;
    
    doc.text('Rank', 20, y);
    doc.text('Name', 40, y);
    doc.text('Roll Number', 90, y);
    doc.text('Total', 130, y);
    doc.text('Percentage', 160, y);
    
    y += 5;
    doc.line(20, y, 190, y); // Horizontal line
    y += 10;
    
    // Table data
    filteredList.slice(0, 30).forEach((entry, index) => { // Limit to 30 entries for PDF
      doc.text(entry.rank.toString(), 20, y);
      doc.text(entry.student.name.substring(0, 20), 40, y);
      doc.text(entry.student.roll_number, 90, y);
      doc.text(`${entry.total_marks}/${entry.max_marks}`, 130, y);
      doc.text(`${entry.percentage.toFixed(2)}%`, 160, y);
      y += 8;
      
      if (y > 280) { // New page
        doc.addPage();
        y = 20;
      }
    });
    
    doc.save(`merit-list-${selectedSemester || 'all'}.pdf`);
  };

  const exportToExcel = () => {
    const data = filteredList.map(entry => ({
      Rank: entry.rank,
      Name: entry.student.name,
      'Roll Number': entry.student.roll_number,
      Semester: entry.student.semester,
      Batch: entry.student.batch,
      'Total Marks': entry.total_marks,
      'Max Marks': entry.max_marks,
      'Percentage': entry.percentage.toFixed(2) + '%'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Merit List');
    XLSX.writeFile(wb, `merit-list-${selectedSemester || 'all'}.xlsx`);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Medal className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Award className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Star className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-gray-600">#{rank}</span>;
    }
  };

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600 bg-green-50';
    if (percentage >= 80) return 'text-blue-600 bg-blue-50';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-50';
    if (percentage >= 60) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const semesters = [...new Set(meritList.map(entry => entry.student.semester))];

  return (
    <Layout title="Merit List">
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
              <Trophy className="h-5 w-5 text-purple-600" />
              <h1 className="text-2xl font-bold text-gray-900">Merit List</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={exportToPDF}
              disabled={filteredList.length === 0}
              className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4" />
              <span>PDF</span>
            </button>
            <button
              onClick={exportToExcel}
              disabled={filteredList.length === 0}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4" />
              <span>Excel</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">All Semesters</option>
                {semesters.map(semester => (
                  <option key={semester} value={semester}>{semester}</option>
                ))}
              </select>
            </div>
            
            <input
              type="number"
              placeholder="Min %"
              value={minPercentage}
              onChange={(e) => setMinPercentage(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
            
            <input
              type="number"
              placeholder="Max %"
              value={maxPercentage}
              onChange={(e) => setMaxPercentage(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
            
            <button
              onClick={() => {
                setSelectedSemester('');
                setSearchTerm('');
                setMinPercentage('');
                setMaxPercentage('');
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Merit List Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Merit List ({filteredList.length} students)
            </h3>
          </div>

          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading merit list...</p>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="p-6 text-center">
              <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No results found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Academic Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Marks
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Percentage
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredList.map((entry) => (
                    <tr key={entry.student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {getRankIcon(entry.rank)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {entry.student.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            Roll: {entry.student.roll_number}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{entry.student.semester}</div>
                        <div className="text-sm text-gray-500">Batch: {entry.student.batch}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {entry.total_marks} / {entry.max_marks}
                        </div>
                        <div className="text-sm text-gray-500">
                          {entry.subjects.length} subjects
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getPercentageColor(entry.percentage)}`}>
                          {entry.percentage.toFixed(2)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Performers */}
        {filteredList.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Performers</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredList.slice(0, 3).map((entry, index) => (
                <div
                  key={entry.student.id}
                  className={`p-4 rounded-lg border-2 ${
                    index === 0 ? 'border-yellow-300 bg-yellow-50' :
                    index === 1 ? 'border-gray-300 bg-gray-50' :
                    'border-amber-300 bg-amber-50'
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    {getRankIcon(entry.rank)}
                    <div className="font-medium text-gray-900">{entry.student.name}</div>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Roll: {entry.student.roll_number}</p>
                    <p>Marks: {entry.total_marks}/{entry.max_marks}</p>
                    <p className="font-medium">{entry.percentage.toFixed(2)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MeritList;