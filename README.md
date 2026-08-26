# BORO Couch Manager — Football Manager App (Middlesbrough themed)

This repository contains the starter scaffold for a Middlesbrough football-manager style web app.

What I added in this commit:
- NextAuth configuration with a Credentials provider (email + password)
- Registration API endpoint (POST /api/auth/register)
- Login and Register pages (/auth/login, /auth/register)
- Prisma schema with User, Player, Fixture, Selection, Prediction, PointsLog
- Prisma client helper and password hashing utilities
- package.json with scripts to run and manage Prisma
- .env.example (DO NOT commit real secrets)

Next steps I can take (ask me to proceed):
- Add formation editor with drag & drop
- Add squad/fixtures import from your external API
- Implement scoring engine and per-user points logs
- Add UI styling (Middlesbrough theme) and protected routes

Quick setup (local):
1. Copy .env.example to .env and set DATABASE_URL and NEXTAUTH_SECRET.
2. npm install
3. npx prisma generate && npx prisma migrate dev --name init
4. npm run dev

Security reminder: do not commit your real API key. Set it in environment variables or GitHub Secrets.
