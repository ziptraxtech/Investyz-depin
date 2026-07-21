# Investyz Backend

## Node.js Backend Structure (Reference Implementation)

The `/app/backend/src/` folder contains a complete Node.js + Express.js backend implementation that can replace the Python FastAPI backend when deployed outside of the Emergent environment.

### Project Structure

```
backend/
│
├── src/
│   ├── config/
│   │   ├── db.js                # MongoDB connection via Mongoose
│   │   └── env.js               # Environment variable loader
│   │
│   ├── controllers/
│   │   ├── auth.controller.js   # Emergent OAuth authentication
│   │   ├── wallet.controller.js # EVM wallet connection
│   │   ├── segments.controller.js # Investment segments & plans
│   │   ├── investment.controller.js # User investments
│   │   └── payment.controller.js # Stripe payments
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.js   # Session token validation
│   │   └── error.middleware.js  # Global error handling
│   │
│   ├── models/
│   │   ├── user.model.js        # User schema
│   │   ├── session.model.js     # Auth sessions
│   │   ├── investment.model.js  # Investments
│   │   ├── payment.model.js     # Payment transactions
│   │   └── index.js             # Model exports
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── wallet.routes.js
│   │   ├── segments.routes.js
│   │   ├── investment.routes.js
│   │   ├── payment.routes.js
│   │   ├── portfolio.routes.js
│   │   └── index.js             # Route aggregator
│   │
│   ├── constants/
│   │   ├── walletTypes.js       # EVM wallet configurations
│   │   └── roles.js             # User roles
│   │
│   ├── utils/
│   │   ├── logger.js            # Logging utility
│   │   └── response.js          # Standardized API responses
│   │
│   ├── app.js                   # Express app setup
│   └── server.js                # Entry point
│
├── .env                         # Environment variables
├── package.json                 # Dependencies
└── README.md
```

### Running Node.js Backend Locally

```bash
cd /app/backend
npm install
npm run dev
```

### Local KYC Testing With ngrok

For Cashfree DigiLocker testing, you need two things:

1. A public HTTPS callback URL for the browser redirect.
2. A stable outbound IP for the backend request to Cashfree.

Recommended local setup:

```env
PORT=8001
NODE_ENV=development
CORS_ORIGINS=http://localhost:3000,https://YOUR-FRONTEND-NGROK-URL.ngrok-free.dev
CASHFREE_REDIRECT_URL=https://YOUR-FRONTEND-NGROK-URL.ngrok-free.dev/kyc
DECENTRO_REDIRECT_URL=https://YOUR-FRONTEND-NGROK-URL.ngrok-free.dev/kyc
REACT_APP_BACKEND_URL=https://YOUR-BACKEND-NGROK-URL.ngrok-free.dev
```

If you are running the backend from your laptop, Cashfree may still reject the request unless the backend's public IP is whitelisted in Secure ID. ngrok helps with HTTPS redirect URLs, but it does not change the backend's outbound IP.

### Decentro staging configuration

The backend already supports Decentro KYC, but it stays in mock mode until the required staging secrets are present in `backend/.env`.

Use the exact env names below when copying values from the Decentro credential sheet:

```env
DECENTRO_CLIENT_ID=
DECENTRO_CLIENT_SECRET=
DECENTRO_KYC_AND_ONBOARDING_MODULE_SECRET=
DECENTRO_ZOOPONE_PROVIDER_SECRET=
DECENTRO_REDIRECT_URL=https://YOUR-FRONTEND-DOMAIN/kyc
DECENTRO_CONSENT_PURPOSE=Investyz DigiLocker KYC
KYC_MOCK_MODE=false
```

Notes:

- `DECENTRO_KYC_AND_ONBOARDING_MODULE_SECRET` is treated as the required module secret for the current PAN + DigiLocker flow.
- `DECENTRO_ZOOPONE_PROVIDER_SECRET` is used automatically for the current KYC flow when a generic `DECENTRO_PROVIDER_SECRET` is not set.
- Leave the other Decentro module/provider secrets in `.env` too if you plan to enable core banking, financial services, Yes Bank, or Equifax flows later.
- Decentro consent purpose must stay within 50 characters.

### Vercel deployment notes

This repo's current `vercel.json` deploys only the React frontend. DigiLocker KYC will work in production only when both of the following are true:

