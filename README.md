# PadosiPro

This project is a full-stack onboarding app for PadosiPro. It includes a native React Native mobile app and a Node.js/Express backend with PostgreSQL and Prisma.

## Overview

The user journey is:

1. Register
2. Verify email with OTP
3. Login
4. Complete first-login profile
5. Select tasks
6. Confirm selection
7. View selected tasks on the Home screen
8. Logout

## Features

- User registration with password validation
- Email OTP verification with expiry and attempt limits
- JWT-based login for verified users only
- First-login profile flow with Indian mobile validation
- Task catalogue with categories and search/filtering
- Multi-select task saving
- Home screen showing selected services
- Secure password hashing and hashed OTP storage
- Ethereal SMTP-based OTP email delivery
- Backend tests for OTP and login rules

## Tech Stack

### Mobile
- React Native
- Expo SDK 52
- TypeScript
- Expo Router
- React Hook Form + Zod
- Zustand
- Expo SecureStore
- Axios

### Backend
- Node.js
- Express
- TypeScript
- PostgreSQL
- Prisma ORM
- bcrypt
- JWT
- Zod
- Nodemailer

### Infrastructure
- Docker Compose
- PostgreSQL
- Ethereal SMTP

### Testing
- Vitest
- Supertest

## Architecture

```text
React Native app
      ↓
Express API
      ↓
Prisma
      ↓
PostgreSQL

Express
      ↓ HTTPS API
Ethereal SMTP
```

## Prerequisites

- Node.js 18+
- Docker Desktop or Docker Engine
- npm
- Expo Go on a phone, or Android/iOS emulator tooling if available

> Important: this project is configured for Expo SDK 52. If you use a newer Expo Go app that targets a different SDK, you may see an incompatible-version error. Use an Expo Go version compatible with SDK 52.

## Project Structure

```text
PadosiPro/
├── apps/
│   ├── backend/
│   │   ├── prisma/
│   │   ├── src/
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── mobile/
│       ├── app/
│       ├── components/
│       ├── constants/
│       ├── services/
│       ├── store/
│       ├── types/
│       ├── package.json
│       └── tsconfig.json
├── docker-compose.yml
├── .env.example
├── DESIGN.md
├── README.md
└── .gitignore
```

## Environment Variables

The backend reads environment variables from `apps/backend/.env`.

Create it from the example at the project root:

```bash
cp .env.example apps/backend/.env
```

Example contents:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/padosipro
JWT_SECRET=replace-this-with-a-random-string
JWT_EXPIRES_IN=7d
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=your-ethereal-username
SMTP_PASSWORD=your-ethereal-password
PORT=5000
```

Replace the SMTP username and password placeholders with credentials generated
by Ethereal. Use the same values for local `apps/backend/.env` and the hosting
provider's environment. Port `587` uses STARTTLS. Ethereal captures test email
for preview and does not deliver messages to the recipient's regular inbox.

## Backend Setup

From the project root, start the complete local stack with:

```bash
docker compose up -d --build
```

Compose starts PostgreSQL and the API. The backend container applies
Prisma migrations and seeds the task catalogue before starting the API, so do
not also run `npm run dev` on the host while the container is running.

- API: `http://localhost:5000`
- PostgreSQL: `localhost:5433`
To stop the services:

```bash
docker compose down
```

For local host-based backend development instead, start PostgreSQL with
`docker compose up -d postgres`, create `apps/backend/.env` from the root
`.env.example`, then run the backend migration, seed, and `npm run dev` commands
from `apps/backend`.

The backend API is available at:

```text
http://localhost:5000
```

## Mobile App Setup

### 1. Install dependencies

```bash
cd apps/mobile
npm install
```

### 2. Start Expo

```bash
npx expo start
```

### 3. Open the app

Choose one of the following:

- Expo Go on a physical phone
- Android emulator if Android SDK is installed
- iOS simulator if Xcode is installed

> If you use Expo Go, make sure the version matches Expo SDK 52. A newer Expo Go build may show an SDK compatibility error.

### 4. App connection to backend

The app uses:

```text
http://10.0.2.2:5000/api
```

for Android emulators by default. You can override the API URL with
`EXPO_PUBLIC_API_URL`.

For a physical device, create a mobile environment file and set the URL to your
computer's LAN IP. Keep the phone and computer on the same Wi-Fi network:

```bash
cd apps/mobile
cp .env.example .env
```

Edit `apps/mobile/.env` with your computer's IP, then restart Expo with
`npx expo start --clear`. For example, use
`EXPO_PUBLIC_API_URL=http://192.168.1.10:5000/api`.

## Running Tests

From the backend folder:

```bash
cd apps/backend
npm test
```

This checks OTP logic and auth behavior.

## Build APK

The EAS preview profile is configured to produce an installable Android APK:

```bash
cd apps/mobile
npx eas-cli build -p android --profile preview
```

Sign in to an Expo/EAS account when prompted. When the cloud build completes,
download the APK from the build link printed by EAS. `npx expo export` only
exports JavaScript bundles; it does not produce an installable APK.

## Hosted Demo Deployment

`render.yaml` defines a hosted API and managed PostgreSQL database. To deploy:

1. Push this repository to a GitHub repository you control.
2. In Render, create a Blueprint from that repository and review the service
      and database plans and costs before confirming.
3. Create an Ethereal test account and set `SMTP_USER` and `SMTP_PASSWORD` in
      the API service environment. Set `SMTP_HOST=smtp.ethereal.email` and
      `SMTP_PORT=587` for STARTTLS.
4. Wait for the API health check at `/api/health` to return `{"status":"ok"}`.
5. Set the public API URL in the EAS `production` environment, then rebuild:

      ```bash
      cd apps/mobile
      npx eas-cli env:set production --name EXPO_PUBLIC_API_URL --value https://your-api.onrender.com/api --visibility plaintext
      npx eas-cli build -p android --profile preview
      ```

      Replace the example URL with the API service URL shown in Render.

Only the API should be public. Keep the database, SMTP credentials, and EAS
secrets private. The database migrations and non-destructive catalogue seed run
when the backend starts; the seed does not delete users or task selections.
The Blueprint uses free demo plans; review Render's current limits and any
charges before creating resources. Free database availability and retention
can change, so keep the project on test data and export anything you need.

## Useful Commands

```bash
# From repo root
cd /Users/akash/Desktop/PadosiPro
docker compose up -d

# From backend
cd apps/backend
npm install
npx prisma migrate dev --name init
npm run seed
npm run dev

# From mobile
cd apps/mobile
npm install
npx expo start
```

## Troubleshooting

### Docker/Postgres not starting

```bash
docker compose down -v
docker compose up -d
```

### Prisma cannot connect to database

Check that Postgres is running and the `DATABASE_URL` is correct:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/padosipro
```

### Port 5000 already in use

Stop other processes using port 5000, then restart Docker/backend:

```bash
lsof -nP -i :5000 | grep LISTEN
kill -9 <PID>
```

### Expo Go compatibility issue

If the app says the current Expo Go is for another SDK version, install a version compatible with Expo SDK 52.

### OTP email not arriving

Check the backend logs and confirm `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, and
`SMTP_PASSWORD` are set correctly. Ethereal captures test messages for preview;
it does not send them to the recipient's regular inbox.

## Final Notes

This project is intentionally simple and beginner-friendly while still implementing the required security basics:
- password hashing with bcrypt
- JWT authentication
- hashed OTP storage
- OTP expiry and attempt limits
- validation with Zod
- OTP email delivery through Ethereal SMTP using STARTTLS

This repo is meant to be understandable and runnable without unnecessary enterprise complexity.
