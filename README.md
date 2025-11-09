
  # Sololevelling

  AI Wealth Builder is an AI-powered, gamified personal finance web app that helps users grow their
wealth,
improve habits, and compete with friends ? powered by Next.js, Supabase, and Google Gemini AI.
Features:
- AI-generated personalized financial tasks and insights
- XP-based gamified progress system
- Realtime leaderboards with friends
- Secure Supabase Auth (Email + Socials)
- Futuristic dashboard with glassmorphism UI
Tech Stack:
Frontend: Next.js 15 (App Router, TypeScript)
UI: TailwindCSS + shadcn/ui + Framer Motion
Backend: Supabase (PostgreSQL, Auth, Realtime)
AI: Google Gemini API (Vertex AI SDK)
Deployment: Vercel + Supabase
Database Schema (Supabase):
- users: stores user info, XP, goals
- tasks: AI-generated daily/weekly financial tasks
- friends: friend connections and leaderboard
- insights: AI-generated advice per user
Setup Steps:
1. Clone the repo and install dependencies (npm install)
2. Configure Supabase project + enable Auth + Realtime
3. Add environment variables in .env.local
4. Run the dev server (npm run dev)
Deployment:
Frontend ? Vercel
Backend ? Supabase


  
