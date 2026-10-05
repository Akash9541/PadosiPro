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
- Mailpit-based OTP email delivery for local development/testing
- Backend tests for OTP and login rules

Use test data only. Never commit real `.env` files or SMTP credentials to
GitHub. The committed `.env.example` contains placeholders only.

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
- Mailpit

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
      ↓ SMTP
Mailpit
      ↓
http://localhost:8025
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

The example contains placeholders only. Put any real environment values only
in the ignored `apps/backend/.env` file. Never commit that file or SMTP
passwords to GitHub.

Example contents:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/padosipro
JWT_SECRET=replace-this-with-a-random-string
JWT_EXPIRES_IN=7d
SMTP_HOST=mailpit
SMTP_PORT=1025
SMTP_USER=
SMTP_PASSWORD=
PORT=5000
```

OTP emails are sent through Mailpit SMTP during local development/testing.
The local Mailpit setup does not require SMTP credentials. Mailpit captures
messages for preview instead of delivering them to the recipient's normal
inbox. Open `http://localhost:8025` to view captured OTP messages.

## Backend Setup

From the project root, start the complete local stack with:

```bash
docker compose up -d --build
```

Compose starts PostgreSQL, Mailpit, and the API. The backend container applies
Prisma migrations and seeds the task catalogue before starting the API, so do
not also run `npm run dev` on the host while the container is running.

- API: `http://localhost:5000`
- PostgreSQL: `localhost:5433`
- Mailpit web UI: `http://localhost:8025` (when Mailpit is running)

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

The tests in `apps/backend/tests/otp.test.ts` cover 6-digit OTP generation and
OTP hashing/comparison. The tests in `apps/backend/tests/auth.test.ts` cover
registration validation, OTP expiry, wrong-attempt limits, single-use OTPs,
resend cooldown, and login rules for verified and unverified users (plus
incorrect passwords). The auth tests use PostgreSQL and registration/resend
requests send OTP email, so configure an isolated test database and make
Mailpit available to the backend before running them. Do not point tests at
production data.

Run from the repository root:

```bash
cd apps/backend
npm test
```

Do not claim these tests prove the entire app flow works end to end; use the
manual flow below for that check.

## End-to-End Test Flow

Run this locally with PostgreSQL, the backend, and Mailpit available to the
backend container:

1. Start PostgreSQL, Mailpit, and the backend with `docker compose up -d --build` from the repository root.
2. Start the Expo mobile application from `apps/mobile` with `npx expo start`.
3. Register using test data.
4. Open the Mailpit web interface at `http://localhost:8025` and retrieve the
      6-digit OTP.
5. Enter the OTP and verify the email.
6. Log in with the verified account.
7. Complete the first-login profile.
8. Select tasks across categories.
9. Review and confirm the selection.
10. Verify the selected tasks appear on the Home screen.
11. Log out, then log back in to verify authentication/session persistence.

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

`render.yaml` defines an optional hosted API and managed PostgreSQL database.
This is only an optional/demo deployment. The recommended setup for testing the
complete OTP flow is local development with Docker Compose and Mailpit. Mailpit
is for local development/testing; do not configure or claim that Mailpit works
on Render. The hosted API's OTP delivery is not verified by this setup.

To deploy the API-only demo:

1. Push this repository to a GitHub repository you control.
2. Create a Render Blueprint from the repository and review its service/database costs.
3. Treat it as API-only. Do not configure Mailpit on Render; hosted OTP delivery
      is unverified. Run the complete OTP flow locally.
4. Wait for the API health check at `/api/health` to return `{"status":"ok"}`.
5. For an APK targeting the hosted API, set EAS `EXPO_PUBLIC_API_URL` to the Render URL plus `/api`, then follow Build APK.

Only the API should be public. Keep the database and all credentials private.
The database migrations and non-destructive catalogue seed run when the backend
starts; the seed does not delete users or task selections.
The Blueprint uses free demo plans; review Render's current limits and any
charges before creating resources. Free database availability and retention
can change, so keep the project on test data and export anything you need.

## Useful Commands

```bash
# From repository root
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

Check that Mailpit is running, `SMTP_HOST=mailpit`, and `SMTP_PORT=1025`.
Open `http://localhost:8025` to inspect captured emails. Local Mailpit does not
require SMTP credentials and does not deliver messages to the normal inbox.

## Final Notes

This project is intentionally simple and beginner-friendly while still implementing the required security basics:
- password hashing with bcrypt
- JWT authentication
- hashed OTP storage
- OTP expiry and attempt limits
- validation with Zod
- Mailpit-based local OTP email testing

This repo is meant to be understandable and runnable without unnecessary enterprise complexity.
