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

Set `MONGODB_URI` in `backend/.env` to connect an Atlas cluster. The API includes MongoDB models for users, equipment, booking requests, email codes, and sessions; public equipment browse/detail endpoints; and authentication endpoints for password login, email verification, password reset, Google sign-in, and logout. Set `SESSION_SECRET`, `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, and `GOOGLE_CLIENT_ID` in `backend/.env`; set `VITE_GOOGLE_CLIENT_ID` in `frontend/.env` for the Google button. Signed-in workspaces use published equipment and booking records from the API; the public landing page retains sample listings for its product preview.

Logistics-provider workspaces use the transport status stored separately on each equipment booking. Set `HADALINK_TRANSPORT_FEE_NGN` on the backend (for example, in Render's environment settings) to publish the predetermined fixed fee to farmers and transport providers. Leave it unset until HadaLink has approved a price; farmers will then be told to arrange their own transport, and the API will reject any transport request without a configured fee. Update operating areas and transport capacity on each logistics provider's profile to make request matching relevant.
