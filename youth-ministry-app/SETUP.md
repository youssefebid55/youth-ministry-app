# Quick Setup Guide

## What You Have

✅ Supabase project created with database tables  
✅ Twilio configured in Supabase (waiting for A2P approval)  
✅ Complete Next.js app ready to run  

## Next Steps

### 1. Get Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Click **Project Settings** (gear icon, bottom left)
3. Click **API** in the left menu
4. Copy these two values:
   - **Project URL** (looks like: https://xxxxx.supabase.co)
   - **anon public key** (long string starting with eyJ...)

### 2. Create Environment File

1. In this project folder, create a file called `.env.local`
2. Paste this and fill in your values:

\`\`\`
NEXT_PUBLIC_SUPABASE_URL=your-project-url-here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
\`\`\`

Save the file.

### 3. Run the App

Open terminal in this folder and run:

\`\`\`bash
npm run dev
\`\`\`

Open your browser to: **http://localhost:3000**

### 4. Add Your First Data

Once the app is running, you need to add yourself as a servant and some students.

Go to Supabase → SQL Editor and run:

\`\`\`sql
-- Add yourself as admin servant
INSERT INTO servants (name, phone, is_admin)
VALUES ('Giuseppe', '+1-your-phone-number', true);

-- Add a test student
INSERT INTO students (name, grade, phone)
VALUES ('Test Student', 10, '+1-555-1234');
\`\`\`

### 5. Test It Out

Now you can:
- ✅ Take attendance (Attendance tab)
- ✅ Add students (Students → Add New Student)
- ✅ View history (Attendance → Calendar icon)
- ✅ Generate parent messages

## What Still Needs Work

### Later Today/Tomorrow:
- **SMS Authentication**: Waiting for Twilio A2P approval (few days)
  - Currently using placeholder servant ID
  - Will wire up real auth once Twilio is ready

### Admin Features (Can Add Later):
- Manage servants (add/remove)
- Assign students to servants
- Settings (change absence threshold)
- Bulk grade advancement

### Optional Enhancements:
- Photo uploads for students
- Google Sheets backup automation
- Daily absence check cron job

## Current Limitations

- **No real authentication yet**: Everyone sees everything (fine for testing)
- **Servant ID is hardcoded**: Will fix when SMS auth is ready
- **No admin panel yet**: Can add after testing core features

## If Something Doesn't Work

### Real-time sync not working?
- Check Supabase project isn't paused (Settings → General)
- Restart the dev server (Ctrl+C, then `npm run dev` again)

### Students not showing up?
- Make sure you added data in Supabase SQL Editor
- Check browser console (F12) for errors

### Page won't load?
- Verify .env.local file exists with correct credentials
- Check terminal for error messages

## Deployment (When Ready)

1. Push to GitHub
2. Connect to Vercel (vercel.com)
3. Add environment variables in Vercel
4. Deploy!

## Questions?

The README.md has full documentation.

**You're ready to test!** Start with taking attendance and adding students. 🚀
