'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Save, Calendar, Bell } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [seasonStartDate, setSeasonStartDate] = useState('');
  const [weeksThreshold, setWeeksThreshold] = useState('2');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from('settings')
      .select('*');

    if (!error && data) {
      data.forEach(setting => {
        if (setting.key === 'season_start_date') {
          setSeasonStartDate(setting.value);
        }
        if (setting.key === 'absence_alert_weeks') {
          setWeeksThreshold(setting.value);
        }
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);

    // Save season start date
    const { error: error1 } = await supabase
      .from('settings')
      .upsert({
        key: 'season_start_date',
        value: seasonStartDate,
      }, {
        onConflict: 'key'
      });

    // Save weeks threshold
    const { error: error2 } = await supabase
      .from('settings')
      .upsert({
        key: 'absence_alert_weeks',
        value: weeksThreshold,
      }, {
        onConflict: 'key'
      });

    if (error1 || error2) {
      console.error('Error saving settings:', error1 || error2);
      alert('Error saving settings');
    } else {
      alert('Settings saved successfully!');
    }
    setSaving(false);
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
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Alert Settings</h1>

          <div className="space-y-8">
            {/* Season Start Date */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-primary-600" />
                <label className="block text-sm font-medium text-gray-700">
                  Season Start Date
                </label>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Only count absences starting from this date. Attendance before this date will be ignored for alerts.
              </p>
              <input
                type="date"
                value={seasonStartDate}
                onChange={(e) => setSeasonStartDate(e.target.value)}
                className="input-field w-full max-w-xs"
              />
              {seasonStartDate && (
                <p className="text-sm text-green-600 mt-2">
                  Counting absences from: {new Date(seasonStartDate + 'T00:00:00').toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              )}
            </div>

            {/* Weeks Threshold */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Bell className="w-5 h-5 text-primary-600" />
                <label className="block text-sm font-medium text-gray-700">
                  Alert Threshold (Weeks Absent)
                </label>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Show alerts for students who haven't attended for this many weeks.
              </p>
              <select
                value={weeksThreshold}
                onChange={(e) => setWeeksThreshold(e.target.value)}
                className="input-field w-full max-w-xs"
              >
                <option value="1">1 week</option>
                <option value="2">2 weeks</option>
                <option value="3">3 weeks</option>
                <option value="4">4 weeks</option>
                <option value="5">5 weeks</option>
                <option value="6">6 weeks</option>
              </select>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>How it works:</strong> The system will check attendance records starting from {seasonStartDate ? new Date(seasonStartDate + 'T00:00:00').toLocaleDateString() : '(set a start date)'}.
                If a student hasn't attended for {weeksThreshold} {parseInt(weeksThreshold) === 1 ? 'week' : 'weeks'}, they'll appear in the alerts list and their assigned servant will be notified.
              </p>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}