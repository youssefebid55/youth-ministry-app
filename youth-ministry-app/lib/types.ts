export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      students: {
        Row: {
          id: string
          name: string
          phone: string | null
          address: string | null
          grade: number
          photo_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          phone?: string | null
          address?: string | null
          grade: number
          photo_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string | null
          address?: string | null
          grade?: number
          photo_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      servants: {
        Row: {
          id: string
          name: string
          phone: string
          is_admin: boolean
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          phone: string
          is_admin?: boolean
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string
          is_admin?: boolean
          is_active?: boolean
          created_at?: string
        }
      }
      servant_assignments: {
        Row: {
          id: string
          student_id: string
          servant_id: string
          assigned_at: string
        }
        Insert: {
          id?: string
          student_id: string
          servant_id: string
          assigned_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          servant_id?: string
          assigned_at?: string
        }
      }
      attendance_records: {
        Row: {
          id: string
          student_id: string
          attendance_date: string
          was_present: boolean
          marked_by_servant_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          attendance_date: string
          was_present: boolean
          marked_by_servant_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          attendance_date?: string
          was_present?: boolean
          marked_by_servant_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      absence_alerts: {
        Row: {
          id: string
          student_id: string
          servant_id: string
          sent_at: string
          weeks_absent: number
          followed_up: boolean
          followed_up_at: string | null
          followed_up_by_servant_id: string | null
        }
        Insert: {
          id?: string
          student_id: string
          servant_id: string
          sent_at?: string
          weeks_absent: number
          followed_up?: boolean
          followed_up_at?: string | null
          followed_up_by_servant_id?: string | null
        }
        Update: {
          id?: string
          student_id?: string
          servant_id?: string
          sent_at?: string
          weeks_absent?: number
          followed_up?: boolean
          followed_up_at?: string | null
          followed_up_by_servant_id?: string | null
        }
      }
      class_cancellations: {
        Row: {
          id: string
          cancellation_date: string
          reason: string | null
          marked_by_servant_id: string
          created_at: string
        }
        Insert: {
          id?: string
          cancellation_date: string
          reason?: string | null
          marked_by_servant_id: string
          created_at?: string
        }
        Update: {
          id?: string
          cancellation_date?: string
          reason?: string | null
          marked_by_servant_id?: string
          created_at?: string
        }
      }
      settings: {
        Row: {
          id: string
          key: string
          value: string
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value: string
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
