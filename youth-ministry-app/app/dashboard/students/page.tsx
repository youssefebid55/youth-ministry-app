'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Search, UserPlus, Phone, Mail } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  phone: string;
  email: string;
  parent_phone: string;
  grade: number;
}

export default function StudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    fetchStudents();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
    }
  };

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching students:', error);
    } else {
      setStudents(data || []);
    }
    setLoading(false);
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <p>Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Students</h1>
            <button
              onClick={() => router.push('/dashboard/students/add')}
              className="btn-primary flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Add Student
            </button>
          </div>
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 w-full"
            />
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((student) => (
            <div key={student.id} className="card">
              <h3 className="font-semibold text-lg mb-1">{student.name}</h3>
              <p className="text-sm text-gray-600 mb-3">Grade {student.grade}</p>
              <div className="space-y-2 text-sm">
                {student.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <a href={`tel:${student.phone}`} className="text-primary-600">{student.phone}</a>
                  </div>
                )}
                {student.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <a href={`mailto:${student.email}`} className="text-primary-600">{student.email}</a>
                  </div>
                )}
                {student.parent_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>Parent: {student.parent_phone}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        {filteredStudents.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">No students found</p>
          </div>
        )}
      </main>
    </div>
  );
}