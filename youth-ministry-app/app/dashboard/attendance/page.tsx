'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Search } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  grade: number;
}

export default function AttendancePage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [serviceType, setServiceType] = useState<'friday' | 'sunday'>('friday');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'grade'>('name');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchStudents();
  }, []);

  useEffect(() => {
    if (students.length > 0) {
      loadExistingAttendance();
    }
  }, [selectedDate, students]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
    }
  };

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from('students')
      .select('id, name, grade')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching students:', error);
    } else {
      setStudents(data || []);
      const initialAttendance: Record<string, boolean> = {};
      data?.forEach(student => {
        initialAttendance[student.id] = false;
      });
      setAttendance(initialAttendance);
    }
    setLoading(false);
  };

  const loadExistingAttendance = async () => {
    const { data, error } = await supabase
      .from('attendance_records')
      .select('student_id, was_present')
      .eq('attendance_date', selectedDate);

    if (!error && data) {
      const existingAttendance: Record<string, boolean> = {};
      data.forEach(record => {
        existingAttendance[record.student_id] = record.was_present;
      });
      setAttendance(prev => ({ ...prev, ...existingAttendance }));
    }
  };

  const toggleAttendance = (studentId: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      alert('You must be logged in to save attendance');
      setSaving(false);
      return;
    }

    for (const studentId in attendance) {
      const { error } = await supabase
        .from('attendance_records')
        .upsert({
          student_id: studentId,
          attendance_date: selectedDate,
          was_present: attendance[studentId],
          marked_by_servant_id: session.user.id,
        }, {
          onConflict: 'student_id,attendance_date'
        });

      if (error) {
        console.error('Error saving attendance:', error);
        alert('Error saving attendance');
        setSaving(false);
        return;
      }
    }

    alert('Attendance saved successfully!');
    setSaving(false);
  };

  const filteredAndSortedStudents = students
    .filter(student => student.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else {
        return a.grade - b.grade;
      }
    });

  const presentCount = Object.values(attendance).filter(present => present).length;
  const absentCount = students.length - presentCount;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className="card mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Take Attendance</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="input-field w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Type
              </label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value as 'friday' | 'sunday')}
                className="input-field w-full"
              >
                <option value="friday">Friday Service</option>
                <option value="sunday">Sunday Service</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10 w-full"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'grade')}
              className="input-field"
            >
              <option value="name">Sort by Name</option>
              <option value="grade">Sort by Grade</option>
            </select>
          </div>

          <div className="flex gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex-1 text-center">
              <div className="text-2xl font-bold text-green-600">{presentCount}</div>
              <div className="text-sm text-gray-600">Present</div>
            </div>
            <div className="flex-1 text-center">
              <div className="text-2xl font-bold text-red-600">{absentCount}</div>
              <div className="text-sm text-gray-600">Absent</div>
            </div>
          </div>

          <div className="space-y-2 mb-6">
            {filteredAndSortedStudents.map((student) => (
              <div
                key={student.id}
                onClick={() => toggleAttendance(student.id)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  attendance[student.id]
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{student.name}</div>
                    <div className="text-sm text-gray-600">Grade {student.grade}</div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    attendance[student.id]
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {attendance[student.id] ? 'Present' : 'Absent'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary w-full"
          >
            {saving ? 'Saving...' : 'Save Attendance'}
          </button>
        </div>
      </div>
    </div>
  );
}