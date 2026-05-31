# Compliance Management System

A full-stack application for CA and compliance firms to manage clients, tasks, invoices, compliance calendars, and reports.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env.local` and configure `JWT_SECRET` (and `MONGODB_URI` if using MongoDB).
3. Start the app:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) and sign in.

**Demo credentials:** `admin@firm.com` / `password123`
