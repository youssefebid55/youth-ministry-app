'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/types'
import { AlertCircle, Check, Calendar } from 'lucide-react'
import { format } from 'date-fns'

type Alert = Database['public']['Tables']['absence_alerts']['Row'] & {
  student: {
    name: string
    phone: string | null
    grade: number
  }
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [filter, setFilter] = useState<'pending' | 'all'>('pending')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAlerts()
  }, [filter])

  async function loadAlerts() {
    setLoading(true)
    
    // TODO: Replace with actual servant ID from auth
    const servantId = 'temp-servant-id'

    let query = supabase
      .from('absence_alerts')
      .select(`
        *,
        student:students (
          name,
          phone,
          grade
        )
      `)
      .eq('servant_id', servantId)
      .order('sent_at', { ascending: false })

    if (filter === 'pending') {
      query = query.eq('followed_up', false)
    }

    const { data, error } = await query

    if (data && !error) {
      setAlerts(data as any)
    }

    setLoading(false)
  }

  async function markAsFollowedUp(alertId: string) {
    const { error } = await supabase
      .from('absence_alerts')
      .update({
        followed_up: true,
        followed_up_at: new Date().toISOString(),
        followed_up_by_servant_id: 'temp-servant-id', // TODO: Replace with actual servant ID
      })
      .eq('id', alertId)

    if (!error) {
      loadAlerts()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading alerts...</p>
        </div>
      </div>
    )
  }

  const pendingCount = alerts.filter((a) => !a.followed_up).length

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Absence Alerts
        </h1>
        <p className="text-gray-600">
          {pendingCount} pending follow-ups
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter('pending')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            filter === 'pending'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300'
          }`}
        >
          Pending ({pendingCount})
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300'
          }`}
        >
          All Alerts
        </button>
      </div>

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {filter === 'pending' ? 'No pending alerts' : 'No alerts yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`bg-white rounded-xl shadow-sm border-2 p-5 ${
                alert.followed_up
                  ? 'border-gray-200'
                  : 'border-amber-200 bg-amber-50/30'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  {!alert.followed_up && (
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">
                      {alert.student.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Grade {alert.student.grade}
                    </p>
                  </div>
                </div>
                {alert.followed_up && (
                  <div className="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-full">
                    <Check className="w-4 h-4" />
                    <span className="text-xs font-medium">Followed Up</span>
                  </div>
                )}
              </div>

              <div className="bg-white/50 rounded-lg p-3 mb-3">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">
                    Absent for {alert.weeks_absent} {alert.weeks_absent === 1 ? 'week' : 'weeks'}
                  </span>
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                  <Calendar className="w-3 h-3" />
                  <span>
                    Alert sent {format(new Date(alert.sent_at), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>

              {alert.student.phone && (
                <a
                  href={`tel:${alert.student.phone}`}
                  className="block w-full py-2 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-center font-medium mb-2"
                >
                  Call {alert.student.name}
                </a>
              )}

              {!alert.followed_up && (
                <button
                  onClick={() => markAsFollowedUp(alert.id)}
                  className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Mark as Followed Up
                </button>
              )}

              {alert.followed_up && alert.followed_up_at && (
                <p className="text-xs text-gray-500 text-center mt-2">
                  Followed up on {format(new Date(alert.followed_up_at), 'MMM d, yyyy')}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
