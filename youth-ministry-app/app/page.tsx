'use client';

import { useRouter } from 'next/navigation';
import { Church, Clock, Bell, FileText } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Church className="w-16 h-16 text-primary-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Youth Ministry Attendance
          </h1>
          <p className="text-gray-600">
            Archangel Michael & St. Mena Coptic Orthodox Church
          </p>
        </div>

        <div className="card">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Features
            </h2>
            
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-primary-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-gray-900">Quick Attendance</h3>
                <p className="text-sm text-gray-600">
                  Mark attendance in seconds for Friday and Sunday services
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Bell className="w-5 h-5 text-primary-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-gray-900">Auto Alerts</h3>
                <p className="text-sm text-gray-600">
                  Get notified when students are absent multiple weeks
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-primary-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-gray-900">Easy Reports</h3>
                <p className="text-sm text-gray-600">
                  Generate formatted messages for parent group chats
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => router.push('/dashboard')}
            className="btn-primary w-full mt-6"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}