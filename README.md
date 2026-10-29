# HadaLink

HadaLink connects farmers in Plateau State with nearby agricultural equipment providers. The repository is organized as a small monorepo with separate frontend and backend applications.

```text
frontend/   React + Vite marketplace interface
backend/    Express API starter
```

## Frontend

```sh
npm install
npm run dev
```

To create and preview a production build:

```sh
npm run build
npm run preview
```

The root npm workspace installs the frontend dependencies and lets deployment
platforms build the frontend from the repository root. The backend remains an
independent app with its own dependencies.

## Backend

```sh
cd backend
npm install
cp .env.example .env
npm run dev
```

The API listens on port `4000` by default. Check that it is running at [http://localhost:4000/api/health](http://localhost:4000/api/health).

Set `MONGODB_URI` in `backend/.env` to connect an Atlas cluster. The API includes MongoDB models for users, equipment, booking requests, email codes, and sessions; public equipment browse/detail endpoints; and authentication endpoints for password login, email verification, password reset, Google sign-in, and logout. Set `SESSION_SECRET`, `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, and `GOOGLE_CLIENT_ID` in `backend/.env`; set `VITE_GOOGLE_CLIENT_ID` in `frontend/.env` for the Google button. The frontend dashboard still uses demo data; provider listing management, booking mutations, Cloudinary uploads, and replacing demo data with API responses are the next steps.
