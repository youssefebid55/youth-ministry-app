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

type AttendanceStatus = 'present' | 'late' | 'absent';

export default function AttendancePage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [serviceType, setServiceType] = useState<'friday' | 'sunday'>('friday');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'grade'>('name');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // TEMPORARILY DISABLED FOR UI DEVELOPMENT
  // useEffect(() => {
  //   checkAuth();
  // }, []);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (students.length > 0) {
      loadExistingAttendance();
    }
  }, [selectedDate, students]);

  // const checkAuth = async () => {
  //   const { data: { session } } = await supabase.auth.getSession();
  //   if (!session) {
  //     router.push('/login');
  //   }
  // };

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
      const initialAttendance: Record<string, AttendanceStatus> = {};
      data?.forEach(student => {
        initialAttendance[student.id] = 'absent';
      });
      setAttendance(initialAttendance);
    }
    setLoading(false);
  };

  const loadExistingAttendance = async () => {
    const { data, error } = await supabase
      .from('attendance_records')
      .select('student_id, status')
      .eq('attendance_date', selectedDate);

    if (!error && data) {
      const existingAttendance: Record<string, AttendanceStatus> = {};
      data.forEach(record => {
        existingAttendance[record.student_id] = record.status as AttendanceStatus;
      });
      setAttendance(prev => ({ ...prev, ...existingAttendance }));
    }
  };

  const setAttendanceStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    
    // Use a dummy servant ID for now since auth is disabled
    const servantId = '00000000-0000-0000-0000-000000000000';

    for (const studentId in attendance) {
      const { error } = await supabase
        .from('attendance_records')
        .upsert({
          student_id: studentId,
          attendance_date: selectedDate,
          was_present: attendance[studentId] === 'present' || attendance[studentId] === 'late',
          status: attendance[studentId],
          marked_by_servant_id: servantId,
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

  const presentCount = Object.values(attendance).filter(status => status === 'present').length;
  const lateCount = Object.values(attendance).filter(status => status === 'late').length;
  const absentCount = Object.values(attendance).filter(status => status === 'absent').length;

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

          <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{presentCount}</div>
              <div className="text-sm text-gray-600">Present</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{lateCount}</div>
              <div className="text-sm text-gray-600">Late</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{absentCount}</div>
              <div className="text-sm text-gray-600">Absent</div>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            {filteredAndSortedStudents.map((student) => (
              <div
                key={student.id}
                className="p-4 rounded-lg border-2 bg-white"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-medium text-gray-900">{student.name}</div>
                    <div className="text-sm text-gray-600">Grade {student.grade}</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setAttendanceStatus(student.id, 'present')}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                      attendance[student.id] === 'present'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Present
                  </button>

                  <button
                    onClick={() => setAttendanceStatus(student.id, 'late')}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                      attendance[student.id] === 'late'
                        ? 'bg-yellow-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Late
                  </button>

                  <button
                    onClick={() => setAttendanceStatus(student.id, 'absent')}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                      attendance[student.id] === 'absent'
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Absent
                  </button>
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