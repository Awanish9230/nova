# 🧪 FieldOps API Testing & Demo Guide

This document provides a step-by-step script for testing the API. You can follow these exact steps while recording your demo video to prove that all business logic requirements are fully met.

> **Tip**: You can run the `curl` commands in your VSCode Terminal, or copy the JSON bodies into Postman.

---

## Step 1: Start the System
Ensure your database is connected and your Next.js server is running:
```bash
npm run dev
```
Keep the terminal open so you can see the server logs if needed.

---

## Step 2: Create Users (Auth & RBAC)
You need two users to demonstrate role-based access control and assignment logic.

**Create the Admin User:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
-H "Content-Type: application/json" \
-d "{\"name\": \"Admin Alice\", \"email\": \"admin@novaiot.com\", \"password\": \"Password123!\", \"role\": \"ADMIN\"}"
```

**Create a Technician User:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
-H "Content-Type: application/json" \
-d "{\"name\": \"Tech Bob\", \"email\": \"bob@novaiot.com\", \"password\": \"Password123!\", \"role\": \"TECHNICIAN\"}"
```

*(Note down the Technician's ID returned in the JSON response, you will need it later for assignments!)*

---

## Step 3: Log In to the Dashboard
1. Open your browser and go to `http://localhost:3000`.
2. In the glowing glass panel on the left, log in with:
   - **Email:** `admin@novaiot.com`
   - **Password:** `Password123!`
3. You should see "Authenticated as ADMIN" and the control center buttons will appear.

---

## Step 4: Create a Device (Admin API)
Since the UI is for testing Tickets, we use the API to create the field device.
*Note: You need the Admin JWT token. For ease of testing, Next.js allows this specific device route to be tested without the token in some environments, but assuming middleware is strict, grab the token from the UI's log or network tab, OR just use this simplified curl if you temporarily disable auth for devices, or pass the token.*

Assuming you have your token (replace `$TOKEN` with your actual token):
```bash
curl -X POST http://localhost:3000/api/v1/devices \
-H "Content-Type: application/json" \
-H "Authorization: Bearer $TOKEN" \
-d "{\"name\": \"Sensor Alpha\", \"deviceType\": \"Temperature Sensor\", \"siteLocation\": \"40.7128,-74.0060\"}"
```
*(Note down the returned Device ID)*

---

## Step 5: Report a Fault (Weather Integration)
Now simulate the device breaking down. This triggers the Open-Meteo API.
Replace `<DEVICE_ID>` with the ID from Step 4.

```bash
curl -X POST http://localhost:3000/api/v1/devices/<DEVICE_ID>/fault \
-H "Content-Type: application/json" \
-H "Authorization: Bearer $TOKEN" \
-d "{\"description\": \"Sensor overheating and offline\", \"priority_hint\": \"CRITICAL\"}"
```
**What to highlight in your video:** 
Explain that the backend just called the Open-Meteo API using the device's coordinates. Look at the response: `weatherRiskFlag` will be calculated, and `slaDueAt` will be strictly set to 4 hours from now because it is `CRITICAL`.

---

## Step 6: View Tickets in Dashboard
1. Go back to your browser at `http://localhost:3000`.
2. Click **Refresh Tickets**.
3. You will see the new ticket appear in the right column! Notice the red CRITICAL badge and the weather risk.

---

## Step 7: Demonstrate Technician Capacity (Max 5)
To show the limit works, we will try to assign tickets to Tech Bob.
Replace `<TICKET_ID>` and `<TECH_ID>` with your real IDs.

```bash
curl -X PATCH http://localhost:3000/api/v1/tickets/<TICKET_ID>/assign \
-H "Content-Type: application/json" \
-H "Authorization: Bearer $TOKEN" \
-d "{\"technician_id\": \"<TECH_ID>\"}"
```
**To trigger the rejection (409 Conflict):**
Run that assignment command on 6 different tickets for the same Technician ID. On the 6th attempt, the API will reject it with: `"Technician is at maximum capacity (5 active tickets)"`.

---

## Step 8: Demonstrate Escalation Logic
1. Go into your Neon Database dashboard (or use Prisma Studio `npx prisma studio`).
2. Find the ticket you created and edit its `slaDueAt` timestamp to be **in the past** (e.g., yesterday).
3. Go back to the web UI at `localhost:3000`.
4. Click the red **Force Escalation Check** button (or just click Refresh Tickets, which triggers the lazy-on-read logic).
5. Watch the ticket visually upgrade to **ESCALATED** status with a glowing red border!

---
*End of Demo Script. This covers Auth, External API fallback, strict Capacity constraints, and SLA Escalations perfectly.*
