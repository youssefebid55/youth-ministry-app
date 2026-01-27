'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AlertCircle, Phone, Mail, ArrowLeft } from 'lucide-react';

interface Alert {
  id: string;
  name: string;
  grade: number;
  phone: string;
  parent_phone: string;
  weeks_absent: number;
}

export default function AlertsPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    fetchAlerts();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
    }
  };

  const fetchAlerts = async () => {
    setLoading(true);
    
    const sixWeeksAgo = new Date();
    sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42);
    
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .eq('is_active', true);

    if (studentsError) {
      console.error('Error fetching students:', studentsError);
      setLoading(false);
      return;
    }

    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance_records')
      .select('*')
      .gte('attendance_date', sixWeeksAgo.toISOString().split('T')[0]);

    if (attendanceError) {
      console.error('Error fetching attendance:', attendanceError);
      setLoading(false);
      return;
    }

    const alertStudents: Alert[] = [];
    
    students.forEach(student => {
      const studentAttendance = attendance.filter(a => a.student_id === student.id);
      const presentCount = studentAttendance.filter(a => a.was_present).length;
      const totalWeeks = 6;
      const weeksAbsent = totalWeeks - presentCount;

      if (weeksAbsent >= 2) {
        alertStudents.push({
          id: student.id,
          name: student.name,
          grade: student.grade,
          phone: student.phone || '',
          parent_phone: student.parent_phone || '',
          weeks_absent: weeksAbsent,
        });
      }
    });

    alertStudents.sort((a, b) => b.weeks_absent - a.weeks_absent);
    
    setAlerts(alertStudents);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <p>Loading alerts...</p>
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

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Absence Alerts</h1>
          <p className="text-gray-600">
            Students who have been absent for 2+ weeks in the last 6 weeks
          </p>
        </div>

        {alerts.length === 0 ? (
          <div className="card text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No alerts at this time</p>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div key={alert.id} className="card">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {alert.name}
                      </h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {alert.weeks_absent} weeks absent
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <p className="text-gray-600">
                        <strong>Grade:</strong> {alert.grade}
                      </p>
                      {alert.phone && (
                        <p className="text-gray-600 flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <a href={`tel:${alert.phone}`} className="text-primary-600 hover:text-primary-700">
                            {alert.phone}
                          </a>
                        </p>
                      )}
                      {alert.parent_phone && (
                        <p className="text-gray-600 flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <strong>Parent:</strong>
                          <a href={`tel:${alert.parent_phone}`} className="text-primary-600 hover:text-primary-700">
                            {alert.parent_phone}
                          </a>
                        </p>
                      )}
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-700 mb-2">
                        <strong>Suggested follow-up message:</strong>
                      </p>
                      <p className="text-sm text-gray-600 italic">
                        "Hi! We've noticed {alert.name} has been absent from youth ministry for the past few weeks. 
                        Is everything okay? We'd love to see them back! Let us know if there's anything we can do to help."
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}