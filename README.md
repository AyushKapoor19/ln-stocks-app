<div align="center">

# LN Stocks App

### Real-time stock market tracking for TV devices

Built with TypeScript • Lightning.js • Next.js • Fastify

[![Node.js](https://img.shields.io/badge/Node.js-18.20.8-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.2-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

[API Docs](#api-endpoints) • [Report Bug](https://github.com/AyushKapoor19/ln-stocks-app/issues)

</div>

---

## Highlights

<div align="center">

|   **TV Application**   |  **Real-Time Data**  | **Device Authentication** | **Interactive Charts** |
| :--------------------: | :------------------: | :-----------------------: | :--------------------: |
| Lightning.js Framework | Finnhub + Polygon.io |    Mobile QR Code Flow    | Chart.js Visualization |

</div>

## Features

### TV Application - Real-Time Tracking

<p align="center">
  <img src="./docs/screenshots/tv-home-screen.png" alt="Home Screen" width="800">
</p>

Interactive stock charts with market overview, stock details, and watchlist management. Supports multiple time periods (1M, 3M, 1Y) with Chart.js visualizations.

---

### Stock Search with On-Screen Keyboard

<p align="center">
  <img src="./docs/screenshots/tv-search-screen.png" alt="Search Screen" width="800">
</p>

Stock search with indexed popular symbols and on-screen keyboard navigation for TV remotes.

---

### Device Code Authentication

<p align="center">
  <img src="./docs/screenshots/tv-device-auth.png" alt="Device Authentication" width="800">
</p>

Secure TV authentication via mobile device using QR code scanning or manual code entry. Visit the activation URL on your phone to approve.

---

### Email Authentication

<p align="center">
  <img src="./docs/screenshots/tv-email-signup.png" alt="Email Sign Up" width="800">
</p>

Traditional email/password authentication with real-time validation and security requirements displayed on-screen.

## Architecture

**Monorepo structure** with three components:

```
ln-stocks-app/
├── apps/
│   ├── backend/        # REST API (Fastify)
│   ├── frontend/       # TV Application (Lightning.js)
│   └── mobile-web/     # Device Authentication Interface (Next.js)
└── package.json        # Workspace configuration
```

### Backend

- **Fastify 4.x** REST API
- **PostgreSQL** database with dual-layer caching
- **JWT authentication** with device code flow
- Integration with **Finnhub** and **Polygon.io** APIs

### Frontend (TV Application)

- **Lightning.js 5.5.6** framework for set-top boxes
- **Vite 4.5.5** build system
- **Chart.js 4.5.1** visualizations
- Multi-resolution support (720p, 1080p, 4K)

### Mobile Web (Device Authentication Only)

- **Next.js 13.5.6** with App Router for device code activation
- **React 18.2.0** and **Tailwind CSS 3.4.0**
- Purpose: QR code scanning and TV authentication via mobile device

## Prerequisites

- **Node.js** 18.20.8 (see `.nvmrc`)
- **npm** 8.19.4+
- **PostgreSQL** database
- **Finnhub API key** - [Get one here](https://finnhub.io/)
- **Polygon.io API key** - [Get one here](https://polygon.io/) _(Note: Polygon.io is now Massive)_

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

**Base URL:** `https://ln-stocks-backend.onrender.com`

<details>
<summary><b>Market Data (v1)</b></summary>

- `GET /v1/quotes?symbols=<symbols>` - Real-time quotes
- `GET /v1/series?symbol=<symbol>&period=<period>` - Historical data
- `GET /v1/metrics?symbols=<symbols>` - Market metrics

</details>

<details>
<summary><b>Search (v1)</b></summary>

- `GET /v1/search?q=<query>` - Stock search
- `GET /v1/search/enhanced?q=<query>` - Enhanced search with index
- `GET /v1/search/index-status` - Search index health

</details>

<details>
<summary><b>Authentication</b></summary>

- `POST /auth/signup` - Create account
- `POST /auth/login` - User login
- `GET /auth/verify` - Verify JWT token

</details>

<details>
<summary><b>Device Code Authentication</b></summary>

- `POST /auth/device-code/generate` - Generate device code
- `GET /auth/device-code/status` - Check approval status
- `POST /auth/device-code/verify` - Verify device code
- `POST /auth/device-code/approve` - Approve with existing account
- `POST /auth/device-code/approve-signup` - Approve with new account

</details>

<details>
<summary><b>Health & Status</b></summary>

- `GET /` - API information and health check

</details>

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

<table>
<tr>
<td width="50%">

- **JWT-based authentication**
- **Bcrypt password hashing** (10 rounds)
- **Parameterized SQL queries**
- **Environment-based secrets**

</td>
<td width="50%">

- **SSL database connections**
- **CORS configuration**
- **Device code authentication flow**

</td>
</tr>
</table>

## Deployment

<table>
<tr>
<td>

### Backend - Render

**Live API:** `https://ln-stocks-backend.onrender.com`

```bash
# Build command
cd apps/backend && npm install && npm run build

# Start command
cd apps/backend && npm start
```

</td>
<td>

### Mobile Web (Authentication Interface) - Vercel

**Live URL:** `https://ln-stocks-web.vercel.app/activate`

Used exclusively for TV device authentication via QR code or device code entry. Not a standalone stock tracking app.

</td>
</tr>
</table>

### Frontend (TV Application)

The Lightning.js application is designed for TV interfaces and runs as a web application. It can be accessed via browser or deployed to hosting platforms.

## Technology Stack

<table>
<tr>
<td width="33%">

### Backend

- **Fastify** 4.28.1
- **PostgreSQL** (pg 8.11.3)
- **jsonwebtoken** 9.0.2
- **bcrypt** 5.1.1
- **qrcode** 1.5.3

</td>
<td width="33%">

### Frontend (TV)

- **Lightning.js** 5.5.6
- **Chart.js** 4.5.1
- **Vite** 4.5.5

</td>
<td width="33%">

### Mobile Web

- **Next.js** 13.5.6
- **React** 18.2.0
- **Tailwind CSS** 3.4.0

</td>
</tr>
</table>

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

### Mobile Web (Authentication Interface)

| Variable            | Description     | Required                    |
| ------------------- | --------------- | --------------------------- |
| NEXT_PUBLIC_API_URL | Backend API URL | No (defaults to production) |

---

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

This is a personal portfolio project. Issues, feedback, and discussions are welcome through the [issues page](https://github.com/AyushKapoor19/ln-stocks-app/issues).

---

<div align="center">

**Built by [Ayush Kapoor](https://github.com/AyushKapoor19)**

</div>
