# Investyz

Investyz is a full-stack web application for exploring and investing in DePIN (decentralized physical infrastructure) opportunities. It provides a public investment catalogue and a signed-in investment flow with KYC, payment, wallet, and portfolio capabilities.

> This repository is an application codebase. Investment data, projected returns, and payment/KYC integrations must be reviewed and configured for the target environment before any production use.

## What is included

- Public React site for landing, company, blog, policy, risk-disclaimer, segment, and plan pages.
- Investment segments for data centers, battery storage, EV charging and fleets, renewable energy, and green-credit projects.
- React dashboard, user profile, wallet connection, payment result, KYC, and admin KYC screens.
- Express API with email/Google session endpoints and optional Clerk token support.
- MongoDB models for users, sessions, investments, and payments.
- KYC flow with PAN verification and DigiLocker support through Decentro; KYC records can be persisted to PostgreSQL when configured.
- Razorpay gateway and Polygon-compatible crypto-payment integrations, including a mock Razorpay option for local development.
- Server-side rate limiting, Helmet headers, CORS controls, input sanitisation, and authenticated/KYC-gated investment routes.

## Stack

| Area | Technology |
| --- | --- |
| Frontend | React 18, React Router, CRACO, Tailwind CSS, Radix UI, Clerk |
| Backend | Node.js 18+, Express, Mongoose |
| Data | MongoDB; optional PostgreSQL for KYC storage |
| Integrations | Clerk, Decentro, Razorpay, Polygon RPC |
| Hosting config | Vercel (frontend) |

## Repository layout

```text
frontend/                 React client application
  src/pages/              Public, account, KYC, dashboard, and payment views
  src/context/            Authentication and wallet state
  public/                 Brand, team, advisor, and segment assets
backend/                  Express API
  src/controllers/        Business logic and in-code segment/plan catalogue
  src/models/             MongoDB models
  src/repositories/       PostgreSQL KYC persistence
  src/routes/             API route definitions
  src/services/           Razorpay, Decentro, and crypto payment services
  tests/                  Node test suite
vercel.json               Root Vercel configuration for the frontend
```

## Prerequisites

- Node.js 18 or later
- npm
- A reachable MongoDB instance (required by the API at startup)
- PostgreSQL only when persistent KYC storage is required

For fully integrated authentication, payments, and KYC, you will also need the respective Clerk, Razorpay, Decentro, and Polygon RPC credentials.

## Run locally

1. Configure the backend environment.

   ```powershell
   Copy-Item backend/.env.example backend/.env
   ```

   At minimum, set `MONGODB_URI` (or `MONGO_URL` and `DB_NAME`), a strong `JWT_SECRET`, and `CORS_ORIGINS=http://localhost:3000`. Keep `KYC_MOCK_MODE=true` and `RAZORPAY_MOCK_MODE=true` for a local, non-live integration setup.

2. Configure the frontend environment.

   ```powershell
   Copy-Item frontend/.env.example frontend/.env.local
   ```

   Set `REACT_APP_BACKEND_URL=http://localhost:8001`. `REACT_APP_CLERK_PUBLISHABLE_KEY` is optional; without it the client uses the app's non-Clerk authentication flow.

3. Install dependencies and start the API in one terminal.

   ```powershell
   cd backend
   npm install
   npm run dev
   ```

4. In another terminal, start the frontend.

   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000). The API health endpoint is available at [http://localhost:8001/api/health](http://localhost:8001/api/health).

## Environment configuration

The complete, commented templates are at [`backend/.env.example`](backend/.env.example) and [`frontend/.env.example`](frontend/.env.example). Do not commit real credentials.

| Variable | Used by | Purpose |
| --- | --- | --- |
| `MONGODB_URI` or `MONGO_URL` / `DB_NAME` | API | MongoDB connection for core application data |
| `DATABASE_URL` | API | Optional PostgreSQL connection for KYC storage |
| `JWT_SECRET` | API | Secret used for application JWTs |
| `CORS_ORIGINS` | API | Comma-separated allowed frontend origins |
| `REACT_APP_BACKEND_URL` | Client | Public or local API base URL |
| `REACT_APP_CLERK_PUBLISHABLE_KEY` | Client | Enables Clerk on the frontend |
| `CLERK_ISSUER` | API | Enables Clerk token verification |
| `KYC_MOCK_MODE` | API | Uses mock KYC unless explicitly set to `false` |
| `RAZORPAY_MOCK_MODE` | API | Uses mock gateway checkout unless explicitly set to `false` |
| `DECENTRO_*` | API | Decentro PAN/DigiLocker credentials and callbacks |
| `RAZORPAY_*` | API | Razorpay keys, webhook secret, and redirect URLs |
| `CRYPTO_*` / `POLYGON_*` | API | Crypto checkout, token, treasury, and RPC settings |

## API overview

All API routes are mounted below `/api`.

| Area | Endpoints |
| --- | --- |
| Health | `GET /`, `GET /health` |
| Authentication | `POST /auth/signup`, `/auth/login`, `/auth/google`, `/auth/session`; `GET /auth/me`; profile, OTP, and logout routes |
| Catalogue | `GET /segments`, `GET /segments/:segmentId`, `GET /plans`, `GET /plans/:planId`, `POST /calculator` |
| Wallet | `GET /wallet/supported`; authenticated connect, disconnect, and chain-switch routes |
| KYC | Authenticated status, PAN verification, DigiLocker session, mock reset, and admin listing routes; DigiLocker callbacks are public |
| Payments | KYC-verified checkout, crypto confirmation, Razorpay verification, payment options, status, and history routes |
| Investments | Authenticated investment list/detail; KYC-verified investment creation; authenticated portfolio stats |
| Webhooks | `POST /webhooks/decentro` and `POST /payments/webhook/stripe` |

Refer to the route files under [`backend/src/routes`](backend/src/routes) for request shapes and middleware requirements.

## Authentication and investment flow

```text
Sign in -> complete KYC -> choose a plan -> create checkout -> verify payment -> create/view investment -> dashboard
```

Investment creation and payment checkout require an authenticated user whose KYC status is `VERIFIED`. Admin KYC access additionally requires the `admin` role.

## Test and build

Run the available backend routing test:

```powershell
cd backend
node --test tests/payment-routing.test.js
```

Create a production frontend build:

```powershell
cd frontend
npm run build
```

## Deployment

The root [`vercel.json`](vercel.json) builds and serves `frontend/` as a single-page application. Deploy the Express API separately and configure:

- Vercel `REACT_APP_BACKEND_URL` with the API's public HTTPS URL.
- API `CORS_ORIGINS` with the frontend's public HTTPS URL.
- `DECENTRO_REDIRECT_URL` with `https://YOUR-FRONTEND-DOMAIN/kyc` when using live DigiLocker KYC.

The API must use a stable HTTPS domain for production payments and KYC callbacks; do not use temporary tunnel URLs as permanent callback settings.

## Related documentation

- [`backend/README.md`](backend/README.md) - backend-focused notes, including KYC/deployment details
- [`DEPLOY_KYC_CHECKLIST.md`](DEPLOY_KYC_CHECKLIST.md) - KYC deployment checklist
- [`auth_testing.md`](auth_testing.md) - authentication test notes

## License

The backend package declares the MIT license. Confirm project-wide licensing requirements before redistribution.
