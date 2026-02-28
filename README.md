# LN Stocks App

Real-time stock market tracking application built with TypeScript, Lightning.js, Next.js, and Fastify. Features multi-platform support for TV, web, and mobile devices with comprehensive market data, interactive charts, and device authentication.

## Architecture

Monorepo structure with three main applications:

```
ln-stocks-app/
├── apps/
│   ├── backend/        # REST API (Fastify)
│   ├── frontend/       # TV Application (Lightning.js)
│   └── mobile-web/     # Web Interface (Next.js)
└── package.json        # Workspace configuration
```

### Backend

- Fastify 4.x REST API
- PostgreSQL database with dual-layer caching
- JWT authentication with device code flow
- Integration with Finnhub and Polygon.io APIs

### Frontend (TV Application)

- Lightning.js 5.5.6 framework
- Vite 4.5.5 build system
- Chart.js 4.5.1 visualizations
- Multi-resolution support (720p, 1080p, 4K)

### Mobile Web

- Next.js 13.5.6 with App Router
- React 18.2.0 and Tailwind CSS 3.4.0
- Vercel-optimized standalone build

## Prerequisites

- Node.js 18.20.8 (see `.nvmrc`)
- npm 8.19.4+
- PostgreSQL database
- Finnhub API key ([Get one here](https://finnhub.io/))
- Polygon.io API key ([Get one here](https://polygon.io/)) - Note: Polygon.io is now Massive

## Installation

```bash
git clone https://github.com/AyushKapoor19/ln-stocks-app.git
cd ln-stocks-app
npm install
```

## Configuration

### Backend Environment Variables

Create `apps/backend/.env`:

```bash
PORT=8787
DATABASE_URL=postgresql://username:password@host/dbname?sslmode=require
JWT_SECRET=<secure-random-string>
FINNHUB_KEY=<your-finnhub-api-key>
POLYGON_KEY=<your-polygon-api-key>
```

### Database Setup

1. Run the initial schema in your PostgreSQL database:

```bash
psql -d <your-database-url> -f apps/backend/database/schema.sql
```

2. Run migrations to add additional tables and columns:

```bash
cd apps/backend
npm run migrate
```

## Running the Application

### All Services

```bash
npm run dev
```

### Individual Services

Backend:

```bash
npm run dev:backend
```

Frontend (TV):

```bash
npm run dev:frontend
```

Mobile Web:

```bash
cd apps/mobile-web
npm run dev
```

## Production Build

### Backend

```bash
cd apps/backend
npm run build
npm start
```

### Frontend

```bash
cd apps/frontend
npm run build
```

### Mobile Web

```bash
cd apps/mobile-web
npm run build
npm start
```

## API Endpoints

Base URL: `https://ln-stocks-backend.onrender.com`

### Health & Status

- `GET /` - API information and health check

### Market Data (v1)

- `GET /v1/quotes?symbols=<symbols>` - Real-time quotes
- `GET /v1/series?symbol=<symbol>&period=<period>` - Historical data
- `GET /v1/metrics?symbols=<symbols>` - Market metrics

### Search (v1)

- `GET /v1/search?q=<query>` - Stock search
- `GET /v1/search/enhanced?q=<query>` - Enhanced search with index
- `GET /v1/search/index-status` - Search index health

### Authentication

- `POST /auth/signup` - Create account
- `POST /auth/login` - User login
- `GET /auth/verify` - Verify JWT token

### Device Code Authentication

- `POST /auth/device-code/generate` - Generate device code
- `GET /auth/device-code/status` - Check approval status
- `POST /auth/device-code/verify` - Verify device code
- `POST /auth/device-code/approve` - Approve with existing account
- `POST /auth/device-code/approve-signup` - Approve with new account

## Database Schema

### Core Tables

**users** - User accounts and authentication  
**device_codes** - TV device authentication codes  
**stock_series_cache** - Historical price data cache (24h TTL)

## Project Structure

### Backend (`apps/backend/src/`)

```
routes/         # API endpoints
services/       # Business logic
types/          # TypeScript definitions
utils/          # Helper functions
constants/      # Configuration
server.ts       # Application entry
```

### Frontend (`apps/frontend/src/`)

```
app/            # Application core
screens/        # UI screens
components/     # Reusable components
services/       # API clients
types/          # TypeScript definitions
utils/          # Utilities
constants/      # Configuration
```

### Mobile Web (`apps/mobile-web/src/`)

```
app/            # Next.js pages
components/     # React components
services/       # API clients
hooks/          # Custom hooks
types/          # TypeScript definitions
utils/          # Utilities
```

## Security Features

- JWT-based authentication
- Bcrypt password hashing (10 rounds)
- Parameterized SQL queries
- Environment-based secrets
- SSL database connections
- CORS configuration
- Device code authentication flow

## Deployment

### Backend

Deployed on [Render](https://render.com)

- Live API: `https://ln-stocks-backend.onrender.com`
- Build command: `cd apps/backend && npm install && npm run build`
- Start command: `cd apps/backend && npm start`

### Mobile Web

Deployed on [Vercel](https://vercel.com)

- Live URL: `https://ln-stocks-web.vercel.app`
- Deployment: Automatic via Vercel CLI or GitHub integration

### Frontend (TV Application)

The Lightning.js TV application is designed for set-top boxes and smart TV devices. It is not web-deployed but rather packaged and installed on target devices.

## Technology Stack

### Backend

- Fastify 4.28.1 - Web framework
- PostgreSQL (pg 8.11.3) - Database
- jsonwebtoken 9.0.2 - JWT authentication
- bcrypt 5.1.1 - Password hashing (10 rounds)
- qrcode 1.5.3 - Device code QR generation

### Frontend

- Lightning.js 5.5.6 - TV framework
- Chart.js 4.5.1 - Data visualization
- Vite 4.5.5 - Build tool

### Mobile Web

- Next.js 13.5.6 - React framework
- Tailwind CSS 3.4.0 - Styling
- React 18.2.0 - UI library

## Testing

Test database connection:

```bash
cd apps/backend
npm run test:db
```

## Environment Variables

### Backend

| Variable       | Description                     | Required           |
| -------------- | ------------------------------- | ------------------ |
| PORT           | Server port                     | No (default: 8787) |
| DATABASE_URL   | PostgreSQL connection string    | Yes                |
| JWT_SECRET     | JWT signing secret              | Yes                |
| FINNHUB_KEY    | Finnhub API key                 | Yes                |
| POLYGON_KEY    | Polygon.io API key              | Yes                |
| MOBILE_WEB_URL | Mobile web URL for device codes | No                 |

### Frontend

| Variable     | Description     | Required                    |
| ------------ | --------------- | --------------------------- |
| VITE_API_URL | Backend API URL | No (defaults to production) |

### Mobile Web

| Variable            | Description     | Required                    |
| ------------------- | --------------- | --------------------------- |
| NEXT_PUBLIC_API_URL | Backend API URL | No (defaults to production) |

## Contributing

Contributions, issues, and feature requests are welcome.

## License

MIT License

## Contact

For questions or feedback, please open an issue on GitHub.
