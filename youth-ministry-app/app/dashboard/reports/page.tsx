'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Copy, Check } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  grade: number;
}

export default function ReportsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  // Auto-detect service type from date
  const getServiceType = (dateString: string): 'friday' | 'sunday' => {
    const date = new Date(dateString + 'T00:00:00');
    const dayOfWeek = date.getDay();
    return dayOfWeek === 5 ? 'friday' : 'sunday';
  };

  const serviceType = getServiceType(selectedDate);

  // TEMPORARILY DISABLED FOR UI DEVELOPMENT
  // useEffect(() => {
  //   checkAuth();
  // }, []);

  useEffect(() => {
    fetchStudents();
  }, []);

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
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching students:', error);
    } else {
      setStudents(data || []);
    }
    setLoading(false);
  };

  const generateReport = async () => {
    const { data: attendance, error } = await supabase
      .from('attendance_records')
      .select('student_id, status')
      .eq('attendance_date', selectedDate);

    if (error) {
      console.error('Error fetching attendance:', error);
      return;
    }

    // Get students who were present or late (both count as attended)
    const attendedStudentIds = attendance
      ?.filter(record => record.status === 'present' || record.status === 'late')
      .map(record => record.student_id) || [];

    const attendedStudents = students
      .filter(student => attendedStudentIds.includes(student.id))
      .map(student => student.name)
      .sort();

    const serviceLabel = serviceType === 'friday' ? 'Friday Bible Study' : 'Sunday School';
    const dateFormatted = new Date(selectedDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const reportMessage = `${serviceType === 'friday' ? '📖' : '⛪'} ${serviceLabel} - ${dateFormatted}

✅ Attended (${attendedStudents.length}):
${attendedStudents.map(name => `• ${name}`).join('\n')}

Total: ${attendedStudents.length} students attended`;

    setMessage(reportMessage);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

        <div className="card">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Generate Parent Message</h1>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input-field w-full"
            />
            <p className="text-sm text-gray-600 mt-1">
              {serviceType === 'friday' ? '📖 Friday Bible Study' : '⛪ Sunday School'}
            </p>
          </div>

          <button
            onClick={generateReport}
            className="btn-primary w-full mb-6"
          >
            Generate Message
          </button>

          {message && (
            <div>
              <div className="bg-gray-50 rounded-lg p-4 mb-4 font-mono text-sm whitespace-pre-wrap">
                {message}
              </div>

              <button
                onClick={copyToClipboard}
                className="btn-secondary w-full flex items-center justify-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy to Clipboard
                  </>
                )}
              </button>

              <p className="text-sm text-gray-600 mt-4 text-center">
                Copy this message and paste it into your parent WhatsApp group
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}