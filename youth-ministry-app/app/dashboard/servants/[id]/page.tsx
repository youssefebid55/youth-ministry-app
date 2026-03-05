'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Phone, Users } from 'lucide-react';

interface Servant {
  id: string;
  name: string;
  phone: string;
}

interface Student {
  id: string;
  name: string;
  phone: string;
  parent_phone: string;
  last_seen: string | null;
}

export default function ServantDetailPage() {
  const router = useRouter();
  const params = useParams();
  const servantId = params.id as string;

  const [servant, setServant] = useState<Servant | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServant();
  }, []);

  const fetchServant = async () => {
    // Get servant
    const { data: servantData, error: servantError } = await supabase
      .from('servants')
      .select('id, name, phone')
      .eq('id', servantId)
      .single();

    if (servantError) {
      console.error('Error fetching servant:', servantError);
      setLoading(false);
      return;
    }

    setServant(servantData);

    // Get assigned students
    const { data: studentsData, error: studentsError } = await supabase
      .from('students')
      .select('id, name, phone, parent_phone')
      .eq('servant_id', servantId)
      .eq('is_active', true)
      .order('name');

    if (studentsError) {
      console.error('Error fetching students:', studentsError);
      setLoading(false);
      return;
    }

    // Get last seen for each student
    const { data: attendance } = await supabase
      .from('attendance_records')
      .select('student_id, attendance_date')
      .eq('was_present', true)
      .order('attendance_date', { ascending: false });

    const studentsWithLastSeen = studentsData.map(student => {
      const lastAttendance = attendance?.find(a => a.student_id === student.id);
      return {
        ...student,
        last_seen: lastAttendance?.attendance_date || null,
      };
    });

    setStudents(studentsWithLastSeen);
    setLoading(false);
  };

  const formatLastSeen = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString + 'T00:00:00');
    const today = new Date();
    const diffTime = today.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

  if (!servant) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <p>Servant not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.push('/dashboard/servants')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Servants
        </button>

        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <Users className="w-6 h-6 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              {servant.name}'s Students ({students.length})
            </h1>
          </div>

          {students.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No students assigned</p>
            </div>
          ) : (
            <div className="space-y-3">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{student.name}</p>
                    <p className="text-sm text-gray-500">
                      Last seen: <span className={student.last_seen ? '' : 'text-red-600'}>{formatLastSeen(student.last_seen)}</span>
                    </p>
                  </div>
                  <div className="flex gap-3">
                    {student.phone && (
                      <a 
                        href={`sms:${student.phone}`} 
                        className="flex items-center gap-1 text-primary-600 text-sm"
                      >
                        <Phone className="w-4 h-4" />
                        {student.phone}
                      </a>
                    )}
                    {student.parent_phone && !student.phone && (
                      <a 
                        href={`sms:${student.parent_phone}`} 
                        className="flex items-center gap-1 text-primary-600 text-sm"
                      >
                        <Phone className="w-4 h-4" />
                        {student.parent_phone}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}