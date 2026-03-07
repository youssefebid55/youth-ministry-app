'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Save, Check, X, Clock, AlertTriangle } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  grade: number;
}

type AttendanceStatus = 'present' | 'absent' | 'late';

interface AttendanceRecord {
  student_id: string;
  status: AttendanceStatus;
}

export default function AttendancePage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [selectedDate, setSelectedDate] = useState('');
  const [dateOptions, setDateOptions] = useState<{date: string, label: string, day: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [serviceType, setServiceType] = useState<'friday' | 'saturday'>('friday');
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
      setServiceType(day === 5 ? 'friday' : 'saturday');
    }
  }, [selectedDate]);

  const generateDateOptions = () => {
    const options: {date: string, label: string, day: string}[] = [];
    const today = new Date();
    
    // Generate last 8 Fridays and Saturdays
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const day = date.getDay();
      
      // 5 = Friday, 6 = Saturday
      if (day === 5 || day === 6) {
        const dateStr = date.toISOString().split('T')[0];
        const dayName = day === 5 ? 'Friday' : 'Saturday';
        const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        options.push({ date: dateStr, label: `${dayName} ${label}`, day: dayName });
        
        if (options.length >= 8) break;
      }
    }

    setDateOptions(options);
    
    // Default to most recent Friday or Saturday
    if (options.length > 0) {
      setSelectedDate(options[0].date);
    }
  };

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from('students')
      .select('id, name, grade')
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

  const toggleStatus = (studentId: string) => {
    setAttendance(prev => {
      const current = prev[studentId];
      let next: AttendanceStatus;
      if (current === 'absent') next = 'present';
      else if (current === 'present') next = 'late';
      else next = 'absent';
      return { ...prev, [studentId]: next };
    });
  };

  const markAllPresent = () => {
    const newAttendance: Record<string, AttendanceStatus> = {};
    students.forEach(s => newAttendance[s.id] = 'present');
    setAttendance(newAttendance);
  };

  const markAllAbsent = () => {
    const newAttendance: Record<string, AttendanceStatus> = {};
    students.forEach(s => newAttendance[s.id] = 'absent');
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

  const getStatusIcon = (status: AttendanceStatus) => {
    switch (status) {
      case 'present': return <Check className="w-5 h-5 text-green-600" />;
      case 'late': return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'absent': return <X className="w-5 h-5 text-red-600" />;
    }
  };

  const getStatusClass = (status: AttendanceStatus) => {
    switch (status) {
      case 'present': return 'bg-green-100 border-green-300';
      case 'late': return 'bg-yellow-100 border-yellow-300';
      case 'absent': return 'bg-red-100 border-red-300';
    }
  };

  const presentCount = Object.values(attendance).filter(s => s === 'present').length;
  const lateCount = Object.values(attendance).filter(s => s === 'late').length;
  const absentCount = Object.values(attendance).filter(s => s === 'absent').length;

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

          {/* Date Selection - Only Fridays & Saturdays */}
          <div className="flex flex-wrap gap-2 mb-4">
            {dateOptions.map(option => (
              <button
                key={option.date}
                onClick={() => setSelectedDate(option.date)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="w-5 h-5" />
                <span>This class was cancelled</span>
              </div>
              <button
                onClick={handleUncancelClass}
                className="text-sm text-red-600 hover:text-red-800 underline"
              >
                Uncancel
              </button>
            </div>
          )}

          {/* Stats & Actions */}
          <div className="flex items-center justify-between">
            <div className="flex gap-4 text-sm">
              <span className="text-green-600">✓ {presentCount} present</span>
              <span className="text-yellow-600">⏱ {lateCount} late</span>
              <span className="text-red-600">✗ {absentCount} absent</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={markAllPresent}
                className="text-sm text-primary-600 hover:text-primary-800"
              >
                All Present
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={markAllAbsent}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                All Absent
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={handleCancelClass}
                className="text-sm text-red-600 hover:text-red-800"
                disabled={isCancelled}
              >
                Cancel Class
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="space-y-2">
          {students.map(student => (
            <button
              key={student.id}
              onClick={() => toggleStatus(student.id)}
              disabled={isCancelled}
              className={`w-full flex items-center justify-between p-4 rounded-lg border transition-colors ${
                isCancelled ? 'opacity-50 cursor-not-allowed' : ''
              } ${getStatusClass(attendance[student.id])}`}
            >
              <div className="text-left">
                <p className="font-medium text-gray-900">{student.name}</p>
                <p className="text-sm text-gray-600">Grade {student.grade}</p>
              </div>
              {getStatusIcon(attendance[student.id])}
            </button>
          ))}
        </div>

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