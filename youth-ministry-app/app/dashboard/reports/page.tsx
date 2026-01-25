'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Calendar, Copy, Check } from 'lucide-react'

export default function ReportsPage() {
  const router = useRouter()
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [serviceType, setServiceType] = useState<'friday' | 'sunday'>('friday')
  const [report, setReport] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const generateReport = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select(`
          *,
          students (name)
        `)
        .eq('date', date)
        .eq('service_type', serviceType)
        .eq('present', true)
        .order('students(name)')

      if (error) throw error

      if (!data || data.length === 0) {
        setReport('No attendance recorded for this date.')
        return
      }

      const presentStudents = data.map((record: any) => record.students.name)
      const serviceName = serviceType === 'friday' ? 'Friday' : 'Sunday'
      const formattedDate = new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })

      const message = `📋 Youth Ministry Attendance - ${serviceName}
${formattedDate}

✅ Present (${presentStudents.length}):
${presentStudents.map(name => `• ${name}`).join('\n')}

God bless! 🙏`

      setReport(message)
    } catch (error: any) {
      alert('Error generating report: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(report)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Reports</h1>
              <p className="text-sm text-gray-600">Generate parent group messages</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Date & Service</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service
              </label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value as 'friday' | 'sunday')}
                className="input-field"
              >
                <option value="friday">Friday</option>
                <option value="sunday">Sunday</option>
              </select>
            </div>
          </div>
          <button
            onClick={generateReport}
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
        </div>

        {report && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Parent Message</h2>
              <button
                onClick={copyToClipboard}
                className="btn-secondary flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800">
                {report}
              </pre>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              Copy this message and paste it into your parent WhatsApp group chat
            </p>
          </div>
        )}
      </main>
    </div>
  )
}