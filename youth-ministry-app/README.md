# Youth Ministry Attendance App

A mobile-first web application for tracking high school youth ministry attendance with automated SMS follow-ups.

## Features

✅ **Take Attendance**
- Real-time collaborative attendance taking
- Quick add students on the fly
- Search and sort by name or grade
- "No class today" option
- Easy undo functionality

✅ **Student Management**
- Add, edit student information
- Store contact details (phone, address)
- Track grade levels
- Photo support (coming soon)

✅ **Attendance History**
- View past attendance records
- Generate formatted parent messages
- One-click copy to clipboard for WhatsApp

✅ **Absence Alerts**
- Automatic SMS notifications to servants
- Configurable absence threshold
- Mark follow-ups as complete
- Track notification history

✅ **Dashboard**
- Attendance trends and statistics
- Quick overview of pending alerts
- Mobile-optimized interface

✅ **Role-Based Access**
- Servants can view all students for attendance
- Only see contact info for assigned students
- Admins have full access

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Real-time)
- **Auth**: Supabase SMS Authentication (via Twilio)
- **SMS**: Twilio API
- **Hosting**: Vercel (Frontend), Supabase (Backend)

## Prerequisites

- Node.js 18+ installed
- Supabase account (free tier works)
- Twilio account for SMS (optional for development)

## Setup Instructions

### 1. Clone and Install

\`\`\`bash
# Install dependencies
npm install
\`\`\`

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the database schema:
   - Copy the entire SQL script from your Supabase setup
   - Paste and execute in SQL Editor
3. Get your credentials:
   - Project Settings → API
   - Copy Project URL and anon/public key

### 3. Configure Environment Variables

Create a \`.env.local\` file:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
\`\`\`

### 4. Run Development Server

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000)

### 5. Set Up Twilio (for Production)

1. Create account at [twilio.com](https://www.twilio.com)
2. Get a toll-free phone number (recommended) or register for A2P 10DLC
3. Create a Messaging Service
4. Copy credentials:
   - Account SID
   - Auth Token
   - Messaging Service SID
5. Add to Supabase:
   - Project Settings → Authentication → Providers
   - Enable Phone provider
   - Paste Twilio credentials

### 6. Initial Data Setup

**Add Your First Servant (Admin):**

\`\`\`sql
INSERT INTO servants (name, phone, is_admin)
VALUES ('Your Name', '+15551234567', true);
\`\`\`

**Add Some Students:**

\`\`\`sql
INSERT INTO students (name, grade, phone, address)
VALUES 
  ('John Smith', 10, '+15559876543', '123 Main St'),
  ('Jane Doe', 11, '+15559876544', '456 Oak Ave');
\`\`\`

## Project Structure

\`\`\`
youth-ministry-app/
├── app/
│   ├── attendance/          # Take attendance & history
│   ├── students/            # Student management
│   ├── my-kids/             # Servant's assigned students
│   ├── alerts/              # Absence notifications
│   ├── dashboard/           # Stats & overview
│   └── admin/               # Admin functions (TODO)
├── components/
│   └── Navigation.tsx       # Bottom nav bar
├── lib/
│   ├── supabase.ts          # Supabase client
│   └── types.ts             # TypeScript types
└── public/                  # Static assets
\`\`\`

## Usage Guide

### Taking Attendance

1. Go to "Attendance" tab
2. Select the date (defaults to today)
3. Tap students who are present
4. Changes sync in real-time across devices
5. Use "Quick Add" for visitors

### Generating Parent Messages

1. Go to "Attendance" → tap calendar icon (top right)
2. Select the date you want
3. Review the formatted message
4. Tap "Copy Message"
5. Paste into WhatsApp parents group

### Managing Students

1. Go to "Students" tab
2. Tap "Add New Student" to add
3. Tap any student to edit details
4. Use search to find students quickly

### Following Up on Absences

1. Go to "Alerts" tab
2. View pending follow-ups
3. Call students directly from the app
4. Mark as "Followed Up" when complete

## Deployment

### Deploy to Vercel

\`\`\`bash
npm install -g vercel
vercel deploy
\`\`\`

Add environment variables in Vercel dashboard.

## Features Coming Soon

- [ ] SMS Authentication (waiting for Twilio A2P approval)
- [ ] Photo uploads for students
- [ ] Admin panel (manage servants, assignments, settings)
- [ ] Google Sheets weekly backup
- [ ] Automated daily absence checks
- [ ] Bulk grade advancement
- [ ] Export attendance reports
- [ ] Junior High School support

## Security Notes

- Row-Level Security (RLS) enabled on all tables
- Only authenticated servants can access data
- Servants only see contact info for assigned students
- All API requests authenticated via Supabase

## Troubleshooting

**Real-time sync not working?**
- Check Supabase project isn't paused (free tier pauses after 7 days inactivity)
- Verify API keys are correct in .env.local

**SMS not sending?**
- Ensure Twilio A2P registration is complete
- Check Twilio credentials in Supabase
- Verify phone numbers are in E.164 format (+15551234567)

**Students not loading?**
- Check browser console for errors
- Verify Supabase RLS policies are set correctly
- Ensure database has seed data

## Cost Breakdown

- **Supabase**: Free tier (plenty for 20 servants, 100 students)
- **Twilio SMS**: ~$2-5/month (220 messages)
- **Vercel Hosting**: Free tier
- **Total**: $2-5/month

## Support

For issues or questions:
1. Check the Troubleshooting section
2. Review Supabase logs (Project Settings → Logs)
3. Check browser console for errors

## License

Built for Archangel Michael & St. Mena Coptic Orthodox Church
