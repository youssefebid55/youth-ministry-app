'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Search, UserPlus, Phone, Mail, ArrowLeft, Users } from 'lucide-react';

interface Servant {
  id: string;
  name: string;
  phone: string;
  email: string;
  is_admin: boolean;
  student_count?: number;
}

export default function ServantsPage() {
  const router = useRouter();
  const [servants, setServants] = useState<Servant[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServants();
  }, []);

  const fetchServants = async () => {
    const { data: servantsData, error: servantsError } = await supabase
      .from('servants')
      .select('*')
      .order('name');

    if (servantsError) {
      console.error('Error fetching servants:', servantsError);
      setLoading(false);
      return;
    }

    // Get student counts for each servant
    const { data: assignments, error: assignmentsError } = await supabase
      .from('servant_assignments')
      .select('servant_id');

    if (!assignmentsError && assignments) {
      const counts = assignments.reduce((acc: Record<string, number>, assignment) => {
        acc[assignment.servant_id] = (acc[assignment.servant_id] || 0) + 1;
        return acc;
      }, {});

      const servantsWithCounts = servantsData.map(servant => ({
        ...servant,
        student_count: counts[servant.id] || 0
      }));

      setServants(servantsWithCounts);
    } else {
      setServants(servantsData);
    }

    setLoading(false);
  };

  const filteredServants = servants.filter(servant => 
    servant.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <p>Loading servants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>

          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Servants</h1>
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/dashboard/servants/assign')}
                className="btn-secondary flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Assign Students
              </button>
              <button
                onClick={() => router.push('/dashboard/servants/add')}
                className="btn-primary flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Add Servant
              </button>
            </div>
          </div>

          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search servants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 w-full"
              style={{ 
                color: '#111827',
                WebkitTextFillColor: '#111827'
              }}
            />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServants.map((servant) => (
            <div key={servant.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{servant.name}</h3>
                  {servant.is_admin && (
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      Admin
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span className="font-medium">{servant.student_count || 0}</span>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <a href={`sms:${servant.phone}`} className="text-primary-600">{servant.phone}</a>
                </div>
                {servant.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span className="text-xs">{servant.email}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredServants.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">No servants found</p>
          </div>
        )}
      </main>
    </div>
  );
}