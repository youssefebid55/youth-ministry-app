'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Phone, Users, CheckCircle } from 'lucide-react';

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
  last_contacted: string | null;
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

    // Get last contacted for each student
    const { data: contacts } = await supabase
      .from('student_contacts')
      .select('student_id, contact_date')
      .eq('servant_id', servantId)
      .order('contact_date', { ascending: false });

    const studentsWithData = studentsData.map(student => {
      const lastAttendance = attendance?.find(a => a.student_id === student.id);
      const lastContact = contacts?.find(c => c.student_id === student.id);
      return {
        ...student,
        last_seen: lastAttendance?.attendance_date || null,
        last_contacted: lastContact?.contact_date || null,
      };
    });

    setStudents(studentsWithData);
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

  const logContact = async (studentId: string) => {
    const { error } = await supabase
      .from('student_contacts')
      .insert({
        student_id: studentId,
        servant_id: servantId,
        contact_date: new Date().toISOString().split('T')[0],
      });

    if (!error) {
      // Update local state
      setStudents(prev => prev.map(s => 
        s.id === studentId 
          ? { ...s, last_contacted: new Date().toISOString().split('T')[0] }
          : s
      ));
    }
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
                  className="p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-medium text-gray-900 text-lg">{student.name}</p>
                      <div className="text-sm text-gray-600 mt-1 space-y-1">
                        <p>Last seen: <span className={student.last_seen ? '' : 'text-red-600'}>{formatLastSeen(student.last_seen)}</span></p>
                        <p>Last contacted: <span className={student.last_contacted ? 'text-green-600' : 'text-gray-400'}>{formatLastSeen(student.last_contacted)}</span></p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {(student.phone || student.parent_phone) && (
                        <a 
                          href={`sms:${student.phone || student.parent_phone}`} 
                          className="btn-primary flex items-center gap-2 text-sm"
                        >
                          <Phone className="w-4 h-4" />
                          Text
                        </a>
                      )}
                      <button
                        onClick={() => logContact(student.id)}
                        className="btn-secondary flex items-center gap-2 text-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Reached Out
                      </button>
                    </div>
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