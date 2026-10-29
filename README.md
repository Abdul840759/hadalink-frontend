# HadaLink

HadaLink connects farmers in Plateau State with nearby agricultural equipment providers. The repository is organized as a small monorepo with separate frontend and backend applications.

```text
frontend/   React + Vite marketplace interface
backend/    Express API starter
```

## Frontend

```sh
cd frontend
npm install
npm run dev
```

To create and preview a production build:

```sh
npm run build
npm run preview
```

## Backend

```sh
cd backend
npm install
cp .env.example .env
npm run dev
```

The API listens on port `4000` by default. Check that it is running at [http://localhost:4000/api/health](http://localhost:4000/api/health).

The backend currently provides only its service health endpoint. Database storage, authentication, and marketplace APIs can be added as their requirements are agreed.
