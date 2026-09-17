# Deploy KYC Checklist

This project can be pushed to GitHub and redeployed on Vercel for the frontend, but real Decentro DigiLocker KYC will work in production only after both the frontend and backend are publicly reachable with stable URLs.

## After GitHub Push

1. Wait for the Vercel frontend deployment to finish.
2. Confirm the live frontend URL is still `https://www.investyz.com`.
3. Open the Vercel project settings and check `REACT_APP_BACKEND_URL`.

## Frontend Vercel Env

Set:

```env
REACT_APP_BACKEND_URL=https://YOUR-BACKEND-DOMAIN
REACT_APP_CLERK_PUBLISHABLE_KEY=...
```

`REACT_APP_BACKEND_URL` must point to a public backend deployment that serves `/api`.

## Backend Runtime Env

Wherever the Node backend is deployed, set:

```env
CORS_ORIGINS=https://www.investyz.com
DECENTRO_REDIRECT_URL=https://www.investyz.com/kyc
DECENTRO_CONSENT_PURPOSE=Investyz DigiLocker KYC
KYC_MOCK_MODE=false

DECENTRO_CLIENT_ID=...
DECENTRO_CLIENT_SECRET=...
DECENTRO_KYC_AND_ONBOARDING_MODULE_SECRET=...
DECENTRO_ZOOPONE_PROVIDER_SECRET=...
DECENTRO_YES_BANK_PROVIDER_SECRET=...
DECENTRO_EQUIFAX_PROVIDER_SECRET=...
DECENTRO_CORE_BANKING_MODULE_SECRET=...
DECENTRO_FINANCIAL_SERVICES_MODULE_SECRET=...
```

## Decentro Side

Confirm Decentro is configured with:

```text
https://www.investyz.com/kyc
```

as the redirect/callback URL for the active environment.

## Important

- Do not push local `.env` files.
- Do not use temporary tunnel URLs in production.
- If `REACT_APP_BACKEND_URL` is missing or points to localhost, production KYC will fail even if the frontend deploy succeeds.
