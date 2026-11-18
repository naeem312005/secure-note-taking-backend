# Secure Note-Taking Application — Backend

Production-ready REST API for the CareGuide Technical Interview Assignment, engineered with Node.js, Express, MongoDB, Mongoose, JWT authentication, Role-Based Access Control (RBAC), and high-performance MongoDB indexing and aggregation pipelines.

---

## Architecture & Design Highlights

- **Layered Clean Architecture**:
  - `controllers/`: Handles HTTP requests, validations, and status codes.
  - `services/`: Encapsulates business logic, domain rules, and security checks.
  - `repositories/`: Abstracted data access layer for clean, testable MongoDB queries.
  - `middlewares/`: JWT verification, RBAC authorization, express-validator handler, rate limiting, and centralized error handling.
  - `models/`: Mongoose schemas with explicit `schema.index()` declarations.
- **Enterprise Security**:
  - Secure bcrypt hashing (salt rounds: 10) with automatic pre-save hooks.
  - Passwords excluded from query projections and JSON serialization (`select: false` & `toJSON` transform).
  - Rate limiting on authentication routes (prevent credential stuffing).
  - Strict Helmet headers, CORS policies, and request size limiting.
  - Prevention of privilege escalation during registration.
- **Database Optimization & Evaluation Compliance**:
  - Compound indexing with MongoDB ESR (Equality, Sort, Range) rule.
  - Mandatory Single-Pipeline Aggregations (Scenario 1 Interests Grouping & Scenario 2 $lookup).
  - 100% test coverage with 49 automated integration tests using in-memory MongoDB.

---

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- MongoDB instance or MongoDB Atlas URI (or automated in-memory MongoDB for tests)

---

## Installation & Setup

1. Clone or navigate to the backend repository:
   ```bash
   cd secure-note-taking-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` if necessary:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/secure_notes_db
   JWT_SECRET=super_secret_jwt_key_careguide_2026_change_in_production
   JWT_EXPIRES_IN=24h
   CLIENT_URL=http://localhost:5173
   ADMIN_NAME="System Administrator"
   ADMIN_EMAIL=admin@example.com
   ADMIN_PASSWORD=Admin@123456
   ```

---

## Available NPM Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Start development server with hot-reload via nodemon |
| `npm start` | Start production server |
| `npm test` | Run complete automated test suite with Vitest and in-memory MongoDB |
| `npm run seed` | Seed database with initial admin, sample users, notes, and posts |
| `npm run verify:indexes` | Run execution plan verification with `.explain('executionStats')` |

---

## Verifying Database Indexing & Aggregations

To verify the exact query execution plans (`IXSCAN`) and see the indexes in action:

```bash
npm run verify:indexes
```

To run all automated test suites:

```bash
npm test
```

Read detailed documentation:
- [INDEXING.md](./INDEXING.md): Index definitions, ESR rules, execution plan stats, and queries supported.
- [AGGREGATION.md](./AGGREGATION.md): Single-pipeline aggregation implementations, constraints, and results.
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md): Complete REST endpoint specifications.

---

## Deployment on Render

This backend includes `render.yaml` for 1-click deployment on Render:

1. Create a new **Web Service** on [Render](https://render.com).
2. Connect your GitHub repository `secure-note-taking-backend`.
3. Set the following build configuration:
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/health`
4. Provide environment variables in the Render dashboard:
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: `<Your MongoDB Atlas connection URI>`
   - `JWT_SECRET`: `<Secure random 32+ character secret>`
   - `CLIENT_URL`: `<Your Vercel frontend URL>`
