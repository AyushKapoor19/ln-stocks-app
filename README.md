# LN Stocks App

Stock tracking app for TV devices. Built this to learn Lightning.js and work with TV interfaces.

Tracks real-time stock prices, lets you search with a TV remote, and handles authentication via QR code from your phone.

## Screenshots

Home screen with stock charts:

![Home Screen](./docs/screenshots/tv-home-screen.png)

Search with on-screen keyboard:

![Search Screen](./docs/screenshots/tv-search-screen.png)

QR code authentication:

![Device Auth](./docs/screenshots/tv-device-auth.png)

Or sign up with email:

![Email Signup](./docs/screenshots/tv-email-signup.png)

## Tech

**Backend:** Fastify + PostgreSQL with JWT auth  
**TV App:** Lightning.js + Chart.js  
**Auth UI:** Next.js for the phone-based login flow  
**Market Data:** Finnhub and Polygon.io APIs

## Setup

You'll need:
- Node.js 18.20.8
- PostgreSQL
- API keys from [Finnhub](https://finnhub.io/) and [Polygon.io](https://polygon.io/) (now called Massive)

```bash
git clone https://github.com/AyushKapoor19/ln-stocks-app.git
cd ln-stocks-app
npm install
```

### Configure backend

Create `apps/backend/.env`:

```bash
PORT=8787
DATABASE_URL=postgresql://username:password@host/dbname?sslmode=require
JWT_SECRET=<your-secret>
FINNHUB_KEY=<your-key>
POLYGON_KEY=<your-key>
```

Run the database migrations:

```bash
psql -d <your-database-url> -f apps/backend/database/schema.sql
cd apps/backend && npm run migrate
```

## Running everything

Start all services:
```bash
npm run dev
```

Or individually:
```bash
npm run dev:backend
npm run dev:frontend
cd apps/mobile-web && npm run dev
```

## Structure

```
ln-stocks-app/
├── apps/backend/        # API server
├── apps/frontend/       # TV app
└── apps/mobile-web/     # Phone auth UI
```

## API

Backend is live at `https://ln-stocks-backend.onrender.com`

Some useful endpoints:
- `GET /v1/quotes?symbols=AAPL,TSLA` - current prices
- `GET /v1/series?symbol=AAPL&period=1M` - historical data
- `GET /v1/search?q=apple` - search stocks
- `POST /auth/signup` - create account
- `POST /auth/login` - login
- `POST /auth/device-code/generate` - start TV auth flow

## How device auth works

TV generates a code and shows a QR code. Scan it with your phone (or manually enter the code), login or sign up, and the TV gets authenticated. Pretty straightforward.

## Deployment

Backend runs on Render, auth UI is on Vercel (`https://ln-stocks-web.vercel.app/activate`), and the TV app is just a web app so you can host it anywhere.

## Notes

Stock data gets cached in Postgres for 24h. Passwords use bcrypt with 10 rounds. Device codes expire after 10 minutes so you gotta be quick with that phone scan.

## License

MIT
