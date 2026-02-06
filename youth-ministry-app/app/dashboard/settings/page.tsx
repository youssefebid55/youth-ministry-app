'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Save } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [weeksThreshold, setWeeksThreshold] = useState('2');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('key', 'absence_alert_weeks')
      .single();

    if (!error && data) {
      setWeeksThreshold(data.value);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);

    const { error } = await supabase
      .from('settings')
      .upsert({
        key: 'absence_alert_weeks',
        value: weeksThreshold,
      }, {
        onConflict: 'key'
      });

    if (error) {
      console.error('Error saving settings:', error);
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

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alert Threshold (Weeks Absent)
              </label>
              <p className="text-sm text-gray-600 mb-3">
                Servants will receive alerts when their assigned students have been absent for this many weeks.
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

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>How it works:</strong> When a student hasn't attended for {weeksThreshold} {parseInt(weeksThreshold) === 1 ? 'week' : 'weeks'}, 
                their responsible servant will receive a text message with the student's name and parent contact information.
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