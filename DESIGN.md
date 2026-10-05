# Design Document

## Architecture

```
React Native (Expo)
       ↓ HTTP/JSON
Express API (Node.js)
       ↓ Prisma ORM
PostgreSQL

Express → Nodemailer → Mailpit (local SMTP)
```

The app uses a simple client-server architecture. The React Native mobile app communicates with the Express backend through REST APIs. The backend uses Prisma to interact with PostgreSQL and Nodemailer to send emails through Mailpit during development.

## Why These Technologies

**React Native + Expo** — Write once for both platforms. Expo simplifies the build process and provides useful modules like SecureStore and Router out of the box.

**Express** — Lightweight, well-documented, and widely used. No unnecessary complexity for a REST API of this size.

**PostgreSQL + Prisma** — PostgreSQL is reliable and handles relational data well (users, tasks, categories, many-to-many). Prisma provides type-safe queries and easy migrations.

**JWT** — Stateless authentication that works well with mobile apps. The token is stored in SecureStore on the device.

**Zod** — Shared validation approach on both frontend and backend. Simple to define schemas and get clear error messages.

**Zustand** — Minimal state management. Only the auth state (token, user) is shared globally. Everything else uses local React state.

## Authentication

### Password Storage
Passwords are hashed with bcrypt (10 salt rounds) before storage. The original password is never stored or logged.

### OTP Flow
1. A 6-digit OTP is generated using `crypto.randomInt`
2. The OTP is hashed with bcrypt before storing in the database
3. The raw OTP is sent via email, then discarded from memory
4. On verification, the submitted code is compared against the hash
5. Each OTP expires after 10 minutes, allows max 5 attempts, and can only be used once
6. A 30-second cooldown prevents resend spam

### JWT
After successful login, the server issues a JWT containing the user ID. The mobile app stores it in Expo SecureStore (encrypted storage). The token is attached to every authenticated request via an Axios interceptor.

## Trade-offs

**No refresh tokens** — For simplicity, I used a single JWT with a 7-day expiry. In production, I'd add refresh tokens to handle token rotation without forcing re-login.

**No password reset** — Not required by the assignment. Would be a natural next feature using the same OTP mechanism.

**Simple search** — The task search filters client-side since there are only ~24 tasks. For a larger catalogue, I'd move search to the backend with database-level filtering.

**No real-time updates** — The app fetches data on screen load. For a production app with multiple users or a Lifestyle Manager dashboard, WebSockets or polling would be needed.

**Business Name is optional** — A household user may not have a business. Making it required would add friction to onboarding without clear benefit.

## What Was Left Out

- Password reset flow
- Push notifications
- Task execution / order tracking
- Production email service (SendGrid, AWS SES)
- Admin dashboard
- Social login (Google, Apple)
- Advanced analytics
- Profile photo upload
- Rate limiting / brute-force protection (beyond OTP attempts)

## What I Would Build Next

With another week, I would add:

1. **Password reset** — Reuse the OTP mechanism for "forgot password" flow
2. **Refresh tokens** — Implement token rotation for better security
3. **Rate limiting** — Add express-rate-limit to prevent brute-force attacks
4. **Profile editing** — Allow users to update their profile after initial setup
5. **Better error handling on mobile** — Toast notifications instead of alerts
6. **Task categories as tabs** — Horizontal scrollable category tabs for faster navigation
7. **End-to-end tests** — Test the full flow on mobile with Detox or Maestro
8. **CI/CD** — GitHub Actions for automated tests and APK builds
