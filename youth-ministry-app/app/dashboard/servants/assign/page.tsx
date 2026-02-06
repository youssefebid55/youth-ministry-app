'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Save } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  grade: number;
}

interface Servant {
  id: string;
  name: string;
}

interface Assignment {
  student_id: string;
  servant_id: string | null;
}

export default function AssignStudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [servants, setServants] = useState<Servant[]>([]);
  const [assignments, setAssignments] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Fetch students
    const { data: studentsData, error: studentsError } = await supabase
      .from('students')
      .select('id, name, grade')
      .eq('is_active', true)
      .order('name');

    if (studentsError) {
      console.error('Error fetching students:', studentsError);
      setLoading(false);
      return;
    }

    // Fetch servants
    const { data: servantsData, error: servantsError } = await supabase
      .from('servants')
      .select('id, name')
      .order('name');

    if (servantsError) {
      console.error('Error fetching servants:', servantsError);
      setLoading(false);
      return;
    }

    // Fetch existing assignments
    const { data: assignmentsData, error: assignmentsError } = await supabase
      .from('servant_assignments')
      .select('student_id, servant_id');

    if (!assignmentsError && assignmentsData) {
      const assignmentsMap: Record<string, string | null> = {};
      assignmentsData.forEach(assignment => {
        assignmentsMap[assignment.student_id] = assignment.servant_id;
      });

      // Initialize all students (including those without assignments)
      studentsData.forEach(student => {
        if (!(student.id in assignmentsMap)) {
          assignmentsMap[student.id] = null;
        }
      });

      setAssignments(assignmentsMap);
    } else {
      // Initialize empty assignments
      const assignmentsMap: Record<string, string | null> = {};
      studentsData.forEach(student => {
        assignmentsMap[student.id] = null;
      });
      setAssignments(assignmentsMap);
    }

    setStudents(studentsData);
    setServants(servantsData);
    setLoading(false);
  };

  const handleAssignmentChange = (studentId: string, servantId: string) => {
    setAssignments(prev => ({
      ...prev,
      [studentId]: servantId === '' ? null : servantId
    }));
  };

  const handleSave = async () => {
    setSaving(true);

    // Delete all existing assignments
    await supabase
      .from('servant_assignments')
      .delete()
      .neq('student_id', '00000000-0000-0000-0000-000000000000'); // Delete all

    // Insert new assignments
    const assignmentsToInsert = Object.entries(assignments)
      .filter(([_, servantId]) => servantId !== null)
      .map(([studentId, servantId]) => ({
        student_id: studentId,
        servant_id: servantId
      }));

    if (assignmentsToInsert.length > 0) {
      const { error } = await supabase
        .from('servant_assignments')
        .insert(assignmentsToInsert);

      if (error) {
        console.error('Error saving assignments:', error);
        alert('Error saving assignments');
        setSaving(false);
        return;
      }
    }

    alert('Assignments saved successfully!');
    setSaving(false);
    router.push('/dashboard/servants');
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
          onClick={() => router.push('/dashboard/servants')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Servants
        </button>

        <div className="card mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Assign Students to Servants</h1>
          <p className="text-gray-600 mb-6">
            Each student should have a responsible servant who will receive alerts when they're absent.
          </p>

          {servants.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-yellow-800">
                No servants found. Please add servants before assigning students.
              </p>
            </div>
          )}

          <div className="space-y-3 mb-6">
            {students.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{student.name}</p>
                  <p className="text-sm text-gray-600">Grade {student.grade}</p>
                </div>

                <select
                  value={assignments[student.id] || ''}
                  onChange={(e) => handleAssignmentChange(student.id, e.target.value)}
                  className="input-field w-64"
                  disabled={servants.length === 0}
                >
                  <option value="">No servant assigned</option>
                  {servants.map(servant => (
                    <option key={servant.id} value={servant.id}>
                      {servant.name}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {students.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600">No students found</p>
            </div>
          )}

          {students.length > 0 && servants.length > 0 && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Assignments'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}