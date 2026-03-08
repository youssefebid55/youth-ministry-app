'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Save, Search, AlertTriangle } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  grade: number;
  gender: string;
}

type AttendanceStatus = 'present' | 'absent' | 'late';

export default function AttendancePage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [selectedDate, setSelectedDate] = useState('');
  const [dateOptions, setDateOptions] = useState<{date: string, label: string}[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [filterGender, setFilterGender] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [serviceType, setServiceType] = useState<'friday' | 'sunday'>('friday');
  const [isCancelled, setIsCancelled] = useState(false);

  useEffect(() => {
    generateDateOptions();
    fetchStudents();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchAttendance();
      checkCancellation();
      // Set service type based on day
      const date = new Date(selectedDate + 'T00:00:00');
      const day = date.getDay();
      setServiceType(day === 5 ? 'friday' : 'sunday');
    }
  }, [selectedDate]);

  const generateDateOptions = () => {
    const options: {date: string, label: string}[] = [];
    const today = new Date();
    
    // Generate last 8 Fridays and Sundays
    for (let i = 0; i < 60; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const day = date.getDay();
      
      // 5 = Friday, 0 = Sunday
      if (day === 5 || day === 0) {
        const dateStr = date.toISOString().split('T')[0];
        const dayName = day === 5 ? 'Fri' : 'Sun';
        const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        options.push({ date: dateStr, label: `${dayName} ${label}` });
        
        if (options.length >= 8) break;
      }
    }

    setDateOptions(options);
    
    // Default to most recent Friday or Sunday
    if (options.length > 0) {
      setSelectedDate(options[0].date);
    }
  };

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from('students')
      .select('id, name, grade, gender')
      .eq('is_active', true)
      .order('grade')
      .order('name');

    if (!error && data) {
      setStudents(data);
      // Initialize all as absent
      const initialAttendance: Record<string, AttendanceStatus> = {};
      data.forEach(s => initialAttendance[s.id] = 'absent');
      setAttendance(initialAttendance);
    }
    setLoading(false);
  };

  const fetchAttendance = async () => {
    const { data, error } = await supabase
      .from('attendance_records')
      .select('student_id, was_present, was_late')
      .eq('attendance_date', selectedDate);

    if (!error && data) {
      const attendanceMap: Record<string, AttendanceStatus> = {};
      // Start with all absent
      students.forEach(s => attendanceMap[s.id] = 'absent');
      // Then override with actual records
      data.forEach(record => {
        if (record.was_late) {
          attendanceMap[record.student_id] = 'late';
        } else if (record.was_present) {
          attendanceMap[record.student_id] = 'present';
        } else {
          attendanceMap[record.student_id] = 'absent';
        }
      });
      setAttendance(attendanceMap);
    }
  };

  const checkCancellation = async () => {
    const { data } = await supabase
      .from('class_cancellations')
      .select('*')
      .eq('cancellation_date', selectedDate)
      .single();
    
    setIsCancelled(!!data);
  };

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const markAllPresent = () => {
    const newAttendance: Record<string, AttendanceStatus> = {};
    students.forEach(s => newAttendance[s.id] = 'present');
    setAttendance(newAttendance);
  };

  const handleSave = async () => {
    if (isCancelled) {
      alert('Cannot save attendance for a cancelled class');
      return;
    }

    setSaving(true);

    // Delete existing records for this date
    await supabase
      .from('attendance_records')
      .delete()
      .eq('attendance_date', selectedDate);

    // Build all records
    const records = Object.entries(attendance).map(([studentId, status]) => ({
      student_id: studentId,
      attendance_date: selectedDate,
      service_type: serviceType,
      was_present: status === 'present' || status === 'late',
      was_late: status === 'late',
    }));

    // Batch insert all at once
    const { error } = await supabase
      .from('attendance_records')
      .insert(records);

    if (error) {
      console.error('Error saving:', error);
      alert('Error saving attendance');
    } else {
      alert('Attendance saved!');
    }

    setSaving(false);
  };

  const handleCancelClass = async () => {
    const confirm = window.confirm(
      'Mark this class as cancelled? This will exclude it from absence calculations.'
    );
    if (!confirm) return;

    const { error } = await supabase
      .from('class_cancellations')
      .insert({ cancellation_date: selectedDate });

    if (!error) {
      setIsCancelled(true);
    }
  };

  const handleUncancelClass = async () => {
    await supabase
      .from('class_cancellations')
      .delete()
      .eq('cancellation_date', selectedDate);
    
    setIsCancelled(false);
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = filterGrade === 'all' || student.grade.toString() === filterGrade;
    const matchesGender = filterGender === 'all' || student.gender === filterGender;
    return matchesSearch && matchesGrade && matchesGender;
  });

  const presentCount = Object.values(attendance).filter(s => s === 'present').length;
  const lateCount = Object.values(attendance).filter(s => s === 'late').length;
  const absentCount = Object.values(attendance).filter(s => s === 'absent').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>

          <h1 className="text-2xl font-bold text-gray-900 mb-4">Take Attendance</h1>

          {/* Date Selection */}
          <div className="flex flex-wrap gap-2 mb-4">
            {dateOptions.map(option => (
              <button
                key={option.date}
                onClick={() => setSelectedDate(option.date)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedDate === option.date
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Cancelled Warning */}
          {isCancelled && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-800 text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Class cancelled</span>
              </div>
              <button
                onClick={handleUncancelClass}
                className="text-xs text-red-600 hover:text-red-800 underline"
              >
                Uncancel
              </button>
            </div>
          )}

          {/* Search and Filter */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10 w-full"
                style={{ 
                  color: '#111827',
                  WebkitTextFillColor: '#111827',
                  fontSize: '16px'
                }}
              />
            </div>
            <select
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              className="input-field"
              style={{ fontSize: '16px' }}
            >
              <option value="all">All Grades</option>
              <option value="9">Grade 9</option>
              <option value="10">Grade 10</option>
              <option value="11">Grade 11</option>
              <option value="12">Grade 12</option>
            </select>
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className="input-field"
              style={{ fontSize: '16px' }}
            >
              <option value="all">All</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          {/* Stats & Quick Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <div className="flex gap-3">
              <span className="text-green-600">✓ {presentCount}</span>
              <span className="text-yellow-600">⏱ {lateCount}</span>
              <span className="text-red-600">✗ {absentCount}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={markAllPresent}
                className="text-primary-600 hover:text-primary-800"
              >
                All Present
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={handleCancelClass}
                className="text-red-600 hover:text-red-800"
                disabled={isCancelled}
              >
                Cancel Class
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4">
        <div className="space-y-2">
          {filteredStudents.map(student => (
            <div
              key={student.id}
              className="bg-white p-3 rounded-lg border border-gray-200"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium text-gray-900">{student.name}</p>
                  <p className="text-sm text-gray-600">Grade {student.grade}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setStatus(student.id, 'present')}
                  disabled={isCancelled}
                  className={`py-2.5 px-3 rounded font-medium transition-colors ${
                    attendance[student.id] === 'present'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } ${isCancelled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Present
                </button>
                <button
                  onClick={() => setStatus(student.id, 'late')}
                  disabled={isCancelled}
                  className={`py-2.5 px-3 rounded font-medium transition-colors ${
                    attendance[student.id] === 'late'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } ${isCancelled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Late
                </button>
                <button
                  onClick={() => setStatus(student.id, 'absent')}
                  disabled={isCancelled}
                  className={`py-2.5 px-3 rounded font-medium transition-colors ${
                    attendance[student.id] === 'absent'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } ${isCancelled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Absent
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredStudents.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">No students found</p>
          </div>
        )}

        {!isCancelled && (
          <div className="sticky bottom-4 mt-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-lg shadow-lg"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}