export interface Student {
  id: string
  name: string
  phone: string
  email?: string
  parent_phone: string
  parent_email?: string
  address?: string
  grade?: string
  photo_url?: string
  assigned_servant_id?: string
  created_at: string
  updated_at: string
}

export interface Servant {
  id: string
  name: string
  phone: string
  email: string
  is_admin: boolean
  created_at: string
  updated_at: string
}

export interface AttendanceRecord {
  id: string
  student_id: string
  date: string
  service_type: 'friday' | 'sunday'
  present: boolean
  notes?: string
  marked_by: string
  created_at: string
}

export interface Alert {
  id: string
  student_id: string
  servant_id: string
  type: 'absence'
  message: string
  weeks_absent: number
  sent_at?: string
  acknowledged_at?: string
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      students: {
        Row: Student;
      };
      servants: {
        Row: Servant;
      };
      attendance_records: {
        Row: AttendanceRecord;
      };
      alerts: {
        Row: Alert;
      };
    };
  };
}