# Nova IoT Systems — FieldOps Backend

This is the backend service for Nova IoT Systems' field operations team, built to manage devices, service tickets, and technician assignments.

## 🚀 Overview & Architecture

This project is built as a **Fullstack Application entirely in Next.js**, using the App Router.
While Next.js is often seen as a frontend framework, its **API Routes** act as a robust Node.js backend. 
- **Frontend UI**: A simple React testing dashboard (`/`) to interact with the API endpoints.
- **Backend API**: The REST API lives in `src/app/api/v1/`.
- **Database**: PostgreSQL (hosted on Neon) accessed via **Prisma ORM**.
- **Authentication**: Custom JWT-based authentication using `jose` and `bcryptjs`. Role-based access control (RBAC) is enforced server-side using Next.js Middleware (`src/middleware.ts`).

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database URL (Neon or local)

### Installation
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in your secrets:
   ```env
   DATABASE_URL="postgresql://<user>:<password>@<host>/<database>?sslmode=require"
   JWT_SECRET="your_super_secret_key"
   ```
4. Push the database schema:
   ```bash
   npx prisma db push
   ```
   *(Alternatively, run `npx prisma migrate dev` to track migration history)*
5. Start the development server:
   ```bash
   npm run dev
   ```

## 🗺️ Database Schema & Relationships

The database is built with three primary entities:
- **User**: Represents `ADMIN` or `TECHNICIAN` roles.
- **Device**: Represents field devices (sensors, gateways).
- **Ticket**: Represents maintenance or fault tickets.

**Relationships**:
- A **Ticket** belongs to one **Device** (1-to-many from Device to Ticket).
- A **Ticket** can be assigned to one **User (Technician)** (1-to-many from User to Ticket).

**Indexes**:
- We placed indexes on `tickets.status`, `tickets.assignedTechnicianId`, and `tickets.slaDueAt` because the common query pattern involves filtering tickets by their status (e.g., finding active tickets for a technician) or checking overdue SLAs during escalation checks.

## 🧠 Business Logic Implementation

### 1. Escalation Rule
Tickets have an SLA (Service Level Agreement) deadline based on their priority (CRITICAL = 4h, HIGH = 24h, MEDIUM = 3d, LOW = 7d).
- **Implementation**: The escalation logic is implemented in `src/services/escalation.service.ts`.
- **Trigger Mechanism**: It is triggered via a "lazy check-on-read" mechanism. Every time tickets are fetched via `GET /api/v1/tickets`, the system automatically scans for any unresolved ticket where `slaDueAt < now` and upgrades its priority/status to `ESCALATED`.
- Admins can also force a global check via `POST /api/v1/tickets/run-escalations`.

### 2. Technician Capacity Rule
- **Rule**: A technician can have a maximum of **5** active tickets (`ASSIGNED` or `IN_PROGRESS`) at any given time.
- **Implementation**: This is enforced server-side during the `PATCH /api/v1/tickets/[id]/assign` endpoint. The server queries the count of active tickets for the requested technician. If it exceeds the threshold (5), the API rejects the assignment with a `409 Conflict`.

## 🌤️ External API Integration (Weather Risk)

When a fault is reported (`POST /api/v1/devices/[id]/fault`), the system calls the **Open-Meteo Current Weather API**.
- **Why Open-Meteo?** It requires no API key, provides granular current weather data, and easily accepts coordinates.
- **Integration Flow**: We pass the device's `siteLocation` (expected as "lat,lng") to Open-Meteo.
- **Transformation**: If wind speed > 40km/h or precipitation > 10mm, we set the risk flag to `SEVERE`. If wind > 20km/h, it's `CAUTION`. Otherwise, `NONE`.
- **Fallback Behavior**: If the API times out (5s), returns a non-200, or network fails, the system gracefully catches the error and defaults the ticket's `weatherRiskFlag` to `UNKNOWN`. **Ticket creation is never blocked by external API failure.**

## 🧪 Testing

Unit tests cover the core business logic (SLA calculation) and the external API integration (including mocked failure scenarios).

Run tests via:
```bash
npx jest
```

## 📖 API Documentation (Swagger)

The API is fully documented using Swagger/OpenAPI.

- **To view the Swagger Docs**: Run the development server (`npm run dev`) and navigate to `http://localhost:3000/api/docs` (if implemented) or refer to the `swagger.yaml` file in the repository root. *(Note: Next.js API Routes don't ship with native Swagger UI out-of-the-box, but you can import the provided `swagger.json` / `openapi.yaml` into Postman or Swagger Editor to view all endpoint contracts).*

## 🔑 Test Credentials

If you need to test the application quickly, you can use or register the default Admin account:

- **Email**: `admin@novaiot.com`
- **Password**: `AdminPassword123!`

*(Note: If the account doesn't exist yet in your local database, use the Register page on the dashboard to create it using these exact credentials and select the ADMIN role).*

---
*AI Usage Disclosure: This project was scaffolded and implemented with the assistance of an AI coding agent to rapidly prototype the Next.js and Prisma boilerplate, while ensuring custom business logic and strict RBAC were correctly enforced according to instructions.*
