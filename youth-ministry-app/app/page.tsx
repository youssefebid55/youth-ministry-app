'use client'

import { useRouter } from 'next/navigation'
import { Users, ClipboardCheck, Bell, BarChart3 } from 'lucide-react'

export default function Home() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Users className="w-16 h-16 text-primary-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Youth Ministry
          </h1>
          <p className="text-gray-600">
            Attendance Tracking System
          </p>
        </div>

        <div className="card space-y-4">
          <button
            onClick={() => router.push('/login')}
            className="btn-primary w-full py-3 text-lg"
          >
            Sign In
          </button>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div className="text-center">
              <ClipboardCheck className="w-8 h-