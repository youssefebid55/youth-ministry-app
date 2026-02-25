'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AlertCircle, Phone, ArrowLeft, Settings } from 'lucide-react';

interface Alert {
  id: string;
  name: string;
  grade: number;
  phone: string;
  parent_phone: string;
  parent_name: string;
  weeks_absent: number;
  last_seen: string | null;
  servant_name: string | null;
}

export default function AlertsPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [seasonStartDate, setSeasonStartDate] = useState<string | null>(null);
  const [weeksThreshold, setWeeksThreshold] = useState(2);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);

    // Get settings
    const { data: settingsData } = await supabase
      .from('settings')
      .select('*');

    let startDate: string | null = null;
    let threshold = 2;

    settingsData?.forEach(setting => {
      if (setting.key === 'season_start_date') {
        startDate = setting.value;
        setSeasonStartDate(setting.value);
      }
      if (setting.key === 'absence_alert_weeks') {
        threshold = parseInt(setting.value) || 2;
        setWeeksThreshold(threshold);
      }
    });

    if (!startDate) {
      setLoading(false);
      return;
    }

    // Get students with servant info
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('*, servants(name)')
      .eq('is_active', true);

    if (studentsError) {
      console.error('Error fetching students:', studentsError);
      setLoading(false);
      return;
    }

    // Get cancelled class dates
    const { data: cancelledDates } = await supabase
      .from('class_cancellations')
      .select('cancellation_date');

    const cancelledDateSet = new Set(
      cancelledDates?.map(c => c.cancellation_date) || []
    );

    // Get attendance records after season start
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('was_present', true)
      .gte('attendance_date', startDate)
      .order('attendance_date', { ascending: false });

    if (attendanceError) {
      console.error('Error fetching attendance:', attendanceError);
      setLoading(false);
      return;
    }

    // Filter out cancelled dates
    const validAttendance = attendance?.filter(
      a => !cancelledDateSet.has(a.attendance_date)
    ) || [];

    const alertStudents: Alert[] = [];
    const today = new Date();
    const seasonStart = new Date(startDate + 'T00:00:00');

    students.forEach(student => {
      const lastPresent = validAttendance.find(a => a.student_id === student.id);
      
      let weeksAbsent = 0;
      let lastSeenDate: string | null = null;

      if (!lastPresent) {
        // Never been present since season start
        const diffTime = today.getTime() - seasonStart.getTime();
        weeksAbsent = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
      } else {
        lastSeenDate = lastPresent.attendance_date;
        const lastPresentDate = new Date(lastPresent.attendance_date + 'T00:00:00');
        const diffTime = today.getTime() - lastPresentDate.getTime();
        weeksAbsent = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
      }

      if (weeksAbsent >= threshold) {
        alertStudents.push({
          id: student.id,
          name: student.name,
          grade: student.grade,
          phone: student.phone || '',
          parent_phone: student.parent_phone || '',
          parent_name: student.parent_name || '',
          weeks_absent: weeksAbsent,
          last_seen: lastSeenDate,
          servant_name: student.servants?.name || null,
        });
      }
    });

    // Sort by most absent
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

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Absence Alerts</h1>
            <p className="text-gray-600">
              Students absent {weeksThreshold}+ weeks since {seasonStartDate ? new Date(seasonStartDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard/settings')}
            className="btn-secondary flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>

        {!seasonStartDate ? (
          <div className="card text-center py-12">
            <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No season start date configured</p>
            <button
              onClick={() => router.push('/dashboard/settings')}
              className="btn-primary"
            >
              Configure Settings
            </button>
          </div>
        ) : alerts.length === 0 ? (
          <div className="card text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No alerts at this time</p>
            <p className="text-sm text-gray-500 mt-2">All students have attended within the past {weeksThreshold} weeks!</p>
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
                      <p className="text-gray-600">
                        <strong>Last seen:</strong> {alert.last_seen ? new Date(alert.last_seen + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never (this season)'}
                      </p>
                      {alert.servant_name && (
                        <p className="text-gray-600">
                          <strong>Servant:</strong> {alert.servant_name}
                        </p>
                      )}
                      {alert.phone && (
                        <p className="text-gray-600 flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <a href={`sms:${alert.phone}`} className="text-primary-600 hover:text-primary-700">
                            {alert.phone}
                          </a>
                        </p>
                      )}
                      {alert.parent_phone && (
                        <p className="text-gray-600 flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <strong>Parent{alert.parent_name ? ` (${alert.parent_name})` : ''}:</strong>
                          <a href={`sms:${alert.parent_phone}`} className="text-primary-600 hover:text-primary-700">
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