1. The frontend is available on a stable public HTTPS URL such as `https://your-frontend.vercel.app`.
2. `REACT_APP_BACKEND_URL` points to a public backend deployment that serves the `/api` routes.

Recommended production values:

```env
# Frontend build env in Vercel
REACT_APP_BACKEND_URL=https://YOUR-BACKEND-DOMAIN

# Backend runtime env wherever the Node API is deployed
CORS_ORIGINS=https://YOUR-FRONTEND-DOMAIN
DECENTRO_REDIRECT_URL=https://YOUR-FRONTEND-DOMAIN/kyc
DECENTRO_CONSENT_PURPOSE=Investyz DigiLocker KYC
KYC_MOCK_MODE=false
```

Do not deploy temporary tunnel URLs such as `loca.lt` or `ngrok` as permanent Decentro callback URLs.

### Environment Variables

```env
PORT=8001
NODE_ENV=development

# MongoDB
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database

# CORS
CORS_ORIGINS=*

# JWT
JWT_SECRET=your_jwt_secret

# Stripe
STRIPE_API_KEY=sk_test_xxx

# Crypto payments
CRYPTO_PAYMENTS_ENABLED=true
CRYPTO_PAYMENT_NETWORK=amoy
CRYPTO_TREASURY_ADDRESS=0xYourTreasuryWallet
CRYPTO_REQUIRED_CONFIRMATIONS=1
CRYPTO_QUOTE_TTL_SECONDS=900
CRYPTO_SUPPORTED_FIAT_CURRENCIES=INR,USD,AED,SGD
CRYPTO_FIAT_BASE_CURRENCY=INR
POLYGON_AMOY_RPC_URL=https://your-amoy-rpc
POLYGON_MAINNET_RPC_URL=https://your-mainnet-rpc
FX_RATE_SOURCE_URL=https://open.er-api.com/v6/latest/USD
CRYPTO_PAYMENT_TOKENS=[{"symbol":"USDC","name":"USD Coin","address":"0x...","decimals":6,"pricing":"peg_usd"},{"symbol":"USDT","name":"Tether USD","address":"0x...","decimals":6,"pricing":"peg_usd"},{"symbol":"BNB","name":"Binance Token","address":"0x...","decimals":18,"pricing":"manual","usdPrice":600}]

# EVM Wallets
METAMASK_ENABLED=true
TRUST_WALLET_ENABLED=true
WALLETCONNECT_ENABLED=true
WALLETCONNECT_PROJECT_ID=your_project_id
SUPPORTED_CHAIN_IDS=1,137,56,42161
```

### API Endpoints

#### Authentication
- `POST /api/auth/session` - Exchange Emergent OAuth session for app session
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

#### Wallet
- `GET /api/wallet/supported` - Get supported EVM wallets
- `POST /api/wallet/connect` - Connect wallet to profile
- `POST /api/wallet/disconnect` - Disconnect wallet
- `POST /api/wallet/switch-chain` - Switch chain

#### Segments & Plans
- `GET /api/segments` - Get all segments
- `GET /api/segments/:id` - Get segment by ID
- `GET /api/plans` - Get all plans (optional ?segment_id filter)
- `GET /api/plans/:id` - Get plan by ID
- `POST /api/calculator` - Calculate investment returns

#### Investments
- `GET /api/investments` - Get user investments
- `POST /api/investments` - Create investment
- `GET /api/portfolio/stats` - Get portfolio statistics

#### Payments
- `POST /api/payments/checkout` - Create Stripe checkout
- `GET /api/payments/options` - Get crypto payment configuration
- `POST /api/payments/confirm` - Verify a submitted crypto transfer
- `GET /api/payments/status/:id` - Get payment status
- `GET /api/payments/history` - Get payment history

---

## Current Implementation (Python FastAPI)

The current running backend uses Python FastAPI (`server.py`) due to Emergent platform requirements. It provides identical functionality with the same API endpoints.

### Supported EVM Wallets
- MetaMask
- Trust Wallet
- WalletConnect
- Coinbase Wallet

### Supported Chains
- Polygon Amoy (80002)
- Ethereum Mainnet (1)
- Polygon (137)
- BNB Smart Chain (56)
- Arbitrum One (42161)

