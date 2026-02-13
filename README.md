# JomReport v2 - Community Reporting Platform

A robust, full-stack community issue reporting application built with modern web technologies. JomReport empowers communities to report local issues (like potholes, broken streetlights) and track their resolution in real-time.

## 🚀 Features

### Core Functionality

- **User Authentication**: Secure login via Google OAuth (Supabase Auth).
- **Report Submission**: Create detailed reports with photos, geolocation, and categories.
- **Interactive Feed**: Infinite scroll feed with real-time updates.
- **Engagement**: Users can **Like**, **Comment**, and **Follow** reports.
- **Gamification**: Earn points and badges ("First Report", "Helper", "Resolver") for active participation.

### 🔍 Discovery & Organization

- **Search & Filter**:
  - Real-time search by report title.
  - Filter by status: **Baru** (New), **Proses** (In Progress), **Selesai** (Done).
- **Status Tracking**: Visual indicators for report progress.

### 🛡️ Admin & Moderation

- **Admin Dashboard**: Dedicated panel for administrators to manage content.
- **Report Management**:
  - **Status Updates**: Change status to Open, In Progress, Closed, or Duplicate.
  - **Moderation**: **Hide** inappropriate reports or **Lock** comments on heated threads.
- **User Management**: **Ban** users who violate community guidelines (auto-hides their content).
- **Anti-Spam**: Users can **Flag** abusive reports for admin review.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Server Actions)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Shadcn/UI](https://ui.shadcn.com/)
- **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, Realtime, Storage, Edge Functions)
- **Deployment**: [Vercel](https://vercel.com/)

## 🏁 Getting Started

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd jomreportv2
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Database Setup (Supabase)

You need to run the SQL migration scripts in the **Supabase SQL Editor** in the following order to set up the schema, triggers, and policies:

1.  **Initial Schema**: `supabase/migrations/20240101000000_init_schema.sql` (Tables: profiles, reports, comments, etc.)
2.  **Storage Setup**: `supabase/storage_setup.sql` (Creates 'reports' bucket)
3.  **Admin & Role Setup**: `supabase/admin_setup.sql` (Adds roles, RLS policies for admins)
4.  **Fix Badges Trigger**: `supabase/fix_badges_trigger_v3.sql` (Fixes array syntax for gamification)
5.  **Ban System**: `supabase/fix_ban_system.sql` (Logic for banning users and hiding content)
6.  **Flags & Duplicates**: `supabase/update_v2.sql` (Adds flagging system and 'duplicate' status)

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## 👮 Admin Access Setup

Admins are managed via the `profiles` table in the database, **not** via Auth metadata.

1.  Sign up/Log in to the app with the account you want to make an admin.
2.  Go to your Supabase **Table Editor** -> `public.profiles`.
3.  Find the user's row.
4.  Change the `role` column from `user` to `admin`.
5.  Refresh the app. You can now access `/admin`.

## 📦 Deployment

1.  Push your code to a GitHub repository.
2.  Import the project into **Vercel**.
3.  Add the `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` environment variables in Vercel.
4.  Deploy!

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
