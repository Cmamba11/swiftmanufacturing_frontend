<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/5d421901-5fb6-4da3-843d-6aef526ab2a5

## Run Locally

**Prerequisites:**  Node.js


1. Install frontend dependencies:
   `npm install`
2. Install backend dependencies and initialize backend database:
   `npm --prefix backend run setup`
3. Or run all setup steps (frontend + backend) in one command:
   `npm run setup`
4. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key (only needed for the optional Gemini analysis feature)
5. Run backend API (Express + Prisma) in one terminal:
   `npm run dev:api`
6. Run frontend (Vite + React) in another terminal:
   `npm run dev`
7. Sign in from the frontend login screen using one of the seeded accounts:
   - `admin / admin123`
   - `production / production123`
   - `warehouse / warehouse123`
   - `logistics / logistics123`
   - `management / management123`

## Backend API

The backend is a standalone app under `backend/` (its own dependencies, scripts, and Prisma schema).

- Backend install/setup: `npm --prefix backend run setup`
- Backend dev: `npm --prefix backend run dev`
- Backend DB: reads `DATABASE_URL` (Postgres) from `backend/.env`, or falls back to root `.env` during local split-repo development.

- API default URL: `http://localhost:4000`
- Frontend dev URL: `http://localhost:3000`
- Frontend talks to backend through Vite proxy (`/api -> http://localhost:4000`) or directly if `VITE_API_BASE_URL` is set.

## Deployment Split

- Frontend (Vercel): deploy repo root as the frontend app.
- Backend (Render): deploy the `backend` directory as a separate Node service.
- Set `VITE_API_BASE_URL` on Vercel to your Render backend URL.

Available API routes (prefix `/api`):

- `GET /health`
- `POST /auth/login` (public)
- `GET /auth/me` (authenticated)
- `GET /products`
- `POST /products`
- `PATCH /products/:id`
- `DELETE /products/:id`
- `GET /customers`
- `POST /customers`
- `PATCH /customers/:id`
- `DELETE /customers/:id`
- `GET /transactions`
- `POST /transactions`
- `PATCH /transactions/:id`
- `GET /issuing-records`
- `POST /issuing-records` (also deducts raw material stock when `materialBags` is provided)
- `GET /production-records`
- `POST /production-records` (reuses the same date/shift/machine slot instead of duplicating)
- `GET /material-stock`
- `PATCH /material-stock`
- `GET /spare-parts`
- `POST /spare-parts`
- `PATCH /spare-parts/:id`
- `GET /spare-issuances`
- `POST /spare-issuances` (also decrements spare part stock atomically)

All API routes except `GET /api/health` and `POST /api/auth/login` require a bearer token.
# swiftmanufacturing_frontend
