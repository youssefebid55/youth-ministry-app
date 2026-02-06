'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Trash2 } from 'lucide-react';

export default function EditStudentPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    grade: '9',
    address: '',
    date_of_birth: '',
    parent_name: '',
    parent_phone: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStudent();
  }, []);

  const fetchStudent = async () => {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();

    if (error) {
      console.error('Error fetching student:', error);
      setError('Student not found');
      setLoading(false);
      return;
    }

    setFormData({
      name: data.name || '',
      phone: data.phone || '',
      grade: data.grade?.toString() || '9',
      address: data.address || '',
      date_of_birth: data.date_of_birth || '',
      parent_name: data.parent_name || '',
      parent_phone: data.parent_phone || '',
    });
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const { error } = await supabase
      .from('students')
      .update({
        name: formData.name,
        phone: formData.phone || null,
        grade: parseInt(formData.grade),
        address: formData.address || null,
        date_of_birth: formData.date_of_birth || null,
        parent_name: formData.parent_name || null,
        parent_phone: formData.parent_phone,
      })
      .eq('id', studentId);

    if (error) {
      setError(error.message);
      setSaving(false);
    } else {
      router.push('/dashboard/students');
    }
  };

  const handleDelete = async () => {
    const confirmDelete = confirm(
      `Are you sure you want to delete ${formData.name}? This cannot be undone.`
    );

    if (!confirmDelete) return;

    const { error } = await supabase
      .from('students')
      .update({ is_active: false })
      .eq('id', studentId);

    if (error) {
      alert('Error deleting student');
    } else {
      router.push('/dashboard/students');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.push('/dashboard/students')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Students
        </button>

        <div className="card">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Student</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Student Information */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Student Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field w-full"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="input-field w-full"
                      placeholder="+1234567890"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Grade *
                    </label>
                    <select
                      required
                      value={formData.grade}
                      onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                      className="input-field w-full"
                    >
                      <option value="9">9th Grade</option>
                      <option value="10">10th Grade</option>
                      <option value="11">11th Grade</option>
                      <option value="12">12th Grade</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Birthday
                  </label>
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="input-field w-full"
                    placeholder="123 Main St, City, State"
                  />
                </div>
              </div>
            </div>

            {/* Parent Information */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Parent Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parent Name
                  </label>
                  <input
                    type="text"
                    value={formData.parent_name}
                    onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                    className="input-field w-full"
                    placeholder="Parent's full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parent Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.parent_phone}
                    onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                    className="input-field w-full"
                    placeholder="+1234567890"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleDelete}
                className="btn-secondary flex items-center gap-2 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                Delete Student
              </button>
              <div className="flex-1"></div>
              <button
                type="button"
                onClick={() => router.push('/dashboard/students')}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}