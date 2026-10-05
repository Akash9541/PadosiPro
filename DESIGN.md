# PadosiPro Design

## Architecture

The project uses a small client-server architecture:

```text
React Native / Expo
        | HTTP + JSON
        v
Express API (TypeScript)
        | Prisma ORM
        v
PostgreSQL

Express -- SMTP --> Mailpit
                         |
                         v
                 http://localhost:8025
```

The mobile app uses React Native and Expo Router. It communicates with the Express REST API over HTTP and JSON. Prisma persists users, OTP verifications, categories, tasks, and selections in PostgreSQL. Nodemailer sends OTP emails to Mailpit for local development/testing. Mailpit captures OTP messages locally instead of delivering them to a normal inbox; developers can view them at `http://localhost:8025`. Docker Compose starts PostgreSQL, Mailpit, and the backend on the same network.

## Main Trade-offs

- **JWT without refresh tokens:** Authentication uses a seven-day JWT stored with Expo SecureStore. Refresh-token rotation is omitted to keep the assignment scope small.
- **Client-side task search:** The catalogue is small, so search filters the fetched tasks on the device rather than adding a database search endpoint.
- **Business name is optional:** Household customers may not have a business, so requiring it would add friction without helping this onboarding flow.
- **Mailpit for email testing:** Mailpit provides a local SMTP server and web interface for previewing OTP emails during development. It avoids requiring a real email provider for local testing and is not a production email provider.

## What Is Left Out

Password reset, refresh-token rotation, rate limiting beyond OTP attempt controls, profile editing, push notifications, task fulfillment and order tracking, an admin dashboard, social login, profile images, and automated mobile end-to-end testing are outside the current scope.

## What I Would Build Next

With another week, I would add password reset using the OTP flow, refresh-token rotation, rate limiting for authentication endpoints, profile editing, and automated end-to-end tests for registration through task confirmation on a device or emulator. I would also move OTP delivery to a production email provider before any public launch.